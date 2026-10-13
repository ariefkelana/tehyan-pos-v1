// File: apps/backend/src/utils/whatsapp.js
'use strict';

/**
 * WhatsApp Self-Hosted Bot Service powered by @whiskeysockets/baileys
 * Provides automated background message delivery, QR code linking,
 * and live connection lifecycle management for Kedai TehYan POS.
 */

const path = require('path');
const fs = require('fs');
const pino = require('pino');
const QRCode = require('qrcode');

const SESSION_DIR = path.join(__dirname, '../../whatsapp_session');

// In-memory connection state
const state = {
  status: 'DISCONNECTED', // 'DISCONNECTED' | 'INITIALIZING' | 'WAITING_QR' | 'CONNECTED'
  qrCode: null,           // Base64 Data URL (data:image/png;base64,...)
  connectedNumber: null,  // Phone number of the linked WhatsApp account
  lastConnectedAt: null,
  lastError: null,
};

let sock = null;
let isInitializing = false;
let retryCount = 0;

/**
 * Ensures session directory exists.
 */
function ensureSessionDir() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
}

/**
 * Normalizes an Indonesian phone number to standard international format (without +).
 * E.g., '0812-3456-7890' -> '6281234567890'
 */
function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return '';
  let clean = String(rawPhone).replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Formats a number as Indonesian Rupiah string.
 */
function formatRupiah(amount) {
  return 'Rp' + Number(amount || 0).toLocaleString('id-ID');
}

/**
 * Initialize WhatsApp connection via Baileys.
 */
async function initWhatsApp() {
  if (isInitializing) return;
  isInitializing = true;
  state.status = 'INITIALIZING';
  state.lastError = null;

  try {
    ensureSessionDir();

    const {
      default: makeWASocket,
      useMultiFileAuthState,
      DisconnectReason,
      fetchLatestBaileysVersion,
    } = await import('@whiskeysockets/baileys');

    const { state: authState, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
      version: [2, 3000, 1015901307],
      isLatest: true,
    }));

    console.log(`[WhatsApp] Inisialisasi Baileys v${version.join('.')} (isLatest: ${isLatest})...`);

    sock = makeWASocket({
      version,
      auth: authState,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: ['Kedai TehYan POS', 'Desktop', '1.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        state.status = 'WAITING_QR';
        try {
          state.qrCode = await QRCode.toDataURL(qr, { margin: 2, scale: 7 });
        } catch (e) {
          state.qrCode = null;
        }
        console.log('[WhatsApp] 📸 QR Code baru berhasil dibuat! Buka tab WhatsApp di POS untuk scan.');
      }

      if (connection === 'open') {
        state.status = 'CONNECTED';
        state.qrCode = null;
        retryCount = 0;
        const userJid = sock.user?.id || '';
        const rawPhone = userJid.split(':')[0] || userJid.split('@')[0];
        state.connectedNumber = rawPhone;
        state.lastConnectedAt = new Date().toISOString();
        console.log(`[WhatsApp] 🟢 BERHASIL TERHUBUNG! Akun Kedai: +${state.connectedNumber}`);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        state.status = 'DISCONNECTED';
        state.qrCode = null;
        console.warn(`[WhatsApp] 🔴 Koneksi terputus (Status: ${statusCode}). Reconnect: ${shouldReconnect}`);

        if (shouldReconnect) {
          retryCount++;
          const delay = Math.min(retryCount * 4000, 30000);
          console.log(`[WhatsApp] Mencoba koneksi ulang dalam ${delay / 1000} detik...`);
          setTimeout(() => {
            isInitializing = false;
            initWhatsApp();
          }, delay);
        } else {
          state.connectedNumber = null;
          isInitializing = false;
        }
      }
    });

  } catch (error) {
    console.error('[WhatsApp] Gagal inisialisasi socket:', error);
    state.status = 'DISCONNECTED';
    state.lastError = error.message;
  } finally {
    isInitializing = false;
  }
}

/**
 * Returns the current live status of the WhatsApp bot.
 */
function getWhatsAppStatus() {
  return {
    status: state.status,
    isConnected: state.status === 'CONNECTED',
    qrCode: state.qrCode,
    connectedNumber: state.connectedNumber,
    lastConnectedAt: state.lastConnectedAt,
    lastError: state.lastError,
  };
}

/**
 * Sends a raw WhatsApp text message.
 * Safe fallback: logs to console if disconnected instead of crashing.
 */
