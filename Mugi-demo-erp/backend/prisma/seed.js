const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma seeding...');

  const adminEmail = 'admin@mugi.com';
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Roles
  const roles = [
    { name: 'admin', permissions: { all: true } },
    { name: 'sales', permissions: { leads: true, customers: true, invoices: true } },
    { name: 'inventory', permissions: { products: true, stock: true, vendors: true } },
    { name: 'hr', permissions: { employees: true, payroll: true, attendance: true } },
    { name: 'employee', permissions: { tasks: true, attendance: true } }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { permissions: role.permissions },
      create: role
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });

  // 2. Upsert the Admin user
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      roleName: 'admin',
      roleId: adminRole.id
    },
    create: {
      email: adminEmail,
      name: 'Mugi Admin',
      password: hashedPassword,
      roleName: 'admin',
      roleId: adminRole.id
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
