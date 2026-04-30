
const { prisma } = require('./lib/prisma');
async function main() {
  const count = await prisma.syncQueue.count();
  console.log('SYNC_QUEUE_COUNT:', count);
}
main().finally(() => prisma.$disconnect());
