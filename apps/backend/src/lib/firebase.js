const admin = require('firebase-admin');

// In production (Vercel), we use Environment Variables.
// Locally, we can fallback to the serviceAccountKey.json file if it exists.
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    // Decode base64 to JSON
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decoded);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // If provided as a JSON string in Vercel Env Vars (often breaks)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Local fallback
    serviceAccount = require('../../serviceAccountKey.json');
  }
} catch (error) {
  console.error('FIREBASE ADMIN INIT ERROR:', error.message);
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;