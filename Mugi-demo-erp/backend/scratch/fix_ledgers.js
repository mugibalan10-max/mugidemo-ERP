const { prisma } = require("../lib/prisma");

async function fixMissingLedgers() {
    console.log("🔍 Checking for customers with missing ledgers...");
    
    const customers = await prisma.customer.findMany({
        where: { ledger: null }
    });

    if (customers.length === 0) {
        console.log("✅ All customers have ledgers.");
        return;
    }

    console.log(`🛠️ Fixing ${customers.length} customers...`);
    for (const c of customers) {
        await prisma.customerLedger.create({
            data: { customerId: c.id }
        }).catch(() => {}); // Ignore if created in parallel
    }
    console.log("✅ Fix complete.");
}

fixMissingLedgers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
