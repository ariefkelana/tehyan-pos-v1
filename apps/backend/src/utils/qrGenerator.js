// File: apps/backend/src/utils/qrGenerator.js
'use strict';

/**
 * QR Code Table URL Generator
 *
 * Generates the URL that will be encoded into a QR code for each table.
 * In production, replace QR_WEB_BASE_URL with your deployed domain.
 *
 * Usage:
 *   const { generateTableQrUrl, generateQrForAllTables } = require('./utils/qrGenerator');
 */

const QR_WEB_BASE_URL = process.env.QR_WEB_BASE_URL || 'http://localhost:3000';

/**
 * Returns the customer-facing URL for a given table ID.
 * @param {number|string} tableId
 * @returns {string}
 */
const generateTableQrUrl = (tableId) => {
  return `${QR_WEB_BASE_URL}/${tableId}`;
};

/**
 * Updates the qrCode field for all tables in the database.
 * Called once during setup or when QR_WEB_BASE_URL changes.
 * @param {import('@prisma/client').PrismaClient} prisma
 */
const generateQrForAllTables = async (prisma) => {
  const tables = await prisma.table.findMany();

  const updates = tables.map((table) =>
    prisma.table.update({
      where: { id: table.id },
      data: { qrCode: generateTableQrUrl(table.id) },
    })
  );

  await Promise.all(updates);
  console.log(`[QR] Updated QR URLs for ${tables.length} tables.`);
  return tables.length;
};

module.exports = { generateTableQrUrl, generateQrForAllTables };