async function sendWhatsApp(rawPhone, message) {
  const target = normalizePhoneNumber(rawPhone);
  if (!target) {
    console.warn('[WhatsApp] Nomor tujuan tidak valid:', rawPhone);
    return { success: false, reason: 'INVALID_PHONE' };
  }

  // If connected via Baileys, send real WhatsApp message
  if (sock && state.status === 'CONNECTED') {
    try {
      const jid = `${target}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text: message });
      console.log(`[WhatsApp] ✅ Pesan otomatis terkirim ke +${target}`);
      return { success: true };
    } catch (err) {
      console.error(`[WhatsApp] ❌ Gagal mengirim pesan ke +${target}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  // Fallback: Mock logging when not yet connected/scanned
  console.log('\n======================================================');
  console.log(`[WHATSAPP BOT - BELUM TERHUBUNG] Pesan ke: +${target}`);
  console.log(`Isi Pesan:\n${message}`);
  console.log('======================================================\n');
  return { success: false, reason: 'NOT_CONNECTED_FALLBACK_LOGGED' };
}

/**
 * Disconnects the current WhatsApp session and cleans up storage.
 */
async function disconnectWhatsApp() {
  try {
    if (sock) {
      try {
        await sock.logout();
      } catch (e) {}
      try {
        sock.end();
      } catch (e) {}
      sock = null;
    }

    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    }

    state.status = 'DISCONNECTED';
    state.qrCode = null;
    state.connectedNumber = null;
    state.lastConnectedAt = null;

    // Immediately trigger a new init so a fresh QR code is produced
    setTimeout(() => initWhatsApp(), 1000);
    return { success: true };
  } catch (err) {
    console.error('[WhatsApp] Gagal disconnect:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Builds a structured E-Receipt WhatsApp message.
 */
function buildOrderReceiptMessage(order, payment) {
  const subtotal = Number(order.totalAmount || 0);
  const paid = Number(payment?.amount || subtotal);
  const change = Number(payment?.change || 0);
  const method = payment?.method === 'CASH' ? 'Tunai' : payment?.method || 'QRIS';

  let itemsList = '';
  if (Array.isArray(order.items)) {
    itemsList = order.items
      .map((it) => {
        let name = it.product?.name || 'Item';
        let mod = '';
        if (it.modifiers) {
          try {
            const p = JSON.parse(it.modifiers);
            mod = ` [${Object.values(p).map((m) => m?.name || m).join(', ')}]`;
          } catch (e) {}
        }
        return `• *${it.quantity}x* ${name}${mod} : ${formatRupiah(it.subtotal)}`;
      })
      .join('\n');
  }

  return (
    `🍵 *KEDAI TEHYAN — STRUK PEMBAYARAN* 🍵\n\n` +
    `Halo Kak ${order.customerName || 'Pelanggan'}! 👋\n` +
    `Terima kasih telah berkunjung & bertransaksi di *Kedai TehYan*.\n\n` +
    `📌 *No. Order:* #${order.orderNumber}\n` +
    `🪑 *Meja:* ${order.table?.number ? 'Meja ' + order.table.number : 'Take Away'}\n` +
    `📅 *Waktu:* ${new Date(order.createdAt || Date.now()).toLocaleString('id-ID')}\n\n` +
    `🛒 *Rincian Pesanan:*\n` +
    `${itemsList || '• 1x Pesanan Menu'}\n\n` +
    `💰 *TOTAL:* ${formatRupiah(subtotal)}\n` +
    `💳 *Metode:* ${method}\n` +
    `💵 *Dibayar:* ${formatRupiah(paid)}\n` +
    (change > 0 ? `🪙 *Kembalian:* ${formatRupiah(change)}\n\n` : `\n`) +
    `⏳ _Pesanan Kakak sedang kami racik dengan cinta. Nanti kami kirimkan info di sini kalau sudah siap diambil ya!_\n\n` +
    `*Kedai TehYan POS* • _Kesegaran Teh Asli_`
  );
}

/**
 * Builds an automated Pickup Alert WhatsApp message.
 */
function buildOrderReadyMessage(order) {
  return (
    `✨ *KABAR GEMBIRA DARI KEDAI TEHYAN!* ✨\n\n` +
    `Halo Kak ${order.customerName || 'Pelanggan'}! 👋\n\n` +
    `Pesanan Kakak dengan nomor:\n` +
    `👉 *Order #${order.orderNumber}* (${order.table?.number ? 'Meja ' + order.table.number : 'Take Away'})\n\n` +
    `🎉 *SUDAH SELESAI DIRACIK & SIAP DIAMBIL!* 🍵\n\n` +
    `Silakan meluncur ke meja kasir/bar untuk mengambil pesanannya ya. Selamat menikmati!\n\n` +
    `_Terima kasih telah berkunjung di Kedai TehYan!_ 🙏`
  );
}

module.exports = {
  initWhatsApp,
  getWhatsAppStatus,
  sendWhatsApp,
  disconnectWhatsApp,
  buildOrderReceiptMessage,
  buildOrderReadyMessage,
  normalizePhoneNumber,
};
