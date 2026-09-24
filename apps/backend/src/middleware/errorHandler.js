// File: apps/backend/src/middleware/errorHandler.js
'use strict';

/**
 * Centralized async error wrapper.
 * Wraps an async route handler so unhandled promise rejections
 * are forwarded to Express's next() error middleware automatically.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Prisma-aware error formatter.
 * Maps known Prisma error codes to human-readable HTTP responses.
 */
const prismaErrorHandler = (err, _req, res, next) => {
  // Only handle Prisma errors here
  if (!err.code || !err.code.startsWith('P')) return next(err);

  switch (err.code) {
    case 'P2002': {
      const field = err.meta?.target?.join(', ') ?? 'field';
      return res.status(409).json({
        success: false,
        message: `Nilai duplikat pada kolom: ${field}. Gunakan nilai yang berbeda.`,
      });
    }
    case 'P2003':
      return res.status(400).json({
        success: false,
        message: 'Relasi tidak ditemukan. Pastikan ID yang direferensikan ada.',
      });
    case 'P2025':
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan.',
      });
    case 'P2016':
      return res.status(400).json({
        success: false,
        message: 'Query tidak valid.',
      });
    default:
      return next(err);
  }
};

/**
 * Global fallback error handler (must be last middleware).
 */
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, _req, res, _next) => {
  console.error('[GlobalErrorHandler]', {
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const statusCode = err.statusCode ?? err.status ?? 500;

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Terjadi kesalahan pada server. Silakan coba lagi.'
        : err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { asyncHandler, prismaErrorHandler, globalErrorHandler };
