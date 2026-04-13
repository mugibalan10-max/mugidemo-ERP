const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

/**
 * Prisma Client singleton for database access.
 * Updated for Prisma 7 compatibility using PostgreSQL adapter.
 */
const prisma = new PrismaClient({ adapter });

module.exports = { prisma, pool };
