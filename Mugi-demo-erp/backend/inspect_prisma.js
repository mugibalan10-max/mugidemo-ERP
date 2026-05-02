const { prisma } = require("./lib/prisma");

async function main() {
  console.log("Lead fields:", Object.keys(prisma.lead));
  // This might not show data fields, but let's try to find the dmmf or similar
  console.log("Model names:", prisma._runtimeDataModel.models.Lead.fields.map(f => f.name));
}

main().catch(console.error).finally(() => prisma.$disconnect());
