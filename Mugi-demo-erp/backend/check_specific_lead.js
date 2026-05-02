const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const lead = await prisma.lead.findFirst({
    where: {
      OR: [
        { email: 'mugibalan10@gmail.com' },
        { phone: '+917904657919' }
      ]
    }
  });
  console.log('Existing Lead:', JSON.stringify(lead, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
