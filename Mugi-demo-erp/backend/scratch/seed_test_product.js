const { prisma } = require("../lib/prisma");

async function seedTestProduct() {
    console.log("🛠️ Seeding Test Product (ID 1)...");
    
    // Check if product 1 exists
    const existing = await prisma.product.findUnique({ where: { id: 1 } });
    if (existing) {
        console.log("✅ Product ID 1 already exists.");
        return;
    }

    await prisma.product.create({
        data: {
            id: 1,
            productName: "Tally Sync Service Fee",
            sku: "TS-TEST-001",
            category: "Service",
            quantity: 1000,
            price: 0, // Price will be overridden by the order amount
            taxPercent: 18
        }
    });
    console.log("✅ Created Test Product ID 1 successfully!");
}

seedTestProduct()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
