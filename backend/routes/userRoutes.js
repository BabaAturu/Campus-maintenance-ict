import { Router } from 'express';
import User, { USER_ROLES } from '../models/User.js';
import { authorizeRoles, createAuthMiddleware } from '../middleware/auth.js';
import { createUserController } from '../controllers/userController.js';

export function createUserRoutes(UserModel = User) {
  const router = Router();
  const authenticate = createAuthMiddleware(UserModel);
  const requireAdmin = authorizeRoles(USER_ROLES.ICT_ADMIN);
  const controller = createUserController(UserModel);

  router.use(authenticate, requireAdmin);
  router.post('/create-team-lead', controller.createTeamLead);
  router.post('/create-technician', controller.createTechnician);
  router.get('/', controller.list);
  router.patch('/:userId/status', controller.updateStatus);
  router.patch('/:userId/role', controller.updateRole);

  return router;
}
