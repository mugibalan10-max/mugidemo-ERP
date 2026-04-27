const { prisma } = require('../lib/prisma');

async function check() {
    const data = await prisma.syncQueue.findMany({
        where: { status: 'SUCCESS' },
        select: { id: true, entityType: true, entityId: true, updatedAt: true, payload: true }
    });
    console.log('--- SYNCED ITEMS ---');
    console.log(JSON.stringify(data, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
