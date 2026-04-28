const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const LedgerEngine = require('../lib/ledgerEngine');
const procurementService = require('../services/procurementService');
const { protect } = require('../middleware/auth.middleware');

// --- VENDOR APIs ---

// Create Vendor
router.post('/vendors', async (req, res) => {
  try {
    const { vendorName, gstNumber, phone, email, address } = req.body;
    
    // Secure Vendor Code generation (prevents collisions even after deletions)
    const vendorCode = `VND-${Date.now().toString().slice(-6)}`;

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
    console.error("DEBUG: Create Vendor Error:", err);
    res.status(500).json({ 
      error: "Failed to create vendor", 
      details: err.message,
      code: err.code 
    });
  }
});

// Bulk Create Vendors
router.post('/vendors/bulk', async (req, res) => {
  try {
    const vendorsArray = req.body;
    if (!Array.isArray(vendorsArray)) return res.status(400).json({ error: "Expected an array of vendors" });

    const createdVendors = [];
    
    await prisma.$transaction(async (tx) => {
        for (let i = 0; i < vendorsArray.length; i++) {
            const v = vendorsArray[i];
            const vendorCode = `VND-BLK-${Date.now().toString().slice(-6)}-${i}`;
            const vendor = await tx.vendor.create({
                data: {
                    vendorCode,
                    vendorName: v.vendorName,
                    gstNumber: v.gstNumber,
                    phone: v.phone,
                    email: v.email,
                    address: v.address
                }
            });
            createdVendors.push(vendor);
        }
    });

    res.status(201).json({ message: `Successfully imported ${createdVendors.length} vendors`, vendors: createdVendors });
  } catch (err) {
    console.error("DEBUG: Bulk Vendor Error:", err);
    res.status(500).json({ error: "Failed to bulk import vendors", details: err.message });
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

// Delete Vendor
router.delete('/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if vendor has purchase orders (Business Guardrail)
    const poCount = await prisma.purchaseOrder.count({ where: { vendorId: parseInt(id) } });
    if (poCount > 0) {
      return res.status(400).json({ error: "Cannot delete vendor with existing Purchase Orders. Please delete POs first or archive the vendor." });
    }

    await prisma.vendor.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Vendor deleted successfully" });
  } catch (err) {
    console.error("DEBUG: Delete Vendor Error:", err);
    res.status(500).json({ error: "Failed to delete vendor", details: err.message });
  }
});

// --- PURCHASE ORDER APIs ---

// Create PO
router.post('/po', protect, async (req, res) => {
  try {
    const po = await procurementService.createPurchaseOrder({
      ...req.body,
      userId: req.user?.id
    });
    res.status(201).json(po);
  } catch (err) {
    console.error("DEBUG: PO Creation Error:", err.message);
    res.status(400).json({ error: err.message });
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
router.patch('/po/:id/request-approval', protect, async (req, res) => {
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

// Approve PO (Triggers Stock Reservation)
router.patch('/po/:id/approve', protect, async (req, res) => {
  try {
    const po = await procurementService.approvePurchaseOrder(req.params.id, req.user?.id);
    res.json(po);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Cancel PO (Releases Reservation)
router.post('/po/:id/cancel', protect, async (req, res) => {
  try {
    const po = await procurementService.cancelPurchaseOrder(req.params.id, req.user?.id);
    res.json(po);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- GRN APIs ---

// Create GRN (Goods Receipt Note)
router.post('/grn', async (req, res) => {
  try {
    const { poId, receivedDate, warehouse, receivedBy, remarks, items } = req.body;

    const grn = await prisma.$transaction(async (tx) => {
      // 1. Governance Check
      const po = await tx.purchaseOrder.findUnique({ where: { id: parseInt(poId) } });
      if (po.status !== 'Approved' && po.status !== 'Partial') {
         throw new Error("Governance Violation: Goods can only be received against APPROVED Purchase Orders.");
      }

      // 2. Create GRN
      const count = await tx.gRN.count();
      const grnNumber = `GRN-${String(count + 1).padStart(4, '0')}`;
      
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

      // 3. Update Inventory (Reservation -> Physical)
      for (const item of items) {
        await tx.product.update({
          where: { id: parseInt(item.productId) },
          data: {
            quantity: { increment: parseInt(item.receivedQty) },
            incomingStock: { decrement: parseInt(item.receivedQty) } // Release reservation
          }
        });
      }

      // 4. Update PO Status
      const allReceived = items.every(i => parseInt(i.receivedQty) >= parseInt(i.orderedQty));
      await tx.purchaseOrder.update({
        where: { id: parseInt(poId) },
        data: { status: allReceived ? 'Completed' : 'Partial' }
      });

      // 5. Finance Posting
      await LedgerEngine.createBillFromGRN(newGrn, tx);

      return newGrn;
    });

    res.status(201).json(grn);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
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
