import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import bcrypt from 'bcryptjs';
import createApp from '../app.js';
import { USER_ROLES } from '../models/User.js';
import { signAccessToken } from '../utils/auth.js';

process.env.JWT_SECRET = 'test-only-secret-that-is-never-used-outside-tests';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

function matches(record, filter) {
  return Object.entries(filter).every(([key, condition]) => {
    if (key === '$or') return condition.some((part) => matches(record, part));
    const value = record[key];
    if (condition && typeof condition === 'object' && '$regex' in condition) {
      return new RegExp(condition.$regex, condition.$options).test(String(value ?? ''));
    }
    if (condition && typeof condition === 'object' && '$in' in condition) {
      return condition.$in.includes(value);
    }
    return value === condition;
  });
}

class FakeUser {
  static records = new Map();
  static nextId = 1;

  constructor(values) {
    Object.assign(this, values);
    this._id = (FakeUser.nextId++).toString(16).padStart(24, 'a');
    this.id = this._id;
    this.createdAt ??= new Date();
  }

  async save() {
    FakeUser.records.set(this._id, this);
    return this;
  }

  static async create(values) {
    if ([...FakeUser.records.values()].some((item) => item.email === values.email)) {
      const error = new Error('Duplicate email');
      error.code = 11000;
      throw error;
    }
    const user = new FakeUser(values);
    FakeUser.records.set(user._id, user);
    return user;
  }

  static async findById(id) {
    return FakeUser.records.get(String(id).toLowerCase()) ?? null;
  }

  static find(filter = {}) {
    const records = [...FakeUser.records.values()].filter((item) => matches(item, filter));
    return {
      sort: async (sort) => records.sort((left, right) => {
        const direction = sort.createdAt ?? 1;
        return (new Date(left.createdAt) - new Date(right.createdAt)) * direction;
      }),
    };
  }

  static async countDocuments(filter = {}) {
    return [...FakeUser.records.values()].filter((item) => matches(item, filter)).length;
  }
}

class FakeRequest {
  static records = new Map();

  static find(filter = {}) {
    const records = [...FakeRequest.records.values()].filter((item) => matches(item, filter));
    return {
      sort: async (sort) => records.sort((left, right) => {
        const direction = sort.createdAt ?? 1;
        return (new Date(left.createdAt) - new Date(right.createdAt)) * direction;
      }),
    };
  }

  static async countDocuments(filter = {}) {
    return [...FakeRequest.records.values()].filter((item) => matches(item, filter)).length;
  }
}

let server;
let baseUrl;
const origin = process.env.FRONTEND_ORIGIN;
const profile = (email, extras = {}) => ({
  fullName: 'Campus Admin Test',
  email,
  phone: '+1 555 123 4567',
  department: 'ICT Services',
  password: 'a-secure-test-password',
  confirmPassword: 'a-secure-test-password',
  ...extras,
});
const requestData = (id, status, extras = {}) => ({
  _id: id,
  title: `Request ${id}`,
  category: 'Computer Hardware',
  description: 'Test request description.',
  building: 'Science Building',
  room: '204',
  priority: 'HIGH',
  status,
  requester: '000000000000000000000002',
  assignedTechnician: null,
  attachmentUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...extras,
});

