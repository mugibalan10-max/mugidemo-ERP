const express = require("express");
const router = express.Router();
const { prisma, pool } = require("../lib/prisma");
const tallyService = require("../services/tally.service");
const automationService = require("../services/automationService");
const { auditLog } = require("../lib/auditLogger");
const { protect, checkPermission } = require("../middleware/auth.middleware");

// Create Invoice - Automated Workflow with Stock Deduction
router.post("/invoices", protect, checkPermission('invoices', 'create'), async (req, res) => {
  try {
    const { customerId, subtotal, gst_percent, items } = req.body;
    // items: [{ productId, quantity, unitPrice }]
    
    const customer_id = parseInt(customerId);
    let sub_t = Number(subtotal) || 0;
    
    // Recalculate subtotal from items to ensure accuracy
    if (items && items.length > 0) {
        sub_t = items.reduce((acc, i) => acc + (parseInt(i.quantity || 0) * parseFloat(i.price || i.unitPrice || 0)), 0);
    }

    const gst_p = Number(gst_percent) || 18;
    const gst_amount = (sub_t * gst_p) / 100;
    const total = sub_t + gst_amount;
    const invoice_no = "INV-" + Date.now();

    const result = await prisma.$transaction(async (tx) => {
        // 1. Validate Stock Availability
        if (items && items.length > 0) {
            for (const item of items) {
                if (item.quantity <= 0) {
                    throw new Error(`Invalid quantity for product ${item.productId}. Quantity must be greater than zero.`);
                }
                const product = await tx.product.findUnique({
                    where: { id: parseInt(item.productId) }
                });
                if (!product) {
                    throw new Error(`Product with ID ${item.productId} not found.`);
                }
                if (product.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for "${product.productName}". Required: ${item.quantity}, Available: ${product.quantity}`);
                }
            }
        }

        // 2. Create Invoice with Items
        const invoice = await tx.invoice.create({
            data: {
                invoiceNo: invoice_no,
                customer: { connect: { id: customer_id } },
                subtotal: sub_t,
                gstPercent: gst_p,
                gstAmount: gst_amount,
                total: total,
                items: items ? {
                    create: items.map(i => {
                        const price = parseFloat(i.price || i.unitPrice || 0);
                        const qty = parseInt(i.quantity || 0);
                        return {
                            product: { connect: { id: parseInt(i.productId) } },
                            quantity: qty,
                            unitPrice: price,
                            total: qty * price
                        };
                    })
                } : undefined
            },
            include: { items: true, customer: true }
        });

        // 3. Deduct Stock & Log Movement
        if (items && items.length > 0) {
            for (const item of items) {
                const updatedProduct = await tx.product.update({
                    where: { id: parseInt(item.productId) },
                    data: {
                        quantity: { decrement: parseInt(item.quantity) }
                    }
                });

                await tx.activityLog.create({
                    data: {
                        module: "Inventory",
                        action: "STOCK_OUT",
                        targetId: updatedProduct.id,
                        message: `Stock deducted: ${item.quantity} units for ${updatedProduct.productName} via Invoice ${invoice_no}`,
                        newData: { newQuantity: updatedProduct.quantity }
                    }
                });
            }
        }

        // 4. Create Payment Record
        await tx.payment.create({
            data: {
                invoiceNo: invoice_no,
                customerId: customer_id,
                amount: total,
                status: "Pending"
            }
        });

        // 5. Log Invoice Activity
        await tx.activityLog.create({
            data: {
                module: "Invoicing",
                action: "Generation",
                targetId: invoice.id,
                message: `Invoice ${invoice_no} generated for Customer ID ${customer_id}. Total: ₹${total}`,
                newData: invoice,
                ipAddress: req.socket.remoteAddress
            }
        });

        // 6. Queue for Tally Sync
        const syncEntry = await tx.syncQueue.create({
            data: {
                entityType: "invoice",
                entityId: String(invoice.id),
                payload: invoice,
                status: "QUEUED"
            }
        });

        return { invoice, syncEntry };
    });

    res.json({ 
        message: "✅ Invoice Workflow Automated & Stock Deducted Successfully", 
        invoice_no: result.invoice.invoiceNo, 
        total: result.invoice.total,
        syncStatus: "QUEUED"
    });

    await automationService.runAutomation({
        type: "INVOICE_CREATED",
        data: { invoiceNo: result.invoice.invoiceNo, total: result.invoice.total }
    });
  } catch (err) {
    console.error("Workflow Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to process automated invoice workflow" });
  }
});

// Get all invoices
router.get("/invoices", protect, checkPermission('invoices', 'view'), async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            include: { customer: true },
            orderBy: { createdAt: 'desc' }
        });
        const syncStatuses = await prisma.syncQueue.findMany({
            where: { entityType: "invoice" }
        });
        const result = invoices.map(inv => {
            const sync = syncStatuses.find(s => s.entityId === String(inv.id));
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
    const { invoice_no, customerId, amount } = req.body;
    const customer_id = parseInt(customerId);
    
    await prisma.payment.create({
        data: {
            invoiceNo: invoice_no,
            customerId: customer_id,
            amount: parseFloat(amount),
            status: 'Completed'
        }
    });

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
router.get("/ledger/balance/:customerId", async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const invoices = await prisma.invoice.aggregate({
      where: { customerId: customerId },
      _sum: { total: true }
    });
    const payments = await prisma.payment.findMany({
      where: { customerId: customerId }
    });
    const totalPaid = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalInvoiced = Number(invoices._sum.total) || 0;
    const balance = totalInvoiced - totalPaid;

    res.json({
      customerId,
      customerName: customer.name,
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
