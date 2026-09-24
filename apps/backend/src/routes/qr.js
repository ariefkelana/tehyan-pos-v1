// File: apps/backend/src/routes/qr.js
'use strict';

/**
 * QR Code generation endpoint.
 * Uses the `qrcode` npm package to generate QR images server-side.
 *
 * GET /api/qr/:tableId
 *   → Returns a PNG image of the QR code for the given table.
 *   Query params:
 *     - size: pixel size of the QR (default: 300)
 *     - format: "png" | "svg" (default: "png")
 */

const express = require('express');
const QRCode = require('qrcode');
const { param, query, validationResult } = require('express-validator');
const { generateTableQrUrl } = require('../utils/qrGenerator');

const router = express.Router();

router.get(
  '/:tableId',
  [
    param('tableId').isInt({ min: 1 }).withMessage('tableId harus berupa angka positif.'),
    query('size').optional().isInt({ min: 100, max: 1000 }),
    query('format').optional().isIn(['png', 'svg']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const tableId = parseInt(req.params.tableId, 10);
    const size = parseInt(req.query.size ?? '300', 10);
    const format = req.query.format ?? 'png';

    // Verify table exists
    const table = await req.prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      return res.status(404).json({ success: false, message: 'Meja tidak ditemukan.' });
    }

    const qrUrl = generateTableQrUrl(tableId);

    try {
      const qrOptions = {
        errorCorrectionLevel: 'H',
        width: size,
        margin: 2,
        color: { dark: '#1f2937', light: '#ffffff' },
      };

      if (format === 'svg') {
        const svgString = await QRCode.toString(qrUrl, { ...qrOptions, type: 'svg' });
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Content-Disposition', `inline; filename="meja-${table.number}-qr.svg"`);
        return res.send(svgString);
      }

      // Default: PNG buffer
      const buffer = await QRCode.toBuffer(qrUrl, qrOptions);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Disposition', `inline; filename="meja-${table.number}-qr.png"`);
      res.send(buffer);
    } catch (err) {
      console.error('[GET /qr/:tableId]', err);
      res.status(500).json({ success: false, message: 'Gagal membuat QR code.' });
    }
  }
);

/**
 * GET /api/qr/:tableId/data
 * Returns the URL string that would be encoded in the QR (for client-side generation).
 */
router.get('/:tableId/data', [param('tableId').isInt()], async (req, res) => {
  const tableId = parseInt(req.params.tableId, 10);
  const table = await req.prisma.table.findUnique({ where: { id: tableId } });
  if (!table) return res.status(404).json({ success: false, message: 'Meja tidak ditemukan.' });

  const url = generateTableQrUrl(tableId);
  res.json({ success: true, data: { tableId, tableNumber: table.number, url } });
});

module.exports = router;