before(async () => {
  FakeUser.records.clear();
  FakeUser.nextId = 1;
  FakeRequest.records.clear();

  const accounts = [
    { ...profile('admin@example.edu'), role: USER_ROLES.ICT_ADMIN },
    { ...profile('staff@example.edu'), role: USER_ROLES.STAFF },
    { ...profile('tech@example.edu'), role: USER_ROLES.ICT_TECHNICIAN },
    { ...profile('lead@example.edu'), role: USER_ROLES.ICT_TECHNICIAN_TEAM_LEAD },
  ];
  for (const account of accounts) {
    account.password = await bcrypt.hash(account.password, 12);
    await FakeUser.create({ ...account, isActive: true });
  }

  [
    requestData('000000000000000000000001', 'PENDING'),
    requestData('000000000000000000000002', 'SUBMITTED'),
    requestData('000000000000000000000003', 'RESOLVED'),
    requestData('000000000000000000000004', 'CLOSED', { priority: 'LOW' }),
    requestData('000000000000000000000005', 'REJECTED', { category: 'Network & Internet' }),
  ].forEach((item) => FakeRequest.records.set(item._id, item));

  server = createApp({ UserModel: FakeUser, RequestModel: FakeRequest }).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

function cookieFor(user) {
  return `cmrs_access=${signAccessToken(user._id)}`;
}

async function request(path, { method = 'GET', body, user } = {}) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Origin: origin,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(user ? { Cookie: cookieFor(user) } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function account(email) {
  return [...FakeUser.records.values()].find((item) => item.email === email);
}

test('all Admin API endpoints require an authenticated ICT_ADMIN role', async () => {
  const user = account('admin@example.edu');
  const staff = account('staff@example.edu');
  const technician = account('tech@example.edu');
  const teamLead = account('lead@example.edu');
  const paths = [
    ['/api/admin/dashboard/stats'],
    ['/api/admin/users'],
    ['/api/admin/requests'],
    ['/api/admin/users', { method: 'POST', body: profile('blocked@example.edu', { role: USER_ROLES.ICT_ADMIN }) }],
    ['/api/admin/users/ffffffffffffffffffffffff/status', { method: 'PATCH', body: { isActive: false } }],
  ];

  for (const [path, options = {}] of paths) {
    assert.equal((await request(path, options)).status, 401, `${path} should require authentication`);
    for (const roleUser of [staff, technician, teamLead]) {
      assert.equal((await request(path, { ...options, user: roleUser })).status, 403, `${path} should deny ${roleUser.role}`);
    }
    assert.notEqual((await request(path, { ...options, user })).status, 401);
  }
});

test('dashboard statistics are counted from user and request models', async () => {
  const response = await request('/api/admin/dashboard/stats', { user: account('admin@example.edu') });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).stats, {
    totalUsers: 4,
    totalStaff: 1,
    totalTechnicians: 1,
    totalRequests: 5,
    pendingRequests: 1,
    completedRequests: 2,
  });
});

test('Admin can list and search users, filter by role, and never receives password fields', async () => {
  const admin = account('admin@example.edu');
  const allResponse = await request('/api/admin/users', { user: admin });
  assert.equal(allResponse.status, 200);
  const allUsers = (await allResponse.json()).users;
  assert.equal(allUsers.length, 4);
  assert.equal(allUsers.some((item) => Object.hasOwn(item, 'password')), false);

  const filtered = await request('/api/admin/users?role=ICT_TECHNICIAN&search=tech%40example.edu', { user: admin });
  assert.equal(filtered.status, 200);
  const { users } = await filtered.json();
  assert.equal(users.length, 1);
  assert.equal(users[0].role, USER_ROLES.ICT_TECHNICIAN);

  assert.equal((await request('/api/admin/users?role=ROOT', { user: admin })).status, 400);
  assert.equal((await request(`/api/admin/users?search=${'x'.repeat(101)}`, { user: admin })).status, 400);
});

test('Admin can list requests and filter by status, category, and priority', async () => {
  const admin = account('admin@example.edu');
  const allResponse = await request('/api/admin/requests', { user: admin });
  assert.equal(allResponse.status, 200);
  const allRequests = (await allResponse.json()).requests;
  assert.equal(allRequests.length, 5);
  assert.equal(Object.hasOwn(allRequests[0], 'password'), false);

  const filtered = await request(
    '/api/admin/requests?status=CLOSED&category=Computer%20Hardware&priority=LOW',
    { user: admin },
  );
  assert.equal(filtered.status, 200);
  assert.equal((await filtered.json()).requests.length, 1);
  assert.equal((await request('/api/admin/requests?status=UNKNOWN', { user: admin })).status, 400);
  assert.equal((await request('/api/admin/requests?priority=CRITICAL', { user: admin })).status, 400);
});

test('Admin can create only hashed Technician and Team Lead accounts', async () => {
  const admin = account('admin@example.edu');
  const technician = await request('/api/admin/users', {
    method: 'POST',
    user: admin,
    body: profile('new-tech@example.edu', { role: USER_ROLES.ICT_TECHNICIAN }),
  });
  assert.equal(technician.status, 201);
  const technicianData = (await technician.json()).user;
  assert.equal(technicianData.role, USER_ROLES.ICT_TECHNICIAN);
  assert.equal(technicianData.isActive, true);
  assert.equal(Object.hasOwn(technicianData, 'password'), false);
  assert.equal(await bcrypt.compare('a-secure-test-password', account('new-tech@example.edu').password), true);

  const teamLead = await request('/api/admin/users', {
    method: 'POST',
    user: admin,
    body: profile('new-lead@example.edu', { role: USER_ROLES.ICT_TECHNICIAN_TEAM_LEAD }),
  });
  assert.equal(teamLead.status, 201);
  assert.equal((await teamLead.json()).user.role, USER_ROLES.ICT_TECHNICIAN_TEAM_LEAD);

  assert.equal((await request('/api/admin/users', {
    method: 'POST',
    user: admin,
    body: profile('admin-injection@example.edu', { role: USER_ROLES.ICT_ADMIN }),
  })).status, 400);
  assert.equal((await request('/api/admin/users', {
    method: 'POST',
    user: admin,
    body: profile('mismatch@example.edu', {
      role: USER_ROLES.ICT_TECHNICIAN,
      confirmPassword: 'different-password',
    }),
  })).status, 400);
});

test('Admin can activate and deactivate accounts with safe status guards', async () => {
  const admin = account('admin@example.edu');
  const staff = account('staff@example.edu');
  const statusPath = `/api/admin/users/${staff._id}/status`;

  const deactivated = await request(statusPath, {
    method: 'PATCH',
    user: admin,
    body: { isActive: false },
  });
  assert.equal(deactivated.status, 200);
  assert.equal((await deactivated.json()).user.isActive, false);

  const activated = await request(statusPath, {
    method: 'PATCH',
    user: admin,
    body: { isActive: true },
  });
  assert.equal(activated.status, 200);
  assert.equal((await activated.json()).user.isActive, true);

  assert.equal((await request('/api/admin/users/not-an-id/status', {
    method: 'PATCH',
    user: admin,
    body: { isActive: false },
  })).status, 400);
  assert.equal((await request(statusPath, {
    method: 'PATCH',
    user: admin,
    body: { isActive: 'false' },
  })).status, 400);
  assert.equal((await request(`/api/admin/users/${admin._id}/status`, {
    method: 'PATCH',
    user: admin,
    body: { isActive: false },
  })).status, 400);
  assert.equal((await request('/api/admin/users/ffffffffffffffffffffffff/status', {
    method: 'PATCH',
    user: admin,
    body: { isActive: false },
  })).status, 404);
});

test('Admin status updates cannot deactivate the current account', async () => {
  const peerAdmin = await FakeUser.create({
    ...profile('peer-admin@example.edu'),
    password: await bcrypt.hash('peer-admin-password', 12),
    role: USER_ROLES.ICT_ADMIN,
    isActive: true,
  });
  const admin = account('admin@example.edu');
  const response = await request(`/api/admin/users/${peerAdmin._id}/status`, {
    method: 'PATCH',
    user: admin,
    body: { isActive: false },
  });
  assert.equal(response.status, 200);
  assert.equal(peerAdmin.isActive, false);

  const selfDeactivation = await request(`/api/admin/users/${admin._id.toUpperCase()}/status`, {
    method: 'PATCH',
    user: admin,
    body: { isActive: false },
  });
  assert.equal(selfDeactivation.status, 400);
  assert.equal(admin.isActive, true);
});
