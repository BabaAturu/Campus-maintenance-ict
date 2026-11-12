import { Router } from 'express';
import { createAuthController } from '../controllers/authController.js';
import { createAuthMiddleware } from '../middleware/auth.js';

export function createAuthRoutes(UserModel) {
  const router = Router();
  const controller = createAuthController(UserModel);
  const authenticate = createAuthMiddleware(UserModel);

  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.get('/me', authenticate, controller.me);
  router.post('/logout', authenticate, controller.logout);

  return router;
}
