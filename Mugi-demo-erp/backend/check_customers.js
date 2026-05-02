const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const customers = await prisma.customer.findMany();
  console.log('Customers:', JSON.stringify(customers.map(c => c.name), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
