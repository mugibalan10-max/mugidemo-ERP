const { prisma } = require("../lib/prisma");

async function checkAll() {
    console.log("🔍 Fetching All Customers and their Sync Status...");
    const customers = await prisma.customer.findMany({
        select: { name: true, tallySyncStatus: true, tallySyncError: true }
    });

    console.log(`\n📊 Total Customers: ${customers.length}`);
    customers.forEach(c => {
        console.log(`- ${c.name}: [${c.tallySyncStatus || 'NULL'}] ${c.tallySyncError || ''}`);
    });
}

checkAll()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
