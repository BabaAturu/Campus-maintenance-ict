import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import MaintenanceRequest from './models/MaintenanceRequest.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { createRequestRoutes } from './routes/requestRoutes.js';
import { createUserRoutes } from './routes/userRoutes.js';
import { createAdminRoutes } from './routes/adminRoutes.js';
import verifyRequestOrigin from './middleware/requestOrigin.js';
import HttpError from './utils/HttpError.js';
import { isWriteConcernError, summarizeApiError } from './utils/databaseErrors.js';
import { getAllowedFrontendOrigins } from './utils/frontendOrigins.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp({
  UserModel = User,
  RequestModel = MaintenanceRequest,
  passwordResetMailer,
} = {}) {
  const app = express();
  const allowedFrontendOrigins = getAllowedFrontendOrigins();

  app.disable('x-powered-by');
  app.use(cors({
    credentials: true,
    origin: (origin, callback) => callback(null, !origin || allowedFrontendOrigins.has(origin)),
  }));
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', verifyRequestOrigin);

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  app.use('/api/auth', createAuthRoutes(UserModel, passwordResetMailer));
  app.use('/api/requests', createRequestRoutes(UserModel, RequestModel));
  app.use('/api/users', createUserRoutes(UserModel));
  app.use('/api/admin', createAdminRoutes(UserModel, RequestModel));

  app.use((req, res, next) => next(new HttpError(404, 'Route not found.')));
  app.use((error, req, res, next) => {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check the provided user details.' });
    }
    if (error?.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user identifier.' });
    }
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    if (error?.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Request body must contain valid JSON.' });
    }
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'The attachment must be 5 MB or smaller.' });
    }
    if (error?.code === 'LIMIT_UNEXPECTED_FILE' || error?.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Only one attachment is allowed.' });
    }

    const diagnostic = summarizeApiError(error);
    console.error('Unhandled API error:', diagnostic);
    if (isWriteConcernError(error)) {
      return res.status(503).json({
        message: 'The database could not confirm the write. The account may already exist; try logging in before registering again.',
      });
    }
    return res.status(500).json({ message: 'Internal server error.' });
  });

  return app;
}

export default createApp;
