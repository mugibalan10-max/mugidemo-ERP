const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const leads = await prisma.lead.findMany();
  console.log('Leads:', JSON.stringify(leads, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
