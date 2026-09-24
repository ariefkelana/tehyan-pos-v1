// File: apps/backend/src/routes/categories.js
'use strict';

const express = require('express');
const { body, param, validationResult } = require('express-validator');
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
 * GET /api/categories
 * Returns all categories with product count.
 */
router.get('/', async (req, res) => {
  try {
    const categories = await req.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('[GET /categories]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil kategori.' });
  }
});

/**
 * POST /api/categories
 */
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Nama kategori wajib diisi.')],
  async (req, res) => {
    if (handleValidation(req, res)) return;
    try {
      const category = await req.prisma.category.create({
        data: { name: req.body.name },
        include: { _count: { select: { products: true } } },
      });
      res.status(201).json({ success: true, data: category });
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'Nama kategori sudah ada.' });
      }
      res.status(500).json({ success: false, message: 'Gagal menambah kategori.' });
    }
  }
);

/**
 * PATCH /api/categories/:id
 */
router.patch(
  '/:id',
  [
    param('id').isInt(),
    body('name').trim().notEmpty().withMessage('Nama kategori wajib diisi.'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;
    try {
      const category = await req.prisma.category.update({
        where: { id: parseInt(req.params.id, 10) },
        data: { name: req.body.name },
        include: { _count: { select: { products: true } } },
      });
      res.json({ success: true, data: category });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
      }
      if (err.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'Nama kategori sudah ada.' });
      }
      res.status(500).json({ success: false, message: 'Gagal memperbarui kategori.' });
    }
  }
);

/**
 * DELETE /api/categories/:id
 * Blocked if category has associated products.
 */
router.delete('/:id', [param('id').isInt()], async (req, res) => {
  if (handleValidation(req, res)) return;
  try {
    const id = parseInt(req.params.id, 10);

    // Check for products in this category
    const productCount = await req.prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Tidak dapat menghapus. Kategori masih memiliki ${productCount} produk.`,
      });
    }

    await req.prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Kategori dihapus.' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
    }
    res.status(500).json({ success: false, message: 'Gagal menghapus kategori.' });
  }
});

module.exports = router;
