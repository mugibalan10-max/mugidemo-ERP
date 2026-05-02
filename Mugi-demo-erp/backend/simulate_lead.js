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

async function simulate() {
  // 1. Get a user to act as
  const user = await prisma.user.findFirst({
    include: { role: true }
  });

  if (!user) {
    console.error("No user found in DB");
    return;
  }

  // 2. Generate token
  const token = jwt.sign(
    { 
      id: user.id, 
      role: user.role?.name || 'admin', 
      permissions: [] // admin bypasses anyway
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log(`Simulating request as User: ${user.name} (ID: ${user.id}, Role: ${user.role?.name})`);

  // 3. Send Request
  const data = {
    name: "mugi",
    email: "mugibalan10@gmail.com",
    phone: "+917904657919",
    company: "zenx",
    source: "Manual",
    budget: "100000",
    priority: "Medium",
    requirement: "Needs custom ERP integration for finance, inventory, and GST billing. Requires Tally sync and multi-branch support.",
    isDecisionMaker: true,
    isQualified: true
  };

  try {
    const response = await axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("SUCCESS:", response.data);
  } catch (err) {
    console.error("ERROR:", err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
  }
}

simulate().catch(console.error).finally(() => prisma.$disconnect());
