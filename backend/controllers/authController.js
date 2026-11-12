import bcrypt from 'bcryptjs';
import User, { USER_ROLES } from '../models/User.js';
import {
  clearAccessTokenCookie,
  isDuplicateKeyError,
  publicUser,
  setAccessTokenCookie,
  signAccessToken,
  validatePassword,
  validateProfile,
} from '../utils/auth.js';
import HttpError from '../utils/HttpError.js';

export function createAuthController(UserModel = User) {
  return {
    register: async (req, res) => {
      const requestedRole = req.body?.role;
      if (requestedRole !== undefined && requestedRole !== null) {
        if (typeof requestedRole !== 'string') {
          throw new HttpError(400, 'Invalid role.');
        }
        if (requestedRole.toUpperCase() !== USER_ROLES.STAFF) {
          throw new HttpError(403, 'Public registration is limited to Staff accounts.');
        }
      }

      const profile = validateProfile(req.body ?? {});
      validatePassword(req.body?.password);
      if (req.body.password !== req.body.confirmPassword) {
        throw new HttpError(400, 'Passwords do not match.');
      }

      const password = await bcrypt.hash(req.body.password, 12);
      let user;
      try {
        user = await UserModel.create({
          ...profile,
          password,
          role: USER_ROLES.STAFF,
          isActive: true,
        });
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new HttpError(409, 'An account with this email already exists.');
        }
        throw error;
      }

      setAccessTokenCookie(res, signAccessToken(user._id ?? user.id));
      return res.status(201).json({ user: publicUser(user) });
    },

    login: async (req, res) => {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
      const password = req.body?.password;
      if (!email || typeof password !== 'string' || password.length === 0) {
        throw new HttpError(400, 'Email and password are required.');
      }

      const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new HttpError(401, 'Email or password is incorrect.');
      }
      if (!user.isActive) {
        throw new HttpError(403, 'This account is inactive. Contact an administrator.');
      }

      setAccessTokenCookie(res, signAccessToken(user._id ?? user.id));
      return res.status(200).json({ user: publicUser(user) });
    },

    me: (req, res) => res.status(200).json({ user: publicUser(req.user) }),

    logout: (req, res) => {
      clearAccessTokenCookie(res);
      return res.status(200).json({ message: 'Logged out successfully.' });
    },
  };
}
