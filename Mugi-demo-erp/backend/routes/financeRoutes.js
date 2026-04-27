const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const LedgerEngine = require('../lib/ledgerEngine');

// --- VENDOR BILLS ---

// List Pending Bills
router.get('/bills', async (req, res) => {
  try {
    const bills = await prisma.vendorBill.findMany({
      include: { vendor: true },
      orderBy: { dueDate: 'asc' }
    });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bills" });
  }
});

// Approve Bill
router.patch('/bills/:id/approve', async (req, res) => {
  try {
    const bill = await prisma.vendorBill.update({
      where: { id: parseInt(req.params.id) },
      data: { approvalStatus: 'Approved' }
    });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: "Failed to approve bill" });
  }
});

// --- VENDOR PAYMENTS ---

// Process Payment
router.post('/payments', async (req, res) => {
  try {
    const { vendorId, billId, amount, paymentMode, transactionRef, remarks } = req.body;

    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create Payment Record
      const newPayment = await tx.vendorPayment.create({
        data: {
          vendorId: parseInt(vendorId),
          billId: billId ? parseInt(billId) : null,
          amount: parseFloat(amount),
          paymentMode,
          transactionRef,
          remarks
        }
      });

      // 2. Update Bill Balance
      if (billId) {
        const bill = await tx.vendorBill.findUnique({ where: { id: parseInt(billId) } });
        const newPaidAmount = parseFloat(bill.paidAmount) + parseFloat(amount);
        const newBalance = parseFloat(bill.totalAmount) - newPaidAmount;

        await tx.vendorBill.update({
          where: { id: bill.id },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalance,
            status: newBalance <= 0 ? 'Paid' : 'Partially Paid'
          }
        });
      }

      // 3. Post to Ledger (Debit Vendor / Decrease Liability)
      await LedgerEngine.postVendorTransaction({
        vendorId: parseInt(vendorId),
        referenceType: 'Payment',
        referenceId: newPayment.id,
        debit: parseFloat(amount),
        narration: `Payment via ${paymentMode}${transactionRef ? ' - Ref: '+transactionRef : ''}`
      });

      return newPayment;
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process payment" });
  }
});

// List Payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.vendorPayment.findMany({
      include: { vendor: true, bill: true },
      orderBy: { paymentDate: 'desc' }
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// --- VENDOR LEDGER ---

// Get Vendor Statement
router.get('/ledger/:vendorId', async (req, res) => {
  try {
    const vendorId = parseInt(req.params.vendorId);
    
    const [ledger, transactions] = await Promise.all([
      prisma.vendorLedger.findUnique({ where: { vendorId } }),
      prisma.vendorTransaction.findMany({
        where: { vendorId },
        orderBy: { transactionDate: 'desc' },
        take: 50
      })
    ]);

    res.json({ ledger, transactions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ledger statement" });
  }
});

// --- AGING REPORT ---
router.get('/reports/aging', async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        bills: { where: { status: { not: 'Paid' } } },
        ledger: true
      }
    });

    const agingData = vendors.map(v => {
      const totalOutstanding = v.bills.reduce((sum, b) => sum + parseFloat(b.balanceAmount), 0);
      return {
        vendorName: v.vendorName,
        vendorCode: v.vendorCode,
        currentBalance: v.ledger?.currentBalance || 0,
        outstandingBills: v.bills.length,
        totalOutstanding
      };
    });

    res.json(agingData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch aging report" });
  }
});

const tallyService = require('../services/tally.service');

// --- RECONCILIATION ---
router.get('/reconcile/customers', async (req, res) => {
  try {
    // 1. Get ERP Balances
    const customers = await prisma.customer.findMany({
      include: {
        invoices: { select: { total: true } },
        payments: { select: { amount: true } }
      }
    });

    const erpBalances = customers.map(c => {
      const totalInvoiced = c.invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
      const totalPaid = c.payments.reduce((sum, pay) => sum + parseFloat(pay.amount), 0);
      return {
        id: c.id,
        name: c.name,
        erpBalance: totalInvoiced - totalPaid
      };
    });

    // 2. Get Tally Balances
    let tallyBalances = [];
    try {
        tallyBalances = await tallyService.fetchLedgerBalances();
    } catch (tallyErr) {
        console.warn("Tally Offline during reconciliation");
        return res.status(503).json({ 
            error: "Tally Prime is offline. Reconciliation unavailable.",
            erpData: erpBalances
        });
    }

    // 3. Compare and Flag Mismatches
    const report = erpBalances.map(erp => {
      const tallyMatch = tallyBalances.find(t => t.name === erp.name);
      const tallyBal = tallyMatch ? tallyMatch.tallyBalance : 0;
      const difference = Math.abs(erp.erpBalance - tallyBal);
      
      return {
        ...erp,
        tallyBalance: tallyBal,
        difference: difference,
        status: difference < 1 ? 'MATCHED' : 'MISMATCH',
        recommendation: difference < 1 ? 'None' : 'Sync pending invoices or payments'
      };
    });

    res.json({
        reconciledAt: new Date(),
        summary: {
            totalChecked: report.length,
            mismatches: report.filter(r => r.status === 'MISMATCH').length,
            matched: report.filter(r => r.status === 'MATCHED').length
        },
        data: report
    });

  } catch (err) {
    console.error("Reconciliation Error:", err.message);
    res.status(500).json({ error: "Failed to generate reconciliation report" });
  }
});

module.exports = router;
