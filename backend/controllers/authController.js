import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import User, { USER_ROLES } from '../models/User.js';
import passwordResetMailer from '../utils/passwordResetMailer.js';
import {
  clearAccessTokenCookie,
  getJwtSecret,
  isDuplicateKeyError,
  normalizeEmail,
  publicUser,
  setAccessTokenCookie,
  signAccessToken,
  validatePassword,
  validateProfile,
} from '../utils/auth.js';
import HttpError from '../utils/HttpError.js';

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const RESET_TOKEN_LIFETIME_MS = 5 * 60 * 1000;
const RESET_CHALLENGE_FIELDS = [
  '+passwordResetOtpHash',
  '+passwordResetOtpExpiresAt',
  '+passwordResetOtpAttempts',
  '+passwordResetOtpLastSentAt',
  '+passwordResetTokenHash',
  '+passwordResetTokenExpiresAt',
].join(' ');

function resetEmail(body) {
  const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new HttpError(400, 'Enter a valid email address.');
  }
  return email;
}

function challengeHash(userId, purpose, value) {
  return createHmac('sha256', getJwtSecret())
    .update(`${purpose}:${userId}:${value}`)
    .digest('hex');
}

function hashesMatch(expected, actual) {
  if (typeof expected !== 'string' || typeof actual !== 'string') return false;
  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(actual, 'hex');
  return expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer);
}

export function createAuthController(UserModel = User, mailer = passwordResetMailer) {
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

    forgotPassword: async (req, res) => {
      const email = resetEmail(req.body);
      if (!mailer.isConfigured()) {
        throw new HttpError(503, 'Password reset email is not configured.');
      }

      const user = await UserModel.findOne({ email }).select(RESET_CHALLENGE_FIELDS);
      const response = {
        message: 'If an active account uses that email, a verification code will be sent.',
      };
      if (!user || !user.isActive) return res.status(200).json(response);

      const now = new Date();
      const lastSentAt = user.passwordResetOtpLastSentAt?.getTime();
      if (lastSentAt && now.getTime() - lastSentAt < OTP_RESEND_COOLDOWN_MS) {
        return res.status(200).json(response);
      }

      const otp = String(randomInt(100000, 1000000));
      const userId = String(user._id ?? user.id);
      user.passwordResetOtpHash = challengeHash(userId, 'otp', otp);
      user.passwordResetOtpExpiresAt = new Date(now.getTime() + OTP_LIFETIME_MS);
      user.passwordResetOtpAttempts = 0;
      user.passwordResetOtpLastSentAt = now;
      user.passwordResetTokenHash = undefined;
      user.passwordResetTokenExpiresAt = undefined;
      await user.save();

      try {
        await mailer.send(user.email, otp);
      } catch {
        throw new HttpError(503, 'Unable to send a password reset email right now.');
      }

      return res.status(200).json(response);
    },

    verifyResetOtp: async (req, res) => {
      const email = resetEmail(req.body);
      const otp = req.body?.otp;
      if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
        throw new HttpError(400, 'Enter the 6-digit verification code.');
      }

      const now = new Date();
      const user = await UserModel.findOneAndUpdate(
        {
          email,
          isActive: true,
          passwordResetOtpExpiresAt: { $gt: now },
          passwordResetOtpAttempts: { $lt: OTP_MAX_ATTEMPTS },
        },
        { $inc: { passwordResetOtpAttempts: 1 } },
        { new: true },
      ).select(RESET_CHALLENGE_FIELDS);

      if (!user) throw new HttpError(400, 'The verification code is invalid or expired.');

      const userId = String(user._id ?? user.id);
      const candidateHash = challengeHash(userId, 'otp', otp);
      if (!hashesMatch(user.passwordResetOtpHash, candidateHash)) {
        throw new HttpError(400, 'The verification code is invalid or expired.');
      }

      const resetToken = randomBytes(32).toString('base64url');
      user.passwordResetTokenHash = challengeHash(userId, 'reset', resetToken);
      user.passwordResetTokenExpiresAt = new Date(now.getTime() + RESET_TOKEN_LIFETIME_MS);
      await user.save();

      return res.status(200).json({ resetToken });
    },

    resetPassword: async (req, res) => {
      const email = resetEmail(req.body);
      const { resetToken, password, confirmPassword } = req.body ?? {};
      if (typeof resetToken !== 'string' || resetToken.length < 40 || resetToken.length > 100) {
        throw new HttpError(400, 'Verify your email before resetting the password.');
      }
      validatePassword(password);
      if (password !== confirmPassword) {
        throw new HttpError(400, 'Passwords do not match.');
      }

      const user = await UserModel.findOne({ email }).select(RESET_CHALLENGE_FIELDS);
      const now = new Date();
      if (
        !user ||
        !user.isActive ||
        !user.passwordResetTokenExpiresAt ||
        user.passwordResetTokenExpiresAt.getTime() <= now.getTime() ||
        !hashesMatch(
          user.passwordResetTokenHash,
          challengeHash(String(user._id ?? user.id), 'reset', resetToken),
        )
      ) {
        throw new HttpError(400, 'The password reset session is invalid or expired.');
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const updatedUser = await UserModel.findOneAndUpdate(
        {
          _id: user._id,
          email,
          isActive: true,
          passwordResetTokenHash: user.passwordResetTokenHash,
          passwordResetTokenExpiresAt: { $gt: now },
        },
        {
          $set: { password: passwordHash },
          $unset: {
            passwordResetOtpHash: 1,
            passwordResetOtpExpiresAt: 1,
            passwordResetOtpAttempts: 1,
            passwordResetOtpLastSentAt: 1,
            passwordResetTokenHash: 1,
            passwordResetTokenExpiresAt: 1,
          },
        },
        { new: true, runValidators: true },
      );
      if (!updatedUser) {
        throw new HttpError(400, 'The password reset session is invalid or expired.');
      }

      return res.status(200).json({ message: 'Password reset successfully. You can now sign in.' });
    },
  };
}
