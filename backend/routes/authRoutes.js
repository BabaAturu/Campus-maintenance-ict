import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createAuthController } from '../controllers/authController.js';
import { createAuthMiddleware } from '../middleware/auth.js';

export function createAuthRoutes(UserModel, mailer) {
  const router = Router();
  const controller = createAuthController(UserModel, mailer);
  const authenticate = createAuthMiddleware(UserModel);
  const passwordResetRequestLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many password reset requests. Try again later.' },
  });
  const passwordResetVerifyLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many verification attempts. Try again later.' },
  });
  const passwordResetCompleteLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many password reset attempts. Try again later.' },
  });

  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.post('/forgot-password', passwordResetRequestLimit, controller.forgotPassword);
  router.post('/verify-reset-otp', passwordResetVerifyLimit, controller.verifyResetOtp);
  router.post('/reset-password', passwordResetCompleteLimit, controller.resetPassword);
  router.get('/me', authenticate, controller.me);
  router.post('/logout', authenticate, controller.logout);

  return router;
}
