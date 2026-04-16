const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoice.controller");

router.get("/customers", invoiceController.getCustomers);
router.post("/invoices", invoiceController.createInvoice);

module.exports = router;
