const express = require("express");
const router = express.Router();
const { prisma, pool } = require("../lib/prisma");
const tallyService = require("../services/tally.service");
const automationService = require("../services/automationService");
const { auditLog } = require("../lib/auditLogger");

// Get all customers
router.get("/customers", async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { id: 'desc' }
        });
        res.json(customers);
    } catch (err) {
        res.status(500).send("Error fetching customers");
    }
});

// Create Invoice - Automated Workflow
router.post("/invoices", async (req, res) => {
  try {
    const { customer_name, subtotal, gst_percent } = req.body;
    const gst_p = Number(gst_percent) || 18;
    const sub_t = Number(subtotal) || 0;
    const gst_amount = (sub_t * gst_p) / 100;
    const total = sub_t + gst_amount;
    const invoice_no = "INV-" + Date.now();

    const result = await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
            data: {
                invoiceNo: invoice_no,
                customerName: customer_name,
                subtotal: sub_t,
                gstPercent: gst_p,
                gstAmount: gst_amount,
                total: total
            }
        });

        await tx.payment.create({
            data: {
                invoiceNo: invoice_no,
                customerName: customer_name,
                amount: total,
                status: "Pending"
            }
        });

        await tx.activityLog.create({
            data: {
                module: "Invoicing",
                action: "Generation",
                targetId: invoice.id,
                message: `Invoice ${invoice_no} generated for ${customer_name}. Total: ₹${total}`,
                newData: invoice,
                ipAddress: req.socket.remoteAddress
            }
        });

        const syncEntry = await tx.syncQueue.create({
            data: {
                module: "Invoice",
                recordId: invoice.id,
                status: "Pending Retry",
                syncType: "Tally"
            }
        });

        return { invoice, syncEntry };
    });

    let tallyStatus = "Pending Retry";
    try {
        await tallyService.pushSalesToTally(result.invoice);
        await tallyService.updateSyncStatus(result.invoice.id, "Invoice", "Success");
        tallyStatus = "Success";
    } catch (tallyErr) {
        console.warn("Tally Background Sync Delayed:", tallyErr.message);
    }

    res.json({ 
        message: "✅ Invoice Workflow Automated Successfully", 
        invoice_no: result.invoice.invoiceNo, 
        total: result.invoice.total,
        syncStatus: tallyStatus
    });

    await automationService.runAutomation({
        type: "INVOICE_CREATED",
        data: { invoiceNo: result.invoice.invoiceNo, total: result.invoice.total }
    });
  } catch (err) {
    console.error("Workflow Error:", err.message);
    res.status(500).json({ error: "Failed to process automated invoice workflow" });
  }
});

// Get all invoices
router.get("/invoices", async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            orderBy: { createdAt: 'desc' }
        });
        const syncStatuses = await prisma.syncQueue.findMany({
            where: { module: "Invoice" }
        });
        const result = invoices.map(inv => {
            const sync = syncStatuses.find(s => s.recordId === inv.id);
            return {
                ...inv,
                syncStatus: sync ? sync.status : "Not Queued"
            };
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch invoices" });
    }
});

// Process Payment
router.post("/payments", async (req, res) => {
  try {
    const { invoice_no, customer_name, amount } = req.body;
    await pool.query(
      `INSERT INTO payments (invoice_no, customer_name, amount, status)
       VALUES ($1,$2,$3,'Completed')`,
      [invoice_no, customer_name, amount]
    );

    await automationService.runAutomation({
        type: "PAYMENT_DONE",
        data: { invoiceNo: invoice_no, amount, customerName: customer_name }
    });

    let tallySynced = false;
    try {
        await tallyService.syncPayment({ amount }, customer_name);
        await prisma.activityLog.create({
            data: {
                module: "Tally",
                action: "Payment Sync",
                message: `Payment for ${invoice_no} successfully synced to Tally.`
            }
        });
        tallySynced = true;
    } catch (tallyErr) {
        console.warn("Tally Payment Sync Delayed:", tallyErr.message);
    }

    res.json({
        message: "✅ Payment Recorded & Automation Flow Completed",
        invoice_no,
        tallySynced
    });
  } catch (err) {
    console.error("Payment Flow Error:", err.message);
    res.status(500).json({ error: "Failed to process payment automation flow" });
  }
});

// Ledger Balance Calculation
router.get("/ledger/balance/:customerName", async (req, res) => {
  try {
    const { customerName } = req.params;
    const invoices = await prisma.invoice.aggregate({
      where: { customerName: customerName },
      _sum: { total: true }
    });
    const payments = await prisma.payment.findMany({
      where: { customerName: customerName }
    });
    const totalPaid = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalInvoiced = Number(invoices._sum.total) || 0;
    const balance = totalInvoiced - totalPaid;

    res.json({
      customerName,
      totalInvoiced,
      totalPaid,
      balance,
      status: balance <= 0 ? "Clear" : "Outstanding"
    });
  } catch (err) {
    res.status(500).send("Error calculating balance");
  }
});

module.exports = router;
