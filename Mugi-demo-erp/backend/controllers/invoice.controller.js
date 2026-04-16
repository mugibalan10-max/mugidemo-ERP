const { prisma, pool } = require("../lib/prisma");
const tallyService = require("../services/tally.service");
const automationService = require("../services/automationService");

const getCustomers = async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({ orderBy: { id: 'desc' } });
        res.json(customers);
    } catch (err) {
        res.status(500).send("Error fetching customers");
    }
};

const createInvoice = async (req, res) => {
  try {
    const { customer_name, subtotal, gst_percent } = req.body;
    const gst_p = Number(gst_percent) || 18;
    const sub_t = Number(subtotal) || 0;
    const gst_amount = (sub_t * gst_p) / 100;
    const total = sub_t + gst_amount;
    const invoice_no = "INV-" + Date.now();

    const result = await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
            data: { invoiceNo: invoice_no, customerName: customer_name, subtotal: sub_t, gstPercent: gst_p, gstAmount: gst_amount, total: total }
        });
        await tx.payment.create({
            data: { invoiceNo: invoice_no, customerName: customer_name, amount: total, status: "Pending" }
        });
        await tx.syncQueue.create({
            data: { module: "Invoice", recordId: invoice.id, status: "Pending Retry", syncType: "Tally" }
        });
        return invoice;
    });

    try {
        await tallyService.pushSalesToTally(result);
        await tallyService.updateSyncStatus(result.id, "Invoice", "Success");
    } catch (tallyErr) {
        console.warn("Tally Background Sync Delayed");
    }

    res.json({ message: "Invoice Automated Successfully", invoice: result });
    await automationService.runAutomation({ type: "INVOICE_CREATED", data: { invoiceNo: result.invoiceNo, total: result.total } });
  } catch (err) {
    res.status(500).json({ error: "Workflow Error" });
  }
};

module.exports = { getCustomers, createInvoice };
