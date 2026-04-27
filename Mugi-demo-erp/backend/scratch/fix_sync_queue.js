const { prisma } = require('../lib/prisma');

async function fixQueue() {
    const failedItems = await prisma.syncQueue.findMany({
        where: { status: 'FAILED', lastError: 'Tally Sync Error: Customer name is missing.' }
    });

    console.log(`Found ${failedItems.length} items to fix.`);

    for (const item of failedItems) {
        const payload = item.payload;
        if (!payload.customerName && payload.customerId) {
            const customer = await prisma.customer.findUnique({
                where: { id: payload.customerId }
            });
            
            if (customer) {
                payload.customerName = customer.name;
                payload.customer = customer;
                
                await prisma.syncQueue.update({
                    where: { id: item.id },
                    data: {
                        payload: payload,
                        status: 'QUEUED',
                        retryCount: 0,
                        nextRetryAt: null
                    }
                });
                console.log(`Fixed and re-queued Invoice ${payload.invoiceNo}`);
            }
        }
    }
}

fixQueue().catch(console.error).finally(() => prisma.$disconnect());
