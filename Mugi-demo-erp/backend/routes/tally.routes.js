const express = require("express");
const router = express.Router();
const tallyController = require("../controllers/tally.controller");

router.get("/test", tallyController.testConnection);
router.get("/status", tallyController.getTallyStatus);
router.get("/ledgers", tallyController.getLedgers);
router.get("/sales", tallyController.getSales);
router.get("/purchase", tallyController.getPurchase);
router.get("/profit-loss", tallyController.getProfitLoss);
router.get("/stock", tallyController.getStock);
router.get("/summary", tallyController.getDashboardSummary);

router.post("/sync/invoice", tallyController.syncInvoiceToTally);
router.post("/sync/manual", tallyController.manualSyncInvoice);
router.get("/sync/status/:entityId", tallyController.getSyncStatus);
router.get("/sync/queue", tallyController.getSyncQueue);
router.post("/sync/tally-customers", tallyController.syncTallyCustomers);
router.post("/sync/retry-failed", tallyController.retryFailedSyncs);
router.post("/sync/retry-all", tallyController.bulkRetry);
router.post("/sync/retry/:id", tallyController.manualRetry);

module.exports = router;

