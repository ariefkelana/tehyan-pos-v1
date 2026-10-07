const admin = require('firebase-admin');

// In production (Vercel), we use Environment Variables.
// Locally, we can fallback to the serviceAccountKey.json file if it exists.
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // If provided as a JSON string in Vercel Env Vars
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Local fallback
    serviceAccount = require('../../serviceAccountKey.json');
  }
} catch (error) {
  console.error('FIREBASE ADMIN INIT ERROR: serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT env var not set.');
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;