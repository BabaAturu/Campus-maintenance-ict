import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ACCESS_TOKEN_COOKIE, getJwtSecret } from '../utils/auth.js';
import HttpError from '../utils/HttpError.js';

function requestToken(req) {
  return req.cookies?.[ACCESS_TOKEN_COOKIE] ?? null;
}

export function createAuthMiddleware(UserModel = User) {
  return async function authenticate(req, res, next) {
    const token = requestToken(req);
    if (!token) return next(new HttpError(401, 'Authentication is required.'));

    try {
      const payload = jwt.verify(token, getJwtSecret(), {
        algorithms: ['HS256'],
        audience: 'cmrs-client',
        issuer: 'cmrs-api',
      });
      if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
        throw new HttpError(401, 'Invalid or expired authentication token.');
      }

      const user = await UserModel.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new HttpError(401, 'This account is unavailable.');
      }
      req.user = user;
      return next();
    } catch (error) {
      if (error instanceof HttpError) return next(error);
      return next(new HttpError(401, 'Invalid or expired authentication token.'));
    }
  };
}

export function authorizeRoles(...roles) {
  return function authorize(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You are not authorized to perform this action.'));
    }
    return next();
  };
}
