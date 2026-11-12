export function isWriteConcernError(error) {
  return error?.name === 'MongoWriteConcernError' ||
    error?.codeName === 'WriteConcernFailed' ||
    error?.code === 64;
}

export function summarizeApiError(error) {
  const message = String(error?.message ?? 'Unknown error')
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[REDACTED_MONGODB_URI]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]')
    .replace(/\b(password|token|secret|authorization)\s*[:=]\s*(['"]?)[^\s,}'"]+/gi, '$1=[REDACTED]')
    .slice(0, 500);

  return {
    name: typeof error?.name === 'string' ? error.name : 'UnknownError',
    ...(typeof error?.code === 'string' || typeof error?.code === 'number'
      ? { code: error.code }
      : {}),
    ...(typeof error?.codeName === 'string' ? { codeName: error.codeName } : {}),
    message,
  };
}
