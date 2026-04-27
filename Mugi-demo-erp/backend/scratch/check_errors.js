const { prisma } = require('../lib/prisma');

async function check() {
    const data = await prisma.syncQueue.findMany({
        where: { status: { in: ['FAILED', 'QUEUED'] } }
    });
    console.log(JSON.stringify(data, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
