const DEVELOPMENT_FRONTEND_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

export function getAllowedFrontendOrigins() {
  const configuredOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  const origins = [configuredOrigin];

  if (process.env.NODE_ENV !== 'production') {
    origins.push(...DEVELOPMENT_FRONTEND_ORIGINS);
  }

  return new Set(origins);
}