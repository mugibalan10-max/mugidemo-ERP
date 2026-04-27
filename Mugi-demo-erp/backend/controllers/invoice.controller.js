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
    const { customerId, subtotal, gst_percent, items } = req.body;
    // items: [{ productId, quantity, unitPrice }]

    const customer_id = parseInt(customerId);
    const gst_p = Number(gst_percent) || 18;
    const sub_t = Number(subtotal) || 0;
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
                customerId: customer_id,
                subtotal: sub_t,
                gstPercent: gst_p,
                gstAmount: gst_amount,
                total: total,
                items: items ? {
                    create: items.map(i => ({
                        productId: parseInt(i.productId),
                        quantity: parseInt(i.quantity),
                        unitPrice: parseFloat(i.unitPrice),
                        total: parseInt(i.quantity) * parseFloat(i.unitPrice)
                    }))
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
            data: { invoiceNo: invoice_no, customerId: customer_id, amount: total, status: "Pending" }
        });

        // 5. Queue for Tally Sync
        await tx.syncQueue.create({
            data: {
                entityType: "invoice",
                entityId: String(invoice.id),
                payload: invoice,
                status: "QUEUED"
            }
        });

        return invoice;
    });

    res.json({ message: "Invoice Workflow Automated & Stock Deducted Successfully (Queued for Tally Sync)", invoice: result });
    await automationService.runAutomation({ type: "INVOICE_CREATED", data: { invoiceNo: result.invoiceNo, total: result.total } });
  } catch (err) {
    console.error("Workflow Error:", err.message);
    res.status(500).json({ error: err.message || "Workflow Error" });
  }
};

module.exports = { getCustomers, createInvoice };
