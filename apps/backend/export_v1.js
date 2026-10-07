require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  try {
    const categories = await prisma.category.findMany();
    const products = await prisma.product.findMany();
    const tables = await prisma.table.findMany();

    const data = { categories, products, tables };
    fs.writeFileSync('../../tehyan-pos-v2-firebase/migration_data.json', JSON.stringify(data, null, 2));
    console.log('Berhasil mengekspor data dari TiDB V1!');
  } catch (err) {
    console.error('Error mengekspor:', err);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();