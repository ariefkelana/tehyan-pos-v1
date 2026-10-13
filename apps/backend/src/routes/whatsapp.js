// File: apps/backend/src/routes/whatsapp.js
'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getWhatsAppStatus,
  setFonnteToken,
  sendWhatsApp,
} = require('../utils/whatsapp');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/whatsapp/status
 * Get the current Fonnte device connection status and token info.
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const status = await getWhatsAppStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/whatsapp/token
 * Save and verify a new Fonnte API Token.
 */
router.post(
  '/token',
  requireAuth,
  requireAdmin,
  [
    body('token').trim().notEmpty().withMessage('Token Fonnte wajib diisi.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { token } = req.body;
    setFonnteToken(token);

    // Verify token with Fonnte
    const status = await getWhatsAppStatus(token);
    if (status.status === 'ERROR' && status.reason === 'token invalid') {
      return res.status(400).json({
        success: false,
        message: 'Token Fonnte tidak valid. Silakan periksa kembali token Anda di dashboard Fonnte.',
        data: status,
      });
    }

    res.json({
      success: true,
      message: 'Token Fonnte berhasil disimpan dan diverifikasi!',
      data: status,
    });
  }
);

/**
 * POST /api/whatsapp/send-test
 * Sends a test message to a specified phone number via Fonnte.
 */
router.post(
  '/send-test',
  requireAuth,
  requireAdmin,
  [
    body('phone').trim().notEmpty().withMessage('Nomor WhatsApp wajib diisi.'),
    body('message').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { phone, message } = req.body;
    const testMsg =
      message ||
      `🤖 *Tes Notifikasi Kedai TehYan POS*\n\nHalo! Ini adalah pesan uji coba dari sistem POS Kedai TehYan melalui gateway Fonnte. Jika Anda menerima pesan ini, bot WhatsApp otomatis telah berhasil terhubung dan siap beroperasi di Vercel! 🎉`;

    const result = await sendWhatsApp(phone, testMsg);
    if (result.success) {
      res.json({ success: true, message: 'Pesan uji coba berhasil terkirim ke WhatsApp!' });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || result.reason || 'Gagal mengirim pesan uji coba.',
        reason: result.reason,
      });
    }
  }
);

module.exports = router;
