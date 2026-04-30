
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.syncQueue.count();
  console.log('SYNC_QUEUE_COUNT:', count);
  const items = await prisma.syncQueue.findMany({ take: 5 });
  console.log('ITEMS:', JSON.stringify(items, null, 2));
}
main().finally(() => prisma.$disconnect());
