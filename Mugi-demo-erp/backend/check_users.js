const { prisma } = require('./lib/prisma');

async function main() {
  const users = await prisma.user.findMany({
    include: {
      role: true
    }
  });
  console.log('--- USERS IN DB ---');
  users.forEach(u => {
    console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role?.name}`);
  });
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
