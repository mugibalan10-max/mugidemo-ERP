const { prisma } = require("../lib/prisma");

async function deduplicate() {
    console.log("🔍 Checking for duplicate customers...");
    const customers = await prisma.customer.findMany();
    const seen = new Set();
    const duplicates = [];

    for (const c of customers) {
        if (seen.has(c.name)) {
            duplicates.push(c.id);
        } else {
            seen.add(c.name);
        }
    }

    if (duplicates.length > 0) {
        console.log(`🗑️ Deleting ${duplicates.length} duplicate customers...`);
        await prisma.customer.deleteMany({
            where: { id: { in: duplicates } }
        });
        console.log("✅ Deduplication complete.");
    } else {
        console.log("✅ No duplicates found.");
    }
}

deduplicate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
