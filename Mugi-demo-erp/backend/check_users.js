const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = await prisma.role.findMany();
  console.log('Roles:', JSON.stringify(roles, null, 2));
  const users = await prisma.user.findMany({ include: { role: true } });
  console.log('Users:', JSON.stringify(users.map(u => ({ id: u.id, name: u.name, role: u.role.name })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
