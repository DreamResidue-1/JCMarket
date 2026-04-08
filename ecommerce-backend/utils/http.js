export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || error.status || 500;
  const message = statusCode >= 500 ? 'Internal server error.' : error.message;

  if (statusCode >= 500) {
    console.error(error);
  } else {
    console.warn(`[${req.method}] ${req.path} -> ${statusCode}: ${error.message}`);
  }

  if (req.path.startsWith('/api/')) {
    return res.status(statusCode).json({
      error: message,
      ...(error.details ? { details: error.details } : {})
    });
  }

  return res.status(statusCode).send(message);
};
