import jwt from 'jsonwebtoken';
import HttpError from './HttpError.js';

export const ACCESS_TOKEN_COOKIE = 'cmrs_access';
export const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

export function signAccessToken(userId) {
  return jwt.sign(
    {},
    getJwtSecret(),
    {
      algorithm: 'HS256',
      audience: 'cmrs-client',
      expiresIn: '15m',
      issuer: 'cmrs-api',
      subject: String(userId),
    },
  );
}

export function setAccessTokenCookie(res, token) {
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearAccessTokenCookie(res) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function publicUser(user) {
  return {
    id: String(user._id ?? user.id),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    department: user.department,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function validateProfile(body) {
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const department = typeof body.department === 'string' ? body.department.trim() : '';
  const errors = {};

  if (!fullName || fullName.length > 120) errors.fullName = 'Enter a name of 1 to 120 characters.';
  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.email = 'Enter a valid email address.';
  }
  if (
    phone.length < 7 ||
    phone.length > 30 ||
    !/^[0-9+().\s-]+$/.test(phone)
  ) {
    errors.phone = 'Enter a valid phone number.';
  }
  if (!department || department.length > 120) {
    errors.department = 'Enter a department of 1 to 120 characters.';
  }

  if (Object.keys(errors).length) {
    throw new HttpError(400, 'Please correct the provided profile details.');
  }

  return { fullName, email: normalizeEmail(email), phone, department };
}

export function validatePassword(password) {
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw new HttpError(400, 'Password must be at least 8 characters and no more than 72 bytes.');
  }
}

export function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

export function redactSecrets(message) {
  return String(message)
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[REDACTED_MONGODB_URI]')
    .replace(/\b([^/\s:@]+):([^/\s@]+)@/g, '[REDACTED_CREDENTIALS]@');
}
