const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { protect } = require('../middleware/auth.middleware');

// Create Quotation
router.post('/', protect, async (req, res) => {
  try {
    const { leadId, customerId, items, totalAmount, validUntil } = req.body;
    
    const quotation = await prisma.quotation.create({
      data: {
        quotationNo: `QTN-${Date.now()}`,
        leadId: leadId ? parseInt(leadId) : null,
        customerId: customerId ? parseInt(customerId) : null,
        totalAmount: parseFloat(totalAmount),
        validUntil: validUntil ? new Date(validUntil) : null,
        status: 'Draft',
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            total: parseFloat(item.quantity) * parseFloat(item.unitPrice)
          }))
        }
      },
      include: { items: true }
    });

    // If linked to a lead, log activity
    if (leadId) {
      await prisma.leadActivity.create({
        data: {
          leadId: parseInt(leadId),
          type: 'Follow-up',
          notes: `Quotation ${quotation.quotationNo} generated.`,
          createdBy: req.user.id
        }
      });
    }

    res.status(201).json(quotation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create quotation" });
  }
});

// Get Quotations
router.get('/', protect, async (req, res) => {
  try {
    const { leadId, customerId } = req.query;
    let where = {};
    if (leadId) where.leadId = parseInt(leadId);
    if (customerId) where.customerId = parseInt(customerId);

    const quotations = await prisma.quotation.findMany({
      where,
      include: { items: true, lead: true, customer: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch quotations" });
  }
});

// Update Quotation Status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const qid = parseInt(req.params.id);

    const quotation = await prisma.quotation.update({
      where: { id: qid },
      data: { status }
    });

    // If approved and linked to lead, maybe move lead to Negotiation?
    if (status === 'Approved' && quotation.leadId) {
      await prisma.lead.update({
        where: { id: quotation.leadId },
        data: { status: 'Negotiation' }
      });
    }

    res.json(quotation);
  } catch (err) {
    res.status(500).json({ error: "Failed to update quotation" });
  }
});

module.exports = router;
