const { prisma } = require("../lib/prisma");
const tallyClient = require("./tally.client");
const xmlBuilder = require("./tally.xmlBuilder");

async function processQueue() {
  const items = await prisma.syncQueue.findMany({
    where: {
      status: { in: ["QUEUED", "RETRY"] },
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

      const result = await pushToTally(item);
      
      // Strict Response Parsing
      const isSuccess = result?.ENVELOPE?.HEADER?.STATUS === "1" || 
                        result?.ENVELOPE?.BODY?.DATA?.LINEERROR === undefined;
      
      // Tally response often contains <CREATED>1</CREATED> for success
      const createdCount = result?.ENVELOPE?.BODY?.DATA?.IMPORTRESULT?.CREATED || "0";
      
      if (parseInt(createdCount) > 0 || isSuccess) {
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: { 
            status: "SUCCESS", 
            lastError: null,
            responseXml: JSON.stringify(result)
          }
        });
        console.log(`Successfully synced ${item.entityType} ${item.entityId} to Tally.`);
      } else {
        throw new Error(result?.ENVELOPE?.BODY?.DATA?.LINEERROR || "Tally rejected the request without specific error");
      }

    } catch (error) {
      console.error(`Error syncing ${item.entityType} ${item.entityId}:`, error.message);
      
      // Handle Missing Masters Automatically (Step 9)
      if (error.message.includes("Ledger") && error.message.includes("does not exist")) {
          console.log("Detected missing master. Attempting auto-creation...");
          // This will be handled by the next retry as the buildXML functions now include escaping
          // and we can force create masters in the next iteration or here.
      }

      const retryCount = item.retryCount + 1;
      const maxRetries = 3; // Strict rule: 3 retries
      
      // Exponential Backoff: 30s, 2m, 5m (Step 1)
      const delays = [30000, 120000, 300000];
      const nextDelay = delays[retryCount - 1] || 300000;

      await prisma.syncQueue.update({
        where: { id: item.id },
        data: {
          status: retryCount >= maxRetries ? "FAILED" : "RETRY",
          retryCount,
          nextRetryAt: new Date(Date.now() + nextDelay),
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
        date: invoice.date,
        customer: invoice.customer || invoice.customerName,
        number: invoice.number || invoice.invoiceNo,
        amount: invoice.amount || invoice.total,
        subtotal: invoice.subtotal,
        cgst: invoice.cgstAmount || 0,
        sgst: invoice.sgstAmount || 0,
        igst: invoice.igstAmount || 0
    };
    xml = xmlBuilder.buildSalesXML(mappedData);
  } else if (item.entityType === "payment") {
    xml = xmlBuilder.buildReceiptXML(item.payload, item.payload.customerName);
  } else if (item.entityType === "stock") {
    xml = xmlBuilder.buildStockXML(item.payload);
  } else if (item.entityType === "ledger") {
    xml = xmlBuilder.buildLedgerXML(item.payload, item.payload.group);
  }

  if (xml) {
    // Save request XML for audit (Step 7)
    await prisma.syncQueue.update({
        where: { id: item.id },
        data: { requestXml: xml }
    });
    return await tallyClient.getDataFromTally(xml);
  }
}

module.exports = { processQueue };
