// File: apps/backend/src/routes/whatsapp.js
'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getWhatsAppStatus,
  initWhatsApp,
  disconnectWhatsApp,
  sendWhatsApp,
} = require('../utils/whatsapp');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/whatsapp/status
 * Get the live connection state of the WhatsApp bot.
 */
router.get('/status', requireAuth, (req, res) => {
  const status = getWhatsAppStatus();
  res.json({ success: true, data: status });
});

/**
 * POST /api/whatsapp/connect
 * Initialize or restart the WhatsApp connection.
 */
router.post('/connect', requireAuth, requireAdmin, async (req, res) => {
  try {
    await initWhatsApp();
    res.json({ success: true, message: 'WhatsApp initialization triggered.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/whatsapp/disconnect
 * Disconnect and remove saved credentials.
 */
router.post('/disconnect', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await disconnectWhatsApp();
    res.json({ success: result.success, message: 'WhatsApp session disconnected.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/whatsapp/send-test
 * Sends a test message to a specified phone number to test connectivity.
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
      `🤖 *Tes Notifikasi Kedai TehYan POS*\n\nHalo! Ini adalah pesan uji coba dari sistem POS Kedai TehYan. Jika Anda menerima pesan ini, bot WhatsApp otomatis telah berhasil terhubung dan siap beroperasi! 🎉`;

    const result = await sendWhatsApp(phone, testMsg);
    if (result.success) {
      res.json({ success: true, message: 'Pesan uji coba berhasil terkirim!' });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Gagal mengirim pesan uji coba. Pastikan bot WhatsApp terhubung.',
        reason: result.reason,
      });
    }
  }
);

module.exports = router;
