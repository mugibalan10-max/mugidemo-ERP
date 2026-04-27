const { prisma } = require("../lib/prisma");

class ProcurementService {
  /**
   * Creates a Purchase Order with duplicate prevention and version initialization.
   */
  async createPurchaseOrder(data) {
    const { vendorId, items, expectedDate, remarks, userId } = data;

    // 1. Duplicate Prevention (Same Vendor + Same Product + Last 24 Hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const potentialDuplicate = await prisma.purchaseOrder.findFirst({
      where: {
        vendorId: parseInt(vendorId),
        createdAt: { gte: yesterday },
        items: {
          some: {
            productId: { in: items.map(i => parseInt(i.productId)) }
          }
        }
      }
    });

    if (potentialDuplicate) {
      throw new Error("Potential Duplicate PO detected for this vendor and products within the last 24 hours.");
    }

    // 2. Complex Tax Calculation (GST Breakdown)
    let totalAmount = 0;
    let totalTax = 0;

    const formattedItems = items.map(item => {
      const taxableValue = item.quantity * item.unitPrice;
      const taxTotal = (taxableValue * item.taxPercent) / 100;
      
      // Breakdown (Assumes IGST for simplicity or CGST/SGST split)
      const cgst = taxTotal / 2;
      const sgst = taxTotal / 2;
      const itemTotal = taxableValue + taxTotal;

      totalAmount += itemTotal;
      totalTax += taxTotal;

      return {
        productId: parseInt(item.productId),
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        taxableValue,
        cgst,
        sgst,
        taxPercent: parseFloat(item.taxPercent),
        total: itemTotal
      };
    });

    // 3. Auto Generate Number
    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          poNumber,
          vendorId: parseInt(vendorId),
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          totalAmount,
          taxAmount: totalTax,
          remarks,
          status: 'Draft',
          items: { create: formattedItems }
        },
        include: { items: true }
      });

      // 4. Initial Version Snapshot
      await tx.purchaseOrderVersion.create({
        data: {
          poId: po.id,
          version: 1,
          data: po,
          changedBy: userId,
          changeNote: "Initial Creation"
        }
      });

      return po;
    });
  }

  /**
   * Approves PO and RESERVES Stock (Incoming)
   */
  async approvePurchaseOrder(poId, userId) {
    return await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: parseInt(poId) },
        include: { items: true }
      });

      if (po.status !== 'Draft' && po.status !== 'Pending Approval') {
        throw new Error("PO is not in an approvable state.");
      }

      // 1. Reserve Stock (Increment incomingStock)
      for (const item of po.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { incomingStock: { increment: item.quantity } }
        });
      }

      // 2. Update Status
      return await tx.purchaseOrder.update({
        where: { id: parseInt(poId) },
        data: { status: 'Approved' }
      });
    });
  }

  /**
   * Cancels PO and RELEASES Reserved Stock
   */
  async cancelPurchaseOrder(poId, userId) {
    return await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: parseInt(poId) },
        include: { items: true }
      });

      if (po.status === 'Completed' || po.status === 'Cancelled') {
        throw new Error("Cannot cancel a completed or already cancelled PO.");
      }

      // 1. Release Reservation if it was Approved
      if (po.status === 'Approved' || po.status === 'Partial') {
        for (const item of po.items) {
          // We need to calculate how much is still pending to release only that
          // For simplicity, we fetch GRN items to see what's left
          const grnItems = await tx.gRNItem.findMany({
            where: { productId: item.productId, grn: { poId: po.id } }
          });
          const receivedQty = grnItems.reduce((acc, g) => acc + g.receivedQty, 0);
          const pendingQty = item.quantity - receivedQty;

          if (pendingQty > 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: { incomingStock: { decrement: pendingQty } }
            });
          }
        }
      }

      return await tx.purchaseOrder.update({
        where: { id: parseInt(poId) },
        data: { 
          status: 'Cancelled',
          cancelledAt: new Date()
        }
      });
    });
  }
}

module.exports = new ProcurementService();
