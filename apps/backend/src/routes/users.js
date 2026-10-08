'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const admin = require('../lib/firebase');

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

    const userRecord = await admin.auth().createUser({ email, password, displayName: name });
    const user = await req.prisma.user.create({
      data: { id: userRecord.uid, name, email, role }
    });

    res.status(201).json({ success: true, data: { id: user.id, name, email, role } });
  } catch (error) {
    console.error(error);
    if (error.code === 'auth/email-already-exists') {
      res.status(400).json({ success: false, message: 'Email sudah terdaftar di sistem' });
    } else {
      res.status(500).json({ success: false, message: 'Gagal membuat akun' });
    }
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
    
    // Update Firebase user if name or password is provided
    const updateData = {};
    if (name) updateData.displayName = name;
    if (password) updateData.password = password;
    
    if (Object.keys(updateData).length > 0) {
      await admin.auth().updateUser(req.params.id, updateData);
    }

    // Update Prisma user
    const data = {};
    if (name) data.name = name;

    let user;
    if (Object.keys(data).length > 0) {
      user = await req.prisma.user.update({
        where: { id: req.params.id },
        data
      });
    } else {
      user = await req.prisma.user.findUnique({ where: { id: req.params.id } });
    }
    
    res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengubah akun' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun Anda sendiri' });
    }
    await req.prisma.user.delete({
      where: { id: req.params.id }
    });
    await admin.auth().deleteUser(req.params.id);
    res.json({ success: true, message: 'Akun berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menghapus akun' });
  }
});

module.exports = router;

