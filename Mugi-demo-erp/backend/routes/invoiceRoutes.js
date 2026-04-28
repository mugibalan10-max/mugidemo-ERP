const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/prisma");
const tallyService = require("../services/tally.service");
const { protect } = require("../middleware/auth.middleware");

// Helper: Simulate PDF Generation
function generatePDFInvoice(invoiceNo) {
    return `https://erp.mugidemo.com/invoices/${invoiceNo}.pdf`;
}

// ==========================================
// 1-4. INVOICE CREATION & TAX ENGINE
// ==========================================
router.post("/invoices", protect, async (req, res) => {
  try {
    const { 
        customerId, items, currency, isInterState, 
        discountTotal, orderId, dueDate, invoiceDate 
    } = req.body;
    
    // items: [{ productId, quantity, unitPrice, discount, taxPercent }]
    
    // Validate Customer & Credit Limit
    const [customer, ledger] = await Promise.all([
        prisma.customer.findUnique({ where: { id: parseInt(customerId) } }),
        prisma.customerLedger.findUnique({ where: { customerId: parseInt(customerId) } })
    ]);
    
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // Calculate Subtotal & Tax Logic (CGST/SGST vs IGST)
    let calculatedSubtotal = 0;
    let totalTaxAmount = 0;

    const validatedItems = items.map(item => {
        const itemSubtotal = (item.quantity * item.unitPrice) - (item.discount || 0);
        const itemTax = (itemSubtotal * (item.taxPercent || 18)) / 100;
        
        calculatedSubtotal += itemSubtotal;
        totalTaxAmount += itemTax;

        return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            discount: parseFloat(item.discount || 0),
            taxPercent: parseFloat(item.taxPercent || 18),
            total: itemSubtotal + itemTax
        };
    });

    const finalSubtotal = calculatedSubtotal - parseFloat(discountTotal || 0);
    let cgst = 0, sgst = 0, igst = 0;

    if (isInterState) {
        igst = totalTaxAmount; // Inter-state: 100% IGST
    } else {
        cgst = totalTaxAmount / 2; // Intra-state: 50% CGST
        sgst = totalTaxAmount / 2; // Intra-state: 50% SGST
    }

    const totalPayable = finalSubtotal + totalTaxAmount;

    // Credit Limit Check (Validation Engine)
    const newOutstanding = parseFloat(ledger?.outstandingAmount || 0) + totalPayable;
    if (newOutstanding > parseFloat(customer.creditLimit) && parseFloat(customer.creditLimit) > 0) {
        return res.status(403).json({ error: "Credit Limit Exceeded", requiredApproval: true });
    }

    const invoiceNo = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const pdfUrl = generatePDFInvoice(invoiceNo);

    // 5 & 6. AUTO JOURNAL & INVENTORY
    const result = await prisma.$transaction(async (tx) => {
        
        // Ensure dummy products exist for testing
        let fallbackProduct = await tx.product.findFirst();
        if (!fallbackProduct) {
            fallbackProduct = await tx.product.create({
                data: { productName: "Enterprise Plan", sku: "ENT-1", price: 1000, quantity: 100 }
            });
        }

        const invoice = await tx.invoice.create({
            data: {
                invoiceNo,
                customerId: parseInt(customerId),
                orderId: orderId ? parseInt(orderId) : null,
                subtotal: finalSubtotal,
                discount: parseFloat(discountTotal || 0),
                cgstAmount: cgst,
                sgstAmount: sgst,
                igstAmount: igst,
                total: totalPayable,
                currency: currency || 'INR',
                status: 'Approved', // Auto-approved if under limit
                dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30*24*60*60*1000), // Net 30
                createdAt: invoiceDate ? new Date(invoiceDate) : undefined,
                pdfUrl,
                items: {
                    create: validatedItems.map(i => ({ ...i, productId: fallbackProduct.id })) // Safe ID for demo
                }
            },
            include: { items: true, customer: true }
        });

        // Inventory Deduction
        for (const item of validatedItems) {
            const prod = await tx.product.findUnique({ where: { id: fallbackProduct.id } });
            if (prod) {
                await tx.product.update({
                    where: { id: fallbackProduct.id },
                    data: { quantity: { decrement: item.quantity } }
                });
            }
        }

        // Ledger Update (Customer Dr to Sales)
        if (ledger) {
            await tx.customerLedger.update({
                where: { customerId: customer.id },
                data: {
                    outstandingAmount: { increment: totalPayable },
                    totalBilled: { increment: totalPayable }
                }
            });
        }

        return invoice;
    });

    // 11. AUTOMATION: Push to Tally & Notify
    await tallyService.pushSalesToTally(result).catch(e => console.error("Tally Sync Pending"));

    res.status(201).json({ 
        message: "Invoice generated successfully", 
        invoice: result,
        accountingEntry: `Customer Dr ${totalPayable} | To Sales ${finalSubtotal} | To GST Output ${totalTaxAmount}`
    });

  } catch (err) {
    console.error("Invoice Creation Error:", err);
    res.status(500).json({ error: "Failed to generate invoice", details: err.message });
  }
});

// ==========================================
// 9. PAYMENT TRACKING
// ==========================================
router.post("/invoices/:id/payments", protect, async (req, res) => {
    try {
        const { amount, method } = req.body;
        const invoiceId = parseInt(req.params.id);

        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
            if (!invoice) throw new Error("Invoice not found");

            const paymentAmt = parseFloat(amount);
            const newAmountPaid = parseFloat(invoice.amountPaid) + paymentAmt;
            const newStatus = newAmountPaid >= parseFloat(invoice.total) ? 'Paid' : 'Partially Paid';

            const updatedInvoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: { amountPaid: newAmountPaid, status: newStatus }
            });

            await tx.payment.create({
                data: {
                    invoiceNo: invoice.invoiceNo,
                    customerId: invoice.customerId,
                    amount: paymentAmt,
                    status: 'Completed',
                    method: method || 'Bank Transfer'
                }
            });

            await tx.customerLedger.update({
                where: { customerId: invoice.customerId },
                data: { outstandingAmount: { decrement: paymentAmt }, totalPaid: { increment: paymentAmt } }
            });

            return updatedInvoice;
        });

        res.status(201).json({ message: "Payment recorded", result });
    } catch (err) {
        res.status(500).json({ error: "Failed to process payment" });
    }
});

// ==========================================
// 12. REPORTS (Sales Register & Aging)
// ==========================================
router.get("/invoices/reports/register", protect, async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            include: { customer: { select: { name: true, gstNumber: true } } },
            orderBy: { createdAt: 'desc' }
        });

        // Build GST Sales Register
        const register = invoices.map(inv => ({
            invoiceNo: inv.invoiceNo,
            date: inv.createdAt,
            customerName: inv.customer.name,
            gstin: inv.customer.gstNumber,
            taxableValue: inv.subtotal,
            cgst: inv.cgstAmount,
            sgst: inv.sgstAmount,
            igst: inv.igstAmount,
            totalValue: inv.total,
            status: inv.status
        }));

        res.json(register);
    } catch (err) {
        res.status(500).json({ error: "Failed to generate sales register" });
    }
});

module.exports = router;
