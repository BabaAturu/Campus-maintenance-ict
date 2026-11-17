import { Router } from 'express';
import User, { USER_ROLES } from '../models/User.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import { authorizeRoles, createAuthMiddleware } from '../middleware/auth.js';
import { createAdminController } from '../controllers/adminController.js';

export function createAdminRoutes(
  UserModel = User,
  RequestModel = MaintenanceRequest,
) {
  const router = Router();
  const authenticate = createAuthMiddleware(UserModel);
  const requireAdmin = authorizeRoles(USER_ROLES.ICT_ADMIN);
  const controller = createAdminController(UserModel, RequestModel);

  router.use(authenticate, requireAdmin);
  router.get('/dashboard/stats', controller.stats);
  router.get('/users', controller.listUsers);
  router.get('/requests', controller.listRequests);
  router.post('/users', controller.createUser);
  router.patch('/users/:id/status', controller.updateUserStatus);

  return router;
}

export default createAdminRoutes;
