const admin = require('./src/lib/firebase');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@tehyan.com';

async function seed() {
  try {
    console.log('Checking for existing user in Firebase...');
    try {
      const user = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      if (user) {
        await admin.auth().deleteUser(user.uid);
        console.log(`Deleted existing user with UID ${user.uid} from Firebase`);
      }
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    console.log('Creating new Admin user in Firebase...');
    const userRecord = await admin.auth().createUser({
      email: ADMIN_EMAIL,
      password: 'password123',
      displayName: 'Admin'
    });
    console.log(`Created Firebase Admin user with UID: ${userRecord.uid}`);

    console.log('Cleaning up existing Prisma user...');
    await prisma.user.deleteMany({
      where: { email: ADMIN_EMAIL }
    });

    console.log('Creating Admin user in Prisma...');
    await prisma.user.create({
      data: {
        id: userRecord.uid,
        email: ADMIN_EMAIL,
        name: 'Admin',
        role: 'ADMIN'
      }
    });

    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seed();
