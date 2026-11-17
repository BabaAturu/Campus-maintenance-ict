import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import createApp from '../app.js';
import MaintenanceRequest, { INITIAL_REQUEST_STATUS } from '../models/MaintenanceRequest.js';
import { USER_ROLES } from '../models/User.js';
import { signAccessToken } from '../utils/auth.js';

process.env.JWT_SECRET = 'test-only-secret-that-is-never-used-outside-tests';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

class FakeUser {
  static records = new Map();
  static nextId = 1;

  constructor(values) {
    Object.assign(this, values);
    this._id = `staff-${FakeUser.nextId++}`;
    this.id = this._id;
    this.createdAt = new Date();
  }

  static async create(values) {
    const user = new FakeUser(values);
    FakeUser.records.set(user._id, user);
    return user;
  }

  static findOne(filter) {
    const user = [...FakeUser.records.values()].find((item) => item.email === filter.email) ?? null;
    return { select: async () => user };
  }

  static async findById(id) {
    return FakeUser.records.get(String(id)) ?? null;
  }
}

class FakeRequest {
  static records = new Map();

  static async create(values) {
    const id = `${FakeRequest.records.size + 1}`.padStart(24, '0');
    const request = {
      ...values,
      _id: id,
      id,
      status: values.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    FakeRequest.records.set(id, request);
    return request;
  }

  static find(filter) {
    return {
      sort: async () => [...FakeRequest.records.values()]
        .filter((request) => request.requester === filter.requester)
        .sort((left, right) => right.createdAt - left.createdAt),
    };
  }

  static async findById(id) {
    return FakeRequest.records.get(String(id)) ?? null;
  }
}

let server;
let baseUrl;
const origin = process.env.FRONTEND_ORIGIN;

test('new MaintenanceRequest documents default to the initial Pending status', () => {
  assert.equal(new MaintenanceRequest().status, INITIAL_REQUEST_STATUS);
});

before(async () => {
  FakeUser.records.clear();
  FakeRequest.records.clear();
  FakeUser.nextId = 1;
  server = createApp({ UserModel: FakeUser, RequestModel: FakeRequest }).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

function request(path, { method = 'GET', body, cookie } = {}) {
  const isFormData = body instanceof FormData;
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Origin: origin,
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
  });
}

function cookieFrom(response) {
  return response.headers.get('set-cookie')?.split(';', 1)[0];
}

function profile(email) {
  return {
    fullName: 'Campus Test Staff',
    email,
    phone: '+1 555 123 4567',
    department: 'Facilities',
    password: 'a-secure-test-password',
    confirmPassword: 'a-secure-test-password',
  };
}

async function registerAndLogin(email) {
  const registered = await request('/api/auth/register', {
    method: 'POST',
    body: profile(email),
  });
  assert.equal(registered.status, 201);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'a-secure-test-password' },
  });
  assert.equal(login.status, 200);
  return cookieFrom(login);
}

const validRequest = {
  title: 'Broken desktop computer',
  category: 'Computer Hardware',
  description: 'The desktop does not power on.',
  building: 'Science Building',
  room: '204',
  priority: 'HIGH',
};

test('Staff can register, log in, submit, and retrieve only their own requests', async () => {
  const firstStaffCookie = await registerAndLogin('requester-one@example.edu');
  const secondStaffCookie = await registerAndLogin('requester-two@example.edu');

  const created = await request('/api/requests', {
    method: 'POST',
    cookie: firstStaffCookie,
    body: {
      ...validRequest,
      requester: 'requester-two',
      status: 'RESOLVED',
      assignedTechnician: 'untrusted-technician',
      role: USER_ROLES.ICT_ADMIN,
    },
  });
  assert.equal(created.status, 201);
  const { request: saved } = await created.json();
  assert.equal(saved.status, INITIAL_REQUEST_STATUS);
  assert.equal(FakeRequest.records.get(saved._id).status, INITIAL_REQUEST_STATUS);
  assert.equal(saved.requester, 'staff-1');
  assert.equal(saved.category, 'Computer Hardware');

  const ownRequests = await request('/api/requests/my-requests', { cookie: firstStaffCookie });
  assert.equal(ownRequests.status, 200);
  assert.equal((await ownRequests.json()).requests.length, 1);

  const otherRequests = await request('/api/requests/my-requests', { cookie: secondStaffCookie });
  assert.equal(otherRequests.status, 200);
  assert.equal((await otherRequests.json()).requests.length, 0);

  const ownDetail = await request(`/api/requests/${saved._id}`, { cookie: firstStaffCookie });
  assert.equal(ownDetail.status, 200);
  const forbiddenDetail = await request(`/api/requests/${saved._id}`, { cookie: secondStaffCookie });
  assert.equal(forbiddenDetail.status, 404);
  assert.match((await forbiddenDetail.json()).message, /not found/i);
});

test('request routes require authentication and reject missing or invalid fields', async () => {
  const anonymous = await request('/api/requests', {
    method: 'POST',
    body: validRequest,
  });
  assert.equal(anonymous.status, 401);

  const cookie = await registerAndLogin('invalid-request@example.edu');
  const missing = await request('/api/requests', {
    method: 'POST',
    cookie,
    body: { ...validRequest, room: '  ' },
  });
  assert.equal(missing.status, 400);

  const invalidCategory = await request('/api/requests', {
    method: 'POST',
    cookie,
    body: { ...validRequest, category: 'Unrecognized category' },
  });
  assert.equal(invalidCategory.status, 400);

  const invalidPriority = await request('/api/requests', {
    method: 'POST',
    cookie,
    body: { ...validRequest, priority: 'CRITICAL' },
  });
  assert.equal(invalidPriority.status, 400);

  const invalidId = await request('/api/requests/not-an-object-id', { cookie });
  assert.equal(invalidId.status, 400);
});

test('Staff can attach one supported file to a request and retrieve it', async () => {
  const cookie = await registerAndLogin('attachment-request@example.edu');
  const formData = new FormData();
  Object.entries(validRequest).forEach(([key, value]) => formData.append(key, value));
  formData.append('attachment', new Blob(['%PDF-1.4 test attachment'], { type: 'application/pdf' }), 'proof.pdf');

  const response = await request('/api/requests', {
    method: 'POST',
    cookie,
    body: formData,
  });
  assert.equal(response.status, 201);
  const { request: saved } = await response.json();
  assert.match(saved.attachmentUrl, /^\/uploads\/[\w-]+\.pdf$/);

  try {
    const uploadedFile = await fetch(`${baseUrl}${saved.attachmentUrl}`);
    assert.equal(uploadedFile.status, 200);
    assert.equal(await uploadedFile.text(), '%PDF-1.4 test attachment');
  } finally {
    await unlink(fileURLToPath(new URL(`../uploads/${saved.attachmentUrl.split('/').pop()}`, import.meta.url)));
  }
});

test('request attachment rejects unsupported types and files larger than 5 MB', async () => {
  const cookie = await registerAndLogin('invalid-attachment@example.edu');
  const unsupported = new FormData();
  Object.entries(validRequest).forEach(([key, value]) => unsupported.append(key, value));
  unsupported.append('attachment', new Blob(['not an image'], { type: 'text/plain' }), 'notes.txt');
  const unsupportedResponse = await request('/api/requests', {
    method: 'POST',
    cookie,
    body: unsupported,
  });
  assert.equal(unsupportedResponse.status, 400);
  assert.match((await unsupportedResponse.json()).message, /JPG, PNG, GIF, WEBP, or PDF/i);

  const oversized = new FormData();
  Object.entries(validRequest).forEach(([key, value]) => oversized.append(key, value));
  oversized.append('attachment', new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'application/pdf' }), 'large.pdf');
  const oversizedResponse = await request('/api/requests', {
    method: 'POST',
    cookie,
    body: oversized,
  });
  assert.equal(oversizedResponse.status, 413);
  assert.match((await oversizedResponse.json()).message, /5 MB or smaller/i);
});

test('authenticated non-Staff users cannot use Staff request endpoints', async () => {
  const admin = await FakeUser.create({
    ...profile('admin-request@example.edu'),
    password: await bcrypt.hash('admin-password', 12),
    role: USER_ROLES.ICT_ADMIN,
    isActive: true,
  });
  const adminCookie = `cmrs_access=${signAccessToken(admin._id)}`;
  const response = await request('/api/requests/my-requests', { cookie: adminCookie });
  assert.equal(response.status, 403);
});
