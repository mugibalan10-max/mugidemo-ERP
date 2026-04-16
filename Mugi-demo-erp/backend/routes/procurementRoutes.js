const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const LedgerEngine = require('../lib/ledgerEngine');

// --- VENDOR APIs ---

// Create Vendor
router.post('/vendors', async (req, res) => {
  try {
    const { vendorName, gstNumber, phone, email, address } = req.body;
    
    // Auto generate Vendor Code
    const count = await prisma.vendor.count();
    const vendorCode = `VND-${String(count + 1).padStart(3, '0')}`;

    const vendor = await prisma.vendor.create({
      data: {
        vendorCode,
        vendorName,
        gstNumber,
        phone,
        email,
        address
      }
    });
    res.status(201).json(vendor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create vendor" });
  }
});

// List Vendors
router.get('/vendors', async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// --- PURCHASE ORDER APIs ---

// Create PO
router.post('/po', async (req, res) => {
  try {
    const { vendorId, items, expectedDate, remarks } = req.body;
    // items: [{ productId, quantity, unitPrice, taxPercent }]

    // Auto generate PO number
    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let totalAmount = 0;
    let totalTax = 0;

    const formattedItems = items.map(item => {
      const subtotal = item.quantity * item.unitPrice;
      const tax = (subtotal * item.taxPercent) / 100;
      const total = subtotal + tax;
      
      totalAmount += total;
      totalTax += tax;

      return {
        productId: parseInt(item.productId),
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        taxPercent: parseFloat(item.taxPercent),
        total: total
      };
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId: parseInt(vendorId),
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        totalAmount,
        taxAmount: totalTax,
        remarks,
        status: 'Draft',
        items: {
          create: formattedItems
        }
      },
      include: { items: true }
    });

    res.status(201).json(po);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create Purchase Order" });
  }
});

// List POs
router.get('/po', async (req, res) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: { vendor: true, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch POs" });
  }
});

// PO Details
router.get('/po/:id', async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { 
        vendor: true, 
        items: { include: { product: true } }
      }
    });
    res.json(po);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch PO details" });
  }
});

// Request Approval for PO
router.patch('/po/:id/request-approval', async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'Pending Approval' }
    });
    res.json(po);
  } catch (err) {
    res.status(500).json({ error: "Failed to request approval" });
  }
});

// Approve PO
router.patch('/po/:id/approve', async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'Approved' }
    });
    res.json(po);
  } catch (err) {
    res.status(500).json({ error: "Failed to approve PO" });
  }
});

// --- GRN APIs ---

// Create GRN (Goods Receipt Note)
router.post('/grn', async (req, res) => {
  try {
    const { poId, receivedDate, warehouse, receivedBy, remarks, items } = req.body;
    // items: [{ productId, orderedQty, receivedQty, damagedQty }]

    // Auto generate GRN number
    const count = await prisma.gRN.count();
    const grnNumber = `GRN-${String(count + 1).padStart(4, '0')}`;

    // --- GOVERNANCE CHECK ---
    const po = await prisma.purchaseOrder.findUnique({ where: { id: parseInt(poId) } });
    if (po.status !== 'Approved' && po.status !== 'Partially Received') {
       return res.status(403).json({ error: "Governance Violation: Goods can only be received against APPROVED Purchase Orders." });
    }

    const grn = await prisma.$transaction(async (tx) => {
      // 1. Create GRN
      const newGrn = await tx.gRN.create({
        data: {
          grnNumber,
          poId: parseInt(poId),
          receivedDate: new Date(receivedDate),
          warehouse,
          receivedBy,
          remarks,
          items: {
            create: items.map(item => ({
              productId: parseInt(item.productId),
              orderedQty: parseInt(item.orderedQty),
              receivedQty: parseInt(item.receivedQty),
              damagedQty: parseInt(item.damagedQty || 0),
              pendingQty: parseInt(item.orderedQty) - parseInt(item.receivedQty)
            }))
          }
        }
      });

      // 2. Update Inventory Stock
      for (const item of items) {
        await tx.product.update({
          where: { id: parseInt(item.productId) },
          data: {
            quantity: { increment: parseInt(item.receivedQty) }
          }
        });
      }

      // 3. Update PO Status
      const allReceived = items.every(i => parseInt(i.receivedQty) >= parseInt(i.orderedQty));
      await tx.purchaseOrder.update({
        where: { id: parseInt(poId) },
        data: {
          status: allReceived ? 'Completed' : 'Partially Received'
        }
      });

      // 4. Log Activity
      await tx.activityLog.create({
        data: {
          module: 'Procurement',
          action: 'GRN_RECEIVED',
          message: `Received ${grnNumber} for PO ${poId}`,
          targetId: newGrn.id
        }
      });

      // 5. AUTO FINANCE POSTING: Create Bill & Update Ledger
      await LedgerEngine.createBillFromGRN(newGrn);

      return newGrn;
    });

    res.status(201).json(grn);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to receive goods (GRN)" });
  }
});

// List GRNs
router.get('/grn', async (req, res) => {
  try {
    const grns = await prisma.gRN.findMany({
      include: { po: { include: { vendor: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(grns);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch GRNs" });
  }
});

module.exports = router;
