import HttpError from '../utils/HttpError.js';
import { getAllowedFrontendOrigins } from '../utils/frontendOrigins.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export default function verifyRequestOrigin(req, res, next) {
  if (!MUTATING_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (!origin || !getAllowedFrontendOrigins().has(origin)) {
    return next(new HttpError(403, 'Request origin is not allowed.'));
  }

  return next();
}
