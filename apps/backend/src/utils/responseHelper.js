// File: apps/backend/src/utils/responseHelper.js
'use strict';

/**
 * Standardized API response helpers.
 * Ensures a consistent JSON envelope across all endpoints.
 */

const success = (res, data, statusCode = 200, meta = undefined) => {
  const payload = { success: true, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

const created = (res, data) => success(res, data, 201);

const noContent = (res) => res.status(204).send();

const error = (res, message, statusCode = 500, errors = undefined) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const notFound = (res, entity = 'Data') =>
  error(res, `${entity} tidak ditemukan.`, 404);

const badRequest = (res, message) => error(res, message, 400);

const conflict = (res, message) => error(res, message, 409);

const unprocessable = (res, errors) =>
  res.status(422).json({ success: false, errors });

module.exports = { success, created, noContent, error, notFound, badRequest, conflict, unprocessable };
