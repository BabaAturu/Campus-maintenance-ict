import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import bcrypt from 'bcryptjs';
import createApp from '../app.js';
import { USER_ROLES } from '../models/User.js';
import { signAccessToken } from '../utils/auth.js';

process.env.JWT_SECRET = 'test-only-secret-that-is-never-used-outside-tests';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

class FakeUser {
  static records = new Map();
  static nextId = 1;

  constructor(values) {
    Object.assign(this, values);
    this._id = String(FakeUser.nextId++);
    this.id = this._id;
    this.createdAt = new Date();
  }

  async save() {
    FakeUser.records.set(this._id, this);
    return this;
  }

  static async create(values) {
    if (values.email === 'write-concern@example.edu') {
      const error = new Error(
        'Write concern timed out for write-concern@example.edu password=must-not-be-logged',
      );
      error.name = 'MongoWriteConcernError';
      error.code = 64;
      error.codeName = 'WriteConcernFailed';
      throw error;
    }
    if ([...FakeUser.records.values()].some((user) => user.email === values.email)) {
      const error = new Error('Duplicate email');
      error.code = 11000;
      throw error;
    }
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

  static async find() {
    return [...FakeUser.records.values()];
  }

  static async countDocuments(filter) {
    return [...FakeUser.records.values()].filter(
      (user) => user.role === filter.role && user.isActive === filter.isActive,
    ).length;
  }

  static async exists(filter) {
    return [...FakeUser.records.values()].some((user) => user.role === filter.role) || null;
  }
}

let server;
let baseUrl;
const origin = process.env.FRONTEND_ORIGIN;

before(async () => {
  FakeUser.records.clear();
  server = createApp({ UserModel: FakeUser }).listen(0, '127.0.0.1');
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
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Origin: origin,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function cookieFrom(response) {
  return response.headers.get('set-cookie')?.split(';', 1)[0];
}

function profile(email, extras = {}) {
  return {
    fullName: 'Campus Test User',
    email,
    phone: '+1 555 123 4567',
    department: 'Facilities',
    password: 'a-secure-test-password',
    confirmPassword: 'a-secure-test-password',
    ...extras,
  };
}

async function createAdmin(email) {
  return FakeUser.create({
    ...profile(email),
    password: await bcrypt.hash('admin-test-password', 12),
    role: USER_ROLES.ICT_ADMIN,
    isActive: true,
  });
}

test('public registration creates Staff only, hashes passwords, rejects privileged roles and duplicate emails', async () => {
  const email = 'staff-registration@example.edu';
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: profile(email, { role: USER_ROLES.ICT_ADMIN }),
  });
  assert.equal(response.status, 403);

  const created = await request('/api/auth/register', {
    method: 'POST',
    body: profile(email, { role: USER_ROLES.STAFF }),
  });
  assert.equal(created.status, 201);
  const data = await created.json();
  assert.equal(data.user.role, USER_ROLES.STAFF);
  assert.equal(Object.hasOwn(data.user, 'password'), false);
  assert.ok(cookieFrom(created)?.startsWith('cmrs_access='));

  const stored = FakeUser.records.get(data.user.id);
  assert.notEqual(stored.password, 'a-secure-test-password');
  assert.equal(await bcrypt.compare('a-secure-test-password', stored.password), true);

  const duplicate = await request('/api/auth/register', {
    method: 'POST',
    body: profile(email),
  });
  assert.equal(duplicate.status, 409);
});

test('login, current user, logout, and invalid credentials use the HttpOnly JWT cookie', async () => {
  const email = 'login-user@example.edu';
  await request('/api/auth/register', { method: 'POST', body: profile(email) });

  const badLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'incorrect-password' },
  });
  assert.equal(badLogin.status, 401);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'a-secure-test-password' },
  });
  assert.equal(login.status, 200);
  const cookie = cookieFrom(login);
  assert.match(login.headers.get('set-cookie'), /HttpOnly/i);

  const currentUser = await request('/api/auth/me', { cookie });
  assert.equal(currentUser.status, 200);
  assert.equal((await currentUser.json()).user.email, email);

  const logout = await request('/api/auth/logout', { method: 'POST', cookie });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/i);
  const afterLogout = await request('/api/auth/me', { cookie: '' });
  assert.equal(afterLogout.status, 401);
});

