const { prisma } = require("../lib/prisma");
const xmlBuilder = require("./tally.xmlBuilder");
const tallyClient = require("./tally.client");
const xml2js = require("xml2js");

/**
 * Production-Grade Tally -> ERP Customer Sync
 */
async function importCustomersFromTally() {
    const startTime = new Date();
    console.log(`\n🚀 [${startTime.toISOString()}] Starting Production Tally Sync...`);
    
    try {
        const xmlRequest = xmlBuilder.buildFetchLedgersXML();
        
        // Step 1: Fetch from Tally with Timeout
        let xmlData;
        try {
            xmlData = await tallyClient.sendToTally(xmlRequest);
        } catch (err) {
            console.error("❌ Tally Connection Failed:", err.message);
            return { status: "error", message: "Tally not reachable. Ensure Tally is running on port 9999/9000." };
        }

        if (!xmlData || xmlData.trim() === "") {
            console.error("❌ Received empty response from Tally.");
            return { status: "error", message: "Empty response from Tally" };
        }

        // Step 2: Parse XML
        const parser = new xml2js.Parser({ explicitArray: true, ignoreAttrs: false });
        const result = await parser.parseStringPromise(xmlData);

        // Robust Path Extraction
        const body = result?.ENVELOPE?.BODY?.[0];
        const dataNode = body?.DATA?.[0];
        const collectionNode = dataNode?.COLLECTION?.[0];
        
        // Tally can return ledgers inside COLLECTION directly or inside a named tag
        const ledgers = collectionNode?.LEDGER || collectionNode?.LedgerCollection || [];

        console.log(`📊 Found ${ledgers.length} total ledgers in Tally response.`);

        let successCount = 0;
        let failCount = 0;

        // Step 3: Process Each Ledger
        for (let i = 0; i < ledgers.length; i++) {
            const l = ledgers[i];
            
            // Extract values (Handle both string and object with attributes)
            const getVal = (field) => {
                if (!field || !field[0]) return "";
                return typeof field[0] === 'object' ? field[0]._ : field[0];
            };

            const name = l.$.NAME || getVal(l.NAME);
            const parent = getVal(l.PARENT) || "";

            // DEBUG: Log first 3 ledgers to see structure
            if (i < 3) {
                console.log(`[DEBUG] Ledger Structure for "${name}":`, JSON.stringify(l, null, 2));
            }

            // Filter ONLY Sundry Debtors
            if (!parent.trim().includes("Sundry Debtors")) {
                continue;
            }

            console.log(`🔄 Syncing Customer: "${name}"...`);

            try {
                const customerData = {
                    name,
                    billingAddress: getVal(l["ADDRESS.LIST"]?.[0]?.ADDRESS) || "",
                    state: getVal(l.STATENAME) || "",
                    gstNumber: getVal(l.GSTIN) || "",
                    tallySyncStatus: "SUCCESS",
                    tallyLastSyncedAt: new Date(),
                    tallySyncError: null,
                    status: "Active"
                };

                // UPSERT Logic (Production Grade)
                await prisma.customer.upsert({
                    where: { name: customerData.name },
                    update: customerData,
                    create: {
                        ...customerData,
                        customerType: "Tally Imported"
                    }
                });

                successCount++;
            } catch (err) {
                console.error(`❌ Sync Failed for "${name}":`, err.message);
                failCount++;
                
                // Track Failure in DB if customer exists
                try {
                    await prisma.customer.update({
                        where: { name },
                        data: {
                            tallySyncStatus: "FAILED",
                            tallySyncError: err.message,
                            tallyLastSyncedAt: new Date()
                        }
                    });
                } catch (dbErr) {
                    // Ignore if customer doesn't exist in DB yet
                }
            }
        }

        const endTime = new Date();
        const duration = (endTime - startTime) / 1000;
        console.log(`\n✅ Sync Finished in ${duration}s`);
        console.log(`🟢 Success: ${successCount} | 🔴 Failed: ${failCount}\n`);

        return { 
            status: "success", 
            message: `Sync Complete. Success: ${successCount}, Failed: ${failCount}`,
            successCount,
            failCount
        };

    } catch (err) {
        console.error("❌ Critical Sync Engine Failure:", err);
        return { status: "error", message: "Internal Sync Engine Error: " + err.message };
    }
}

/**
 * Retry Sync for FAILED records only
 */
async function retryFailedSyncs() {
    console.log("🔄 Retrying FAILED sync records...");
    
    const failedCustomers = await prisma.customer.findMany({
        where: { tallySyncStatus: "FAILED" }
    });

    if (failedCustomers.length === 0) {
        return { status: "success", message: "No failed records to retry." };
    }

    console.log(`🚩 Found ${failedCustomers.length} failed records to retry.`);
    
    // We reuse the full import logic to ensure data is fresh from Tally
    // Alternatively, we could sync only these specific names, but full import is safer
    return await importCustomersFromTally();
}

module.exports = { importCustomersFromTally, retryFailedSyncs };
