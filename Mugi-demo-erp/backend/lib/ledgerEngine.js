const { prisma: globalPrisma } = require('./prisma');

/**
 * Enterprise Ledger Posting Engine
 * Handles SAP-style Debit/Credit logic for Vendor Payables.
 */
class LedgerEngine {
  
  /**
   * Post a transaction to a Vendor's Ledger
   * @param {Object} params - { vendorId, referenceType, referenceId, debit, credit, narration, tx }
   */
  static async postVendorTransaction({ vendorId, referenceType, referenceId, debit = 0, credit = 0, narration, tx }) {
    const prisma = tx || globalPrisma;
    
    // 1. Get or Create Ledger
    let ledger = await prisma.vendorLedger.findUnique({
      where: { vendorId: parseInt(vendorId) }
    });

    if (!ledger) {
      ledger = await prisma.vendorLedger.create({
        data: { vendorId: parseInt(vendorId), currentBalance: 0 }
      });
    }

    // 2. Calculate New Balance
    const newBalance = parseFloat(ledger.currentBalance) + parseFloat(credit) - parseFloat(debit);

    // 3. Create Transaction Entry
    const transaction = await prisma.vendorTransaction.create({
      data: {
        vendorId: parseInt(vendorId),
        referenceType,
        referenceId: referenceId ? parseInt(referenceId) : null,
        debit: parseFloat(debit),
        credit: parseFloat(credit),
        runningBalance: newBalance,
        narration
      }
    });

    // 4. Update Ledger
    await prisma.vendorLedger.update({
      where: { id: ledger.id },
      data: { currentBalance: newBalance }
    });

    return transaction;
  }

  /**
   * Auto-generate a Vendor Bill from a GRN
   * @param {Object} grn - The GRN object from Prisma
   * @param {Object} tx - Optional Prisma transaction instance
   */
  static async createBillFromGRN(grn, tx) {
    const prisma = tx || globalPrisma;

    // 1. Calculate Total from GRN PoItems
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: grn.poId },
      include: { vendor: true }
    });

    const billNumber = `BILL-${String(Date.now()).slice(-6)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Net 30 days

    const bill = await prisma.vendorBill.create({
      data: {
        billNumber,
        vendorId: po.vendorId,
        grnId: grn.id,
        totalAmount: po.totalAmount,
        balanceAmount: po.totalAmount,
        dueDate,
        status: 'Pending',
        approvalStatus: 'Pending'
      }
    });

    // 2. Post to Ledger (Credit Vendor)
    await this.postVendorTransaction({
      vendorId: po.vendorId,
      referenceType: 'Bill',
      referenceId: bill.id,
      credit: po.totalAmount,
      narration: `Bill ${billNumber} generated against GRN ${grn.grnNumber}`,
      tx: prisma
    });

    return bill;
  }
}

module.exports = LedgerEngine;
