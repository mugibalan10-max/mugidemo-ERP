const cron = require("node-cron");
const { processQueue } = require("../services/tally.queue.processor");

// Run every minute
cron.schedule("*/1 * * * *", async () => {
  console.log(`[${new Date().toISOString()}] Running Tally Sync Worker...`);
  try {
    await processQueue();
  } catch (error) {
    console.error("Worker failed to process queue:", error.message);
  }
});

console.log("Tally Sync Worker Initialized (Cron: */1 * * * *)");
