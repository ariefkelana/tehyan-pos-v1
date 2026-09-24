// File: apps/backend/src/utils/whatsapp.js
'use strict';

/**
 * WhatsApp Notification Service (Mock)
 * Replace this with an actual API call (e.g., Fonnte, Twilio, WATS) in production.
 */

async function sendWhatsApp(phone, message) {
  // Normalize phone number (e.g., change 08 to 628)
  let target = phone.trim();
  if (target.startsWith('0')) {
    target = '62' + target.slice(1);
  }

  // MOCK LOGIC for development
  console.log('\n======================================================');
  console.log(`[WHATSAPP MOCK] Mengirim pesan ke: +${target}`);
  console.log(`Isi Pesan:\n${message}`);
  console.log('======================================================\n');

  /*
  // CONTOH IMPLEMENTASI ASLI MENGGUNAKAN FONNTE (Populer di Indonesia)
  try {
    const axios = require('axios');
    const response = await axios.post(
      'https://api.fonnte.com/send',
      { target, message },
      { headers: { Authorization: process.env.FONNTE_TOKEN } }
    );
    console.log('[WA Sent]', response.data);
    return true;
  } catch (error) {
    console.error('[WA Error]', error.message);
    return false;
  }
  */
  
  return true;
}

module.exports = { sendWhatsApp };
