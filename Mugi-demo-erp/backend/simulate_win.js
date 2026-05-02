const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const API_URL = 'http://localhost:5000/api/leads';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function simulateWin() {
  const user = await prisma.user.findFirst({ include: { role: true } });
  const token = jwt.sign({ id: user.id, role: user.role?.name || 'admin', permissions: [] }, JWT_SECRET, { expiresIn: '1h' });

  // 1. Find the lead we just created
  const lead = await prisma.lead.findFirst({ where: { name: "mugi" } });
  if (!lead) return console.log("Lead not found");

  console.log(`Winning lead: ${lead.name} (ID: ${lead.id})`);

  // 2. Set to Won
  try {
    const response = await axios.patch(`${API_URL}/${lead.id}`, { status: 'Won' }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("WIN SUCCESS:", response.data);

    // 3. Verify Customer & Contact
    const customer = await prisma.customer.findFirst({ where: { leadId: lead.id } });
    const contact = await prisma.contact.findFirst({ where: { leadId: lead.id } });
    console.log("Customer created:", customer ? "YES" : "NO");
    console.log("Contact created:", contact ? "YES" : "NO");

  } catch (err) {
    console.error("WIN ERROR:", err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
  }
}

simulateWin().catch(console.error).finally(() => prisma.$disconnect());
