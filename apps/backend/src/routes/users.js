'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

// GET /api/users
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await req.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data akun' });
  }
});

// POST /api/users
router.post('/', requireAuth, requireAdmin, [
  body('name').trim().notEmpty().withMessage('Nama wajib diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role').isIn(['ADMIN', 'CASHIER']).withMessage('Role tidak valid')
], async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { name, email, password, role } = req.body;
    const existing = await req.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await req.prisma.user.create({
      data: { name, email, password: hashedPassword, role }
    });

    res.status(201).json({ success: true, data: { id: user.id, name, email, role } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal membuat akun' });
  }
});

// PATCH /api/users/:id
router.patch('/:id', requireAuth, requireAdmin, [
  body('name').optional().trim().notEmpty(),
  body('password').optional().isLength({ min: 6 })
], async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { name, password } = req.body;
    const data = {};
    if (name) data.name = name;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await req.prisma.user.update({
      where: { id: parseInt(req.params.id, 10) },
      data
    });
    res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengubah akun' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (parseInt(req.params.id, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun Anda sendiri' });
    }
    await req.prisma.user.delete({
      where: { id: parseInt(req.params.id, 10) }
    });
    res.json({ success: true, message: 'Akun berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus akun' });
  }
});

module.exports = router;
