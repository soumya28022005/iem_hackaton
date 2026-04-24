const { AppError } = require('../lib/http');

function errorMiddleware(err, req, res, _next) {
  const statusCode = err instanceof AppError ? err.statusCode : err.name === 'ZodError' ? 400 : 500;
  const payload = {
    error: err.message || 'Internal server error',
  };

  if (err.name === 'ZodError') {
    payload.details = err.issues;
  }

  if (err.details) {
    payload.details = err.details;
  }

  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  res.status(statusCode).json(payload);
}

module.exports = {
  errorMiddleware,
};
