// File: apps/backend/src/utils/whatsapp.js
'use strict';

/**
 * WhatsApp Gateway Service powered by Fonnte API (https://fonnte.com)
 * 100% Serverless & Vercel compatible, fast HTTP dispatch, zero-daemon dependency.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

let cachedToken = null;

// Determine safe storage path for token cache (works on local & Vercel /tmp)
const LOCAL_TOKEN_FILE = path.join(__dirname, '../../whatsapp_session/fonnte_token.txt');
const VERCEL_TOKEN_FILE = path.join('/tmp', 'fonnte_token.txt');

/**
 * Gets the current active Fonnte API Token from memory, file, or environment variable.
 */
function getFonnteToken() {
  if (cachedToken) return cachedToken;

  if (process.env.FONNTE_TOKEN && process.env.FONNTE_TOKEN.trim()) {
    cachedToken = process.env.FONNTE_TOKEN.trim();
    return cachedToken;
  }

  // Try reading from file cache
  const targetFiles = [LOCAL_TOKEN_FILE, VERCEL_TOKEN_FILE];
  for (const f of targetFiles) {
    try {
      if (fs.existsSync(f)) {
        const val = fs.readFileSync(f, 'utf8').trim();
        if (val) {
          cachedToken = val;
          return cachedToken;
        }
      }
    } catch (e) {}
  }

  return '';
}

/**
 * Sets and persists the Fonnte API Token.
 */
function setFonnteToken(newToken) {
  const clean = (newToken || '').trim();
  cachedToken = clean;

  const targetFiles = [LOCAL_TOKEN_FILE, VERCEL_TOKEN_FILE];
  for (const f of targetFiles) {
    try {
      const dir = path.dirname(f);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(f, clean, 'utf8');
    } catch (e) {}
  }

  return clean;
}

/**
 * Normalizes an Indonesian phone number to international format (without +).
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
 * Checks live connection and device status from Fonnte API.
 */
async function getWhatsAppStatus(tokenOverride) {
  const token = (tokenOverride || getFonnteToken()).trim();

  if (!token) {
    return {
      configured: false,
      isConnected: false,
      status: 'NOT_CONFIGURED',
      device: null,
      reason: 'Token API Fonnte belum dimasukkan.',
    };
  }

  try {
    const response = await axios.post(
      'https://api.fonnte.com/device',
      {},
      {
        headers: { Authorization: token },
        timeout: 8000,
      }
    );

    const data = response.data || {};
    const isConnect = data.status === true && data.device_status === 'connect';

    return {
      configured: true,
      isConnected: isConnect,
      status: data.device_status || (data.status ? 'connect' : 'disconnect'),
      device: data.device || null,
      quota: data.quota ?? null,
      messages: data.messages ?? null,
      expired: data.expired ?? null,
      reason: data.reason || (isConnect ? null : 'Perangkat belum terhubung / terputus di Fonnte'),
      tokenPreview: token.length > 8 ? token.slice(0, 4) + '••••' + token.slice(-4) : '••••',
    };
  } catch (err) {
    const errorMsg = err.response?.data?.reason || err.message || 'Gagal menghubungi server Fonnte';
    return {
      configured: true,
      isConnected: false,
      status: 'ERROR',
      device: null,
      reason: errorMsg,
      tokenPreview: token.length > 8 ? token.slice(0, 4) + '••••' + token.slice(-4) : '••••',
    };
  }
}

/**
 * Sends a WhatsApp message via Fonnte API.
 */
async function sendWhatsApp(rawPhone, message, tokenOverride) {
  const target = normalizePhoneNumber(rawPhone);
  if (!target) {
    console.warn('[Fonnte WA] Nomor tujuan tidak valid:', rawPhone);
    return { success: false, reason: 'INVALID_PHONE' };
  }

  const token = (tokenOverride || getFonnteToken()).trim();
  if (!token) {
    console.warn('\n======================================================');
    console.log(`[FONNTE MOCK - TOKEN BELUM DIISI] Pesan ke: +${target}`);
    console.log(`Isi Pesan:\n${message}`);
    console.log('======================================================\n');
    return { success: false, reason: 'TOKEN_NOT_CONFIGURED' };
  }

  try {
    const response = await axios.post(
      'https://api.fonnte.com/send',
      {
        target: target,
        message: message,
        countryCode: '62',
      },
      {
        headers: { Authorization: token },
        timeout: 10000,
      }
    );

    const data = response.data || {};
    if (data.status === true) {
      console.log(`[Fonnte WA] ✅ Pesan otomatis berhasil dikirim ke +${target} (ID: ${data.id || 'ok'})`);
      return { success: true, data };
    } else {
      console.error(`[Fonnte WA] ❌ Gagal kirim pesan ke +${target}:`, data.reason || 'Unknown error');
      return { success: false, reason: data.reason || 'FAILED_TO_SEND' };
    }
  } catch (err) {
    const errMsg = err.response?.data?.reason || err.message || 'Koneksi ke Fonnte gagal';
    console.error(`[Fonnte WA] ❌ Error saat mengirim pesan ke +${target}:`, errMsg);
    return { success: false, error: errMsg };
  }
}

/**
 * Builds an automated E-Receipt message formatted for WhatsApp.
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
 * Builds an automated Pickup Alert message formatted for WhatsApp.
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
  getFonnteToken,
  setFonnteToken,
  getWhatsAppStatus,
  sendWhatsApp,
  buildOrderReceiptMessage,
  buildOrderReadyMessage,
  normalizePhoneNumber,
};
