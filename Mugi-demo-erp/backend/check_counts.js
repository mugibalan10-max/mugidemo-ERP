const { prisma } = require('./lib/prisma');

async function check() {
  try {
    const counts = {
      invoices: await prisma.invoice.count(),
      syncQueue: await prisma.syncQueue.count(),
      payments: await prisma.payment.count(),
      employees: await prisma.employee.count(),
      products: await prisma.product.count()
    };
    console.log('Record Counts:', JSON.stringify(counts, null, 2));
  } catch (err) {
    console.error('Error checking counts:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
