const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma seeding...');

  const adminEmail = 'admin@mugi.com';
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Upsert the Admin user
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
    },
    create: {
      email: adminEmail,
      name: 'Mugi Admin',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log(`✅ Admin user ${admin.email} is ready.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
