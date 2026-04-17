const { prisma } = require('./lib/prisma');

async function seed() {
  console.log('🚀 Seeding demo financial data...');

  try {
      // Clear existing data to avoid unique constraint errors
      console.log('Cleaning existing data...');
      await prisma.syncQueue.deleteMany({});
      await prisma.payment.deleteMany({});
      await prisma.invoice.deleteMany({});
      await prisma.product.deleteMany({});

      // Create some products
      const p1 = await prisma.product.create({
        data: { productName: 'Professional Laptop', sku: 'LP-001', quantity: 50, price: 75000 }
      });

      const p2 = await prisma.product.create({
        data: { productName: '27-inch Monitor', sku: 'MN-002', quantity: 120, price: 15000 }
      });

      // Create some invoices
      const inv1 = await prisma.invoice.create({
        data: {
          invoiceNo: 'INV-2024-001',
          customerName: 'TechCorp Solutions',
          subtotal: 150000,
          gstPercent: 18,
          gstAmount: 27000,
          total: 177000,
          status: 'Paid'
        }
      });

      const inv2 = await prisma.invoice.create({
        data: {
          invoiceNo: 'INV-2024-002',
          customerName: 'GlobeLink Logistics',
          subtotal: 45000,
          gstPercent: 18,
          gstAmount: 8100,
          total: 53100,
          status: 'Unpaid'
        }
      });

      // Create payments
      await prisma.payment.create({
        data: {
          invoiceNo: 'INV-2024-001',
          customerName: 'TechCorp Solutions',
          amount: 177000,
          status: 'Success'
        }
      });

      // Create some sync queue entries (demoing the new structure)
      await prisma.syncQueue.create({
        data: {
          entityType: 'invoice',
          entityId: inv1.invoiceNo,
          status: 'SUCCESS',
          payload: inv1
        }
      });

      await prisma.syncQueue.create({
        data: {
          entityType: 'invoice',
          entityId: inv2.invoiceNo,
          status: 'QUEUED',
          payload: inv2
        }
      });

      await prisma.syncQueue.create({
        data: {
          entityType: 'stock',
          entityId: 'LP-001',
          status: 'FAILED',
          payload: p1,
          lastError: 'Tally connection timeout after 5 attempts',
          retryCount: 5
        }
      });

      console.log('✅ Demo financial data seeded successfully!');
  } catch (err) {
      console.error('❌ Seeding error:', err.message);
  } finally {
      await prisma.$disconnect();
  }
}

seed();