test('protected user APIs reject anonymous and Staff requests; Admin can create privileged accounts and manage roles', async () => {
  const anonymous = await request('/api/users');
  assert.equal(anonymous.status, 401);

  const staffLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'login-user@example.edu', password: 'a-secure-test-password' },
  });
  const staffCookie = cookieFrom(staffLogin);
  const forbidden = await request('/api/users/create-technician', {
    method: 'POST',
    body: profile('forbidden-tech@example.edu'),
    cookie: staffCookie,
  });
  assert.equal(forbidden.status, 403);

  const admin = await createAdmin('test-admin@example.edu');
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: admin.email, password: 'admin-test-password' },
  });
  const adminCookie = cookieFrom(adminLogin);

  const teamLeadResponse = await request('/api/users/create-team-lead', {
    method: 'POST',
    body: profile('team-lead@example.edu'),
    cookie: adminCookie,
  });
  assert.equal(teamLeadResponse.status, 201);
  assert.equal((await teamLeadResponse.json()).user.role, USER_ROLES.ICT_TECHNICIAN_TEAM_LEAD);

  const technicianResponse = await request('/api/users/create-technician', {
    method: 'POST',
    body: profile('technician@example.edu'),
    cookie: adminCookie,
  });
  assert.equal(technicianResponse.status, 201);
  const technician = (await technicianResponse.json()).user;
  assert.equal(technician.role, USER_ROLES.ICT_TECHNICIAN);

  const usersResponse = await request('/api/users', { cookie: adminCookie });
  assert.equal(usersResponse.status, 200);
  assert.equal((await usersResponse.json()).users.length, 5);

  const roleResponse = await request(`/api/users/${technician.id}/role`, {
    method: 'PATCH',
    body: { role: USER_ROLES.STAFF },
    cookie: adminCookie,
  });
  assert.equal(roleResponse.status, 200);
  assert.equal((await roleResponse.json()).user.role, USER_ROLES.STAFF);

  const invalidRole = await request(`/api/users/${technician.id}/role`, {
    method: 'PATCH',
    body: { role: 'SUPER_ADMIN' },
    cookie: adminCookie,
  });
  assert.equal(invalidRole.status, 400);
});

test('inactive accounts cannot log in or continue using an existing token', async () => {
  const admin = await createAdmin('status-admin@example.edu');
  const user = await FakeUser.create({
    ...profile('inactive-user@example.edu'),
    password: await bcrypt.hash('inactive-test-password', 12),
    role: USER_ROLES.STAFF,
    isActive: true,
  });
  const adminCookie = `cmrs_access=${signAccessToken(admin._id)}`;

  const statusResponse = await request(`/api/users/${user.id}/status`, {
    method: 'PATCH',
    body: { isActive: false },
    cookie: adminCookie,
  });
  assert.equal(statusResponse.status, 200);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email: user.email, password: 'inactive-test-password' },
  });
  assert.equal(login.status, 403);

  const oldToken = `cmrs_access=${signAccessToken(user._id)}`;
  const current = await request('/api/auth/me', { cookie: oldToken });
  assert.equal(current.status, 401);
});

test('mutating API requests reject an unexpected origin', async () => {
  const response = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Origin: 'https://untrusted.example' },
  });
  assert.equal(response.status, 403);
});

test('development CORS and registration allow local Vite frontend origins', async () => {
  const preflight = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://127.0.0.1:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5173');

  const fallbackPreflight = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5174',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  assert.equal(fallbackPreflight.status, 204);
  assert.equal(fallbackPreflight.headers.get('access-control-allow-origin'), 'http://localhost:5174');

  const registration = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      Origin: 'http://localhost:5174',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile('loopback-origin@example.edu')),
  });
  assert.equal(registration.status, 201);
  assert.equal(registration.headers.get('access-control-allow-origin'), 'http://localhost:5174');
});

test('write concern failures return a retry-safe message and log only redacted diagnostics', async () => {
  const originalError = console.error;
  const logs = [];
  console.error = (...args) => logs.push(args);
  let response;
  try {
    response = await request('/api/auth/register', {
      method: 'POST',
      body: profile('write-concern@example.edu'),
    });
  } finally {
    console.error = originalError;
  }

  assert.equal(response.status, 503);
  assert.match((await response.json()).message, /may already exist/i);
  const diagnostics = JSON.stringify(logs);
  assert.match(diagnostics, /MongoWriteConcernError/);
  assert.match(diagnostics, /WriteConcernFailed/);
  assert.match(diagnostics, /REDACTED_EMAIL/);
  assert.doesNotMatch(diagnostics, /write-concern@example\.edu/);
  assert.doesNotMatch(diagnostics, /must-not-be-logged/);
});
