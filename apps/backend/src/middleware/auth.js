// File: apps/backend/src/middleware/auth.js
'use strict';

const admin = require('../lib/firebase');

/**
 * Express middleware — verifies Firebase ID token from Authorization header.
 * Attaches user from Prisma to req.user.
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  const token = authHeader.slice(7);
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const user = await req.prisma.user.findUnique({ where: { id: decodedToken.uid } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Pengguna tidak ditemukan di database.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
};

/**
 * Middleware — requires user to have ADMIN role.
 * Must be used AFTER requireAuth.
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat mengakses fitur ini.' });
  }
  next();
};

module.exports = { requireAuth, requireAdmin };
