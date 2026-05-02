const { prisma } = require("../lib/prisma");

async function checkErrors() {
    console.log("🔍 Fetching Tally Sync errors from Database...");
    const failedCustomers = await prisma.customer.findMany({
        where: { tallySyncStatus: "FAILED" },
        select: { name: true, tallySyncError: true }
    });

    if (failedCustomers.length === 0) {
        console.log("✅ No failed records found in DB.");
        return;
    }

    console.log("\n❌ FOUND ERRORS:");
    failedCustomers.forEach(c => {
        console.log(`--------------------------------------------------`);
        console.log(`Customer: ${c.name}`);
        console.log(`Error: ${c.tallySyncError}`);
    });
}

checkErrors()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
