import { Router } from 'express';
import { createRequestController } from '../controllers/requestController.js';
import { authorizeRoles, createAuthMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { USER_ROLES } from '../models/User.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';

export function createRequestRoutes(UserModel, RequestModel = MaintenanceRequest) {
  const router = Router();
  const authenticate = createAuthMiddleware(UserModel);
  const requireStaff = authorizeRoles(USER_ROLES.STAFF);
  const controller = createRequestController(RequestModel);

  router.use(authenticate, requireStaff);
  router.post('/', upload.single('attachment'), controller.create);
  router.get('/my-requests', controller.listMine);
  router.get('/:id', controller.getOne);

  return router;
}

