const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log("Users in database:", users);
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    console.log("\n💡 Tip: Make sure your PostgreSQL server is running and your password in .env is correct.");
  } finally {
    await prisma.$disconnect();
  }
}

main();
