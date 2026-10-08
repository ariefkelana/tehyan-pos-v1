const admin = require('firebase-admin');

let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decoded);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // We try to use the raw JSON, but often Vercel strips newlines in the private_key!
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require('../../serviceAccountKey.json');
  }
} catch (error) {
  console.error('FIREBASE ADMIN INIT ERROR:', error.message);
}

if (serviceAccount) {
  try {
    // If the user manually stripped newlines to fit into Vercel UI, the key is permanently broken.
    if (serviceAccount.private_key && !serviceAccount.private_key.includes('\n')) {
      console.error('FIREBASE FATAL: private_key is missing newline characters! Please use FIREBASE_SERVICE_ACCOUNT_BASE64 instead.');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    console.error('FIREBASE APP INIT FATAL ERROR:', err.message);
  }
}

module.exports = admin;