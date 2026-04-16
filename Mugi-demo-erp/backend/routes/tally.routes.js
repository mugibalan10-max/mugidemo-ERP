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

module.exports = router;

