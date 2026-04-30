const cron = require("node-cron");
const { importCustomersFromTally } = require("../services/tally.import.service");

// Run Every 5 Minutes (Production Frequency)
cron.schedule("*/5 * * * *", async () => {
    console.log(`[${new Date().toISOString()}] 🔄 Running Automated Tally Inbound Sync...`);
    try {
        await importCustomersFromTally();
    } catch (err) {
        console.error("Automated Tally Import Worker Error:", err.message);
    }
});

console.log("🚀 Tally Inbound Sync Worker Initialized (Cron: Every 5 Minutes)");
