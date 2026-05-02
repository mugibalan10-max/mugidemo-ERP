const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function cleanup() {
  // Delete Mugi lead, activities, contacts, and customer
  const lead = await prisma.lead.findFirst({ where: { name: 'mugi' } });
  if (lead) {
    console.log("Found lead, deleting...");
    await prisma.leadActivity.deleteMany({ where: { leadId: lead.id } });
    await prisma.contact.deleteMany({ where: { leadId: lead.id } });
    // Find customer linked to this lead
    const customer = await prisma.customer.findFirst({ where: { leadId: lead.id } });
    if (customer) {
        console.log("Found customer, deleting...");
        await prisma.customer.delete({ where: { id: customer.id } });
    }
    await prisma.lead.delete({ where: { id: lead.id } });
    console.log("Cleanup complete");
  } else {
    console.log("Lead 'mugi' not found, nothing to clean.");
  }
}

cleanup().catch(console.error).finally(() => prisma.$disconnect());
