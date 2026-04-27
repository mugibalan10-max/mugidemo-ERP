const { prisma } = require('../lib/prisma');

async function seedVendors() {
  console.log("🚀 Starting vendor seeding...");

  const vendors = [
    {
      vendorCode: "VEND-001",
      vendorName: "Global Tech Solutions",
      gstNumber: "27AAAAA0000A1Z5",
      phone: "+91 9876543210",
      email: "info@globaltech.com",
      address: "B-402, IT Park, Hinjewadi Phase 1, Pune - 411057"
    },
    {
      vendorCode: "VEND-002",
      vendorName: "Shree Ganesh Enterprises",
      gstNumber: "09BBBBB1111B2Z6",
      phone: "+91 8888877777",
      email: "sales@shreeganesh.in",
      address: "12/A, Industrial Estate, Sector 5, Lucknow, UP"
    },
    {
      vendorCode: "VEND-003",
      vendorName: "Apex Logistics & Supplies",
      gstNumber: "07CCCCC2222C3Z7",
      phone: "+91 9123456789",
      email: "contact@apexlogistics.com",
      address: "Warehouse Block C, Inland Container Depot, Tughlakabad, Delhi"
    },
    {
      vendorCode: "VEND-004",
      vendorName: "Modern Office Furnishings",
      gstNumber: "33DDDDD3333D4Z8",
      phone: "+91 4455566677",
      email: "support@modernoffice.in",
      address: "No. 8, Furniture Street, Guindy, Chennai, TN"
    },
    {
      vendorCode: "VEND-005",
      vendorName: "Suryavanshi Steels Ltd",
      gstNumber: "22EEEEE4444E5Z9",
      phone: "+11 2345 6789",
      email: "billing@suryasteels.com",
      address: "Steel Plant Colony, Bhilai, Chhattisgarh"
    }
  ];

  for (const v of vendors) {
    const vendor = await prisma.vendor.upsert({
      where: { vendorCode: v.vendorCode },
      update: v,
      create: v
    });

    // Also initialize a ledger for each vendor if it doesn't exist
    await prisma.vendorLedger.upsert({
      where: { vendorId: vendor.id },
      update: {},
      create: {
        vendorId: vendor.id,
        openingBalance: 0,
        currentBalance: 0
      }
    });
  }

  console.log("✅ Seeded 5 Vendors and their Ledgers!");
}

seedVendors()
  .catch(e => {
    console.error("❌ Error seeding vendors:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
