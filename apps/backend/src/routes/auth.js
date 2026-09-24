// File: apps/backend/src/routes/auth.js
'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

/**
 * POST /api/auth/register
 * Creates a new cashier/admin user. In production, restrict to ADMIN only.
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Nama wajib diisi.'),
    body('email').isEmail().normalizeEmail().withMessage('Email tidak valid.'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter.'),
    body('role').optional().isIn(['ADMIN', 'CASHIER']),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    const { name, email, password, role } = req.body;

    try {
      const existing = await req.prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
      }

      const hashed = await bcrypt.hash(password, 12);
      const user = await req.prisma.user.create({
        data: { name, email, password: hashed, role: role ?? 'CASHIER' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });

      const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

      res.status(201).json({ success: true, data: { user, token } });
    } catch (err) {
      console.error('[POST /auth/register]', err);
      res.status(500).json({ success: false, message: 'Gagal mendaftarkan pengguna.' });
    }
  }
);

/**
 * POST /api/auth/login
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email tidak valid.'),
    body('password').notEmpty().withMessage('Password wajib diisi.'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    const { email, password } = req.body;

    try {
      const user = await req.prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Email atau password salah.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Email atau password salah.' });
      }

      const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

      res.json({
        success: true,
        data: {
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
        },
      });
    } catch (err) {
      console.error('[POST /auth/login]', err);
      res.status(500).json({ success: false, message: 'Gagal login.' });
    }
  }
);

/**
 * GET /api/auth/me
 * Returns current user info from token.
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, message: 'Gagal mengambil data pengguna.' });
  }
});

/**
 * POST /api/auth/logout
 * Stateless JWT — client just discards the token.
 * Endpoint exists for consistency and future token blacklist support.
 */
router.post('/logout', requireAuth, (_req, res) => {
  res.json({ success: true, message: 'Logout berhasil.' });
});

module.exports = router;
