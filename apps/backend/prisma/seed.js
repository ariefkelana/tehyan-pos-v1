// File: apps/backend/prisma/seed.js

'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…');

  // ── Default Users ──────────────────────────────────────────────────────
  const [adminPass, cashierPass] = await Promise.all([
    bcrypt.hash('admin123', 12),
    bcrypt.hash('kasir123', 12),
  ]);

  await prisma.user.upsert({
    where: { email: 'admin@tehyan.com' },
    update: {},
    create: { name: 'Admin TehYan', email: 'admin@tehyan.com', password: adminPass, role: 'ADMIN' },
  });

  await prisma.user.upsert({
    where: { email: 'kasir@tehyan.com' },
    update: {},
    create: { name: 'Kasir 1', email: 'kasir@tehyan.com', password: cashierPass, role: 'CASHIER' },
  });

  console.log('👤 Users seeded: admin@tehyan.com (admin123) | kasir@tehyan.com (kasir123)');

  // Categories
  const [minuman, makanan, snack] = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Minuman' },
      update: {},
      create: { name: 'Minuman' },
    }),
    prisma.category.upsert({
      where: { name: 'Makanan' },
      update: {},
      create: { name: 'Makanan' },
    }),
    prisma.category.upsert({
      where: { name: 'Snack' },
      update: {},
      create: { name: 'Snack' },
    }),
  ]);

  // Products
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Teh Tarik', price: 8000, categoryId: minuman.id, description: 'Teh susu khas kedai' },
      { name: 'Teh Manis Panas', price: 5000, categoryId: minuman.id },
      { name: 'Teh Manis Dingin', price: 6000, categoryId: minuman.id },
      { name: 'Es Teh Lemon', price: 9000, categoryId: minuman.id },
      { name: 'Kopi Hitam', price: 7000, categoryId: minuman.id },
      { name: 'Nasi Goreng Spesial', price: 25000, categoryId: makanan.id, description: 'Nasi goreng dengan telur dan ayam' },
      { name: 'Mie Goreng', price: 22000, categoryId: makanan.id },
      { name: 'Nasi Uduk', price: 18000, categoryId: makanan.id },
      { name: 'Pisang Goreng', price: 10000, categoryId: snack.id },
      { name: 'Singkong Goreng', price: 8000, categoryId: snack.id },
    ],
  });

  // Tables
  const tableData = Array.from({ length: 10 }, (_, i) => ({
    number: String(i + 1).padStart(2, '0'),
  }));

  for (const t of tableData) {
    await prisma.table.upsert({
      where: { number: t.number },
      update: {},
      create: t,
    });
  }

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
