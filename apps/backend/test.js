const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.order.findMany({orderBy: {id: 'desc'}, take: 1, include: {payment: true}}).then(o => console.log(JSON.stringify(o, null, 2))).finally(() => prisma.$disconnect());