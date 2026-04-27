const { prisma } = require('../lib/prisma');

async function main() {
  const poCount = await prisma.purchaseOrder.count();
  const allPOs = await prisma.purchaseOrder.findMany({
    select: { id: true, poNumber: true, status: true }
  });
  console.log('PO Count:', poCount);
  console.log('All POs:', JSON.stringify(allPOs, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
