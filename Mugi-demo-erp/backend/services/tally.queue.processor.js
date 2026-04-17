const { prisma } = require("../lib/prisma");
const tallyClient = require("./tally.client");
const xmlBuilder = require("./tally.xmlBuilder");

async function processQueue() {
  const items = await prisma.syncQueue.findMany({
    where: {
      status: { in: ["QUEUED", "FAILED"] },
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: new Date() } }
      ]
    },
    take: 10
  });

  for (const item of items) {
    try {
      await prisma.syncQueue.update({
        where: { id: item.id },
        data: { status: "PROCESSING" }
      });

      await pushToTally(item);

      await prisma.syncQueue.update({
        where: { id: item.id },
        data: { status: "SUCCESS", lastError: null }
      });
      console.log(`Successfully synced ${item.entityType} ${item.entityId} to Tally.`);

    } catch (error) {
      console.error(`Error syncing ${item.entityType} ${item.entityId}:`, error.message);
      const retryCount = item.retryCount + 1;

      await prisma.syncQueue.update({
        where: { id: item.id },
        data: {
          status: retryCount >= item.maxRetries ? "FAILED" : "QUEUED",
          retryCount,
          nextRetryAt: new Date(Date.now() + retryCount * 60000), // Wait 1 min * retry count
          lastError: error.message
        }
      });
    }
  }
}

async function pushToTally(item) {
  let xml = "";
  if (item.entityType === "invoice") {
    const invoice = item.payload;
    const mappedData = {
        date: invoice.date || new Date(invoice.createdAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, ""),
        customer: invoice.customer || invoice.customerName,
        number: invoice.number || invoice.invoiceNo,
        amount: invoice.amount || invoice.total
    };
    xml = xmlBuilder.buildSalesXML(mappedData);
  } else if (item.entityType === "payment") {
    xml = xmlBuilder.buildReceiptXML(item.payload, item.payload.customerName);
  } else if (item.entityType === "stock") {
    xml = xmlBuilder.buildStockXML(item.payload);
  } else {
    throw new Error(`Unknown entity type: ${item.entityType}`);
  }

  if (xml) {
    return await tallyClient.sendToTally(xml);
  }
}

module.exports = { processQueue };
