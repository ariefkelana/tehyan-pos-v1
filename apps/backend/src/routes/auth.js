'use strict';

const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/auth/me
 * Returns current user info from req.user (populated by requireAuth middleware via Prisma).
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, data: req.user });
});

/**
 * POST /api/auth/logout
 * Stateless JWT - client just discards the token.
 */
router.post('/logout', requireAuth, (_req, res) => {
  res.json({ success: true, message: 'Logout berhasil.' });
});

module.exports = router;