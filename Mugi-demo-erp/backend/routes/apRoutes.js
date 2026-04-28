const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { protect, authorize } = require('../middleware/auth.middleware');

// Create Vendor Bill with 3-Way Match
router.post('/bills', async (req, res) => {
    try {
        const { vendorId, poId, grnId, invoiceNumber, billDate, dueDate, subtotal, taxAmount, totalAmount } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Duplicate Invoice Detection
            const duplicate = await tx.vendorBill.findFirst({
                where: { vendorId: parseInt(vendorId), invoiceNumber }
            });

            if (duplicate) {
                return { error: true, code: 'DUPLICATE_INVOICE', message: "Invoice already exists for this vendor." };
            }

            // 2. Fetch Reference Documents for 3-Way Matching
            const po = await tx.purchaseOrder.findUnique({
                where: { id: parseInt(poId) },
                include: { items: true }
            });
            const grn = await tx.gRN.findUnique({
                where: { id: parseInt(grnId) },
                include: { items: true }
            });

            if (!po) {
                return { error: true, code: 'MISSING_REFERENCES', message: "Purchase Order not found." };
            }

            // 3. 3-Way Match Engine Execution
            let exceptionNote = null;
            let status = 'Matched';

            if (!grn) {
                status = 'Exception';
                exceptionNote = "Missing GRN: No valid Goods Receipt found for this PO. 3-Way match failed.";
            } else {
                // Qty Check (Invoice vs GRN) - Simplified logic assuming single item bulk PO for now
                const totalOrderedQty = po.items.reduce((sum, item) => sum + item.quantity, 0);
                const totalReceivedQty = grn.items.reduce((sum, item) => sum + item.receivedQty, 0);
                
                if (totalReceivedQty < totalOrderedQty) {
                    status = 'Exception';
                    exceptionNote = `Quantity Mismatch: GRN shows partial receipt (${totalReceivedQty} vs ${totalOrderedQty}).`;
                }
            }

            // Rate/Price Check (Invoice vs PO)
            const poSubtotal = Number(po.totalAmount) - Number(po.taxAmount);
            if (Number(subtotal) > poSubtotal + 1) { // Allowing 1 unit variance
                status = 'Exception';
                exceptionNote = (exceptionNote ? exceptionNote + " | " : "") + `Price Mismatch: Invoice subtotal (${subtotal}) is greater than PO subtotal (${poSubtotal}).`;
            }

            // 4. Create Vendor Bill
            const billNumber = `VB-${Date.now().toString().slice(-6)}`;
            const bill = await tx.vendorBill.create({
                data: {
                    billNumber,
                    invoiceNumber,
                    vendorId: parseInt(vendorId),
                    poId: po.id,
                    grnId: grn ? grn.id : null,
                    billDate: new Date(billDate),
                    dueDate: new Date(dueDate),
                    subtotal: Number(subtotal),
                    taxAmount: Number(taxAmount),
                    totalAmount: Number(totalAmount),
                    balanceAmount: Number(totalAmount),
                    status,
                    approvalStatus: 'Pending',
                    exceptionNote
                }
            });

            // 5. Audit Log
            await tx.activityLog.create({
                data: {
                    module: 'Accounts Payable',
                    action: 'Create Bill',
                    message: `Vendor Bill ${billNumber} created with status: ${status}.`,
                    targetId: bill.id
                }
            });

            return bill;
        });

        if (result.error) return res.status(400).json(result);

        res.status(201).json(result);
    } catch (error) {
        console.error("AP Error:", error);
        res.status(500).json({ error: "Failed to create Vendor Bill", details: error.message });
    }
});

// Approval Workflow Engine
router.post('/bills/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await prisma.$transaction(async (tx) => {
            const bill = await tx.vendorBill.findUnique({ where: { id: parseInt(id) } });
            if (!bill) return { error: true, message: "Bill not found." };
            if (bill.status === 'Exception') return { error: true, message: "Cannot approve a bill with an active exception. Resolve exception first." };
            if (bill.approvalStatus === 'Approved') return { error: true, message: "Bill already approved." };

            // Dynamic Approval Rules
            let nextApprovalStatus = 'Approved';
            let nextStatus = 'Approved';
            
            // Assume multi-level mapping checking req.user.role here (skipped for demo, auto-approving based on amounts)
            const amount = Number(bill.totalAmount);
            if (amount > 500000) {
                // Requires Finance Head
                nextApprovalStatus = 'Pending Finance Head';
            } else if (amount > 50000) {
                // Requires Manager
                nextApprovalStatus = 'Pending Manager';
            }

            // For demo: if not fully approved, return. Otherwise execute accounting.
            if (nextApprovalStatus !== 'Approved') {
                return tx.vendorBill.update({ where: { id: bill.id }, data: { approvalStatus: nextApprovalStatus } });
            }

            // 6. ACCOUNTING AUTOMATION (Create Journal Entry / Update Vendor Ledger)
            const updatedBill = await tx.vendorBill.update({
                where: { id: bill.id },
                data: { approvalStatus: 'Approved', status: 'Approved' }
            });

            // Credit Vendor Ledger
            await tx.vendorLedger.upsert({
                where: { vendorId: bill.vendorId },
                update: { currentBalance: { increment: Number(bill.totalAmount) } },
                create: { vendorId: bill.vendorId, currentBalance: Number(bill.totalAmount), openingBalance: 0 }
            });

            await tx.vendorTransaction.create({
                data: {
                    vendorId: bill.vendorId,
                    referenceType: 'Bill',
                    referenceId: bill.id,
                    credit: Number(bill.totalAmount),
                    runningBalance: Number(bill.totalAmount) // Simplified
                }
            });

            await tx.activityLog.create({
                data: { module: 'Accounts Payable', action: 'Approve Bill', message: `Vendor Bill ${bill.billNumber} approved and posted to ledger.`, targetId: bill.id }
            });

            return updatedBill;
        });

        if (result.error) return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        console.error("AP Approval Error:", error);
        res.status(500).json({ error: "Failed to approve bill", details: error.message });
    }
});

// Resolve Exception
router.post('/bills/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;
        const { resolutionNote } = req.body;

        const bill = await prisma.vendorBill.update({
            where: { id: parseInt(id) },
            data: { status: 'Matched', exceptionNote: resolutionNote }
        });

        res.json(bill);
    } catch (error) {
        res.status(500).json({ error: "Failed to resolve exception" });
    }
});

// Get Bills
router.get('/bills', async (req, res) => {
    try {
        const bills = await prisma.vendorBill.findMany({
            include: { vendor: true, po: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(bills);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch bills" });
    }
});

module.exports = router;
