const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { protect, checkPermission } = require('../middleware/auth.middleware');

// Helper for Automation & Alerts
function fireLeadEvent(eventName, payload) {
  // Real-time integration mock (WebSocket / Push)
  console.log(`[CRM_EVENT: ${eventName}]`, payload);
}

// 1. LEAD CREATION (Manual, API, CSV logic)
router.post('/', protect, async (req, res) => {
  console.log("Creating lead with body:", req.body);
  try {
    const { 
      name, email, phone, company, source, status, tags, assignedTo,
      budget, requirement, priority, isDecisionMaker, isQualified 
    } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });

    // 8. DUPLICATE MANAGEMENT
    if (email || phone) {
      const existing = await prisma.lead.findFirst({
        where: { 
          OR: [ 
            email ? { email } : null, 
            phone ? { phone } : null 
          ].filter(Boolean)
        }
      });
      if (existing) {
        return res.status(409).json({ error: "Duplicate lead detected: Email or Phone already exists." });
      }
    }

    // 2. LEAD ASSIGNMENT ENGINE
    let ownerId = assignedTo ? parseInt(assignedTo) : null;
    if (!ownerId) {
      const users = await prisma.user.findMany({ 
        where: { role: { name: { equals: 'sales', mode: 'insensitive' } } },
        select: { id: true } 
      });
      if (users.length > 0) {
        ownerId = users[Math.floor(Math.random() * users.length)].id;
      }
    }

    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = [tags];
      }
    }

    // Defensive parsing for budget
    const parsedBudget = budget && !isNaN(parseFloat(budget)) ? parseFloat(budget) : null;

    const lead = await prisma.lead.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        source: source || 'Manual',
        status: status || 'New',
        budget: parsedBudget,
        requirement: requirement || null,
        priority: priority || 'Medium',
        isDecisionMaker: !!isDecisionMaker,
        isQualified: !!isQualified,
        tags: parsedTags,
        assignedTo: ownerId
      }
    });

    // 15. AUTOMATION: Auto-create activity when lead is created
    try {
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'Call',
          notes: 'Initial lead creation & auto-assigned',
          createdBy: req.user.id ? parseInt(req.user.id) : null
        }
      });
    } catch (actErr) {
      console.error("Non-fatal error creating initial activity:", actErr);
    }

    if (ownerId) fireLeadEvent('LEAD_ASSIGNED', { leadId: lead.id, ownerId });

    res.status(201).json(lead);
  } catch (err) {
    console.error("CRITICAL: Lead creation error:", err);
    res.status(500).json({ error: "Failed to create lead", details: err.message });
  }
});

// GET Leads with Role-Based Filtering
router.get('/', protect, async (req, res) => {
  try {
    const { status, source, assignedTo, search } = req.query;
    let where = {};
    
    // 16. ROLE-BASED ACCESS
    // Sales can only see their leads. Admin/Manager can see all.
    if (req.user.role?.toLowerCase() === 'sales') {
      where.assignedTo = req.user.id;
    } else if (assignedTo) {
      where.assignedTo = parseInt(assignedTo);
    }

    if (status) where.status = status;
    if (source) where.source = source;
    
    // 10. SEARCH & FILTER
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { 
        assignedUser: { select: { id: true, name: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// GET Single Lead Detail
router.get('/:id', protect, async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
        activities: { 
          orderBy: { createdAt: 'desc' },
          include: { creator: { select: { name: true } } }
        },
        notes: { orderBy: { createdAt: 'desc' } },
        contacts: true,
        customers: true,
        quotations: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!lead) return res.status(404).json({ error: "Lead not found" });
    
    // Security check for Sales
    if (req.user.role === 'Sales' && lead.assignedTo !== req.user.id) {
      return res.status(403).json({ error: "Access denied to this lead" });
    }

    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lead details" });
  }
});

// Update Lead / Pipeline Change
router.patch('/:id', protect, async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const { 
      status, assignedTo, budget, requirement, priority, 
      isDecisionMaker, isQualified, lostReason 
    } = req.body;
    
    const oldLead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!oldLead) return res.status(404).json({ error: "Lead not found" });

    // 5. LEAD QUALIFICATION LOGIC
    if (status === 'Proposal' && !oldLead.isQualified && !isQualified) {
      return res.status(400).json({ error: "Cannot move to Proposal without being Qualified" });
    }

    // 8. LOST MANAGEMENT
    if (status === 'Lost' && !lostReason) {
      return res.status(400).json({ error: "Lost reason is mandatory for Lost status" });
    }

    let dataToUpdate = {
      status,
      budget: budget ? parseFloat(budget) : undefined,
      requirement,
      priority,
      isDecisionMaker,
      isQualified,
      lostReason,
      assignedTo: assignedTo ? parseInt(assignedTo) : undefined
    };

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: dataToUpdate
    });

    // 15. AUTOMATION: Conversion on WON
    if (status === 'Won' && oldLead.status !== 'Won') {
      await convertLeadToCustomer(leadId, req.user.id);
    }

    if (status && status !== oldLead.status) {
      fireLeadEvent('STAGE_CHANGE', { leadId, oldStatus: oldLead.status, newStatus: status });
      // Log as activity
      await prisma.leadActivity.create({
        data: {
          leadId,
          type: 'Follow-up',
          notes: `Status changed from ${oldLead.status} to ${status}`,
          createdBy: req.user.id
        }
      });
    }

    res.json(lead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// 2. ACTIVITY MANAGEMENT
router.post('/:id/activities', protect, async (req, res) => {
  try {
    const { type, notes, nextFollowupDate } = req.body;
    const leadId = parseInt(req.params.id);

    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        type, // Call, WhatsApp, Email, Meeting, Follow-up
        notes,
        nextFollowupDate: nextFollowupDate ? new Date(nextFollowupDate) : null,
        createdBy: req.user.id
      }
    });

    // Update Lead's Next Follow-up Date
    if (nextFollowupDate) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { nextFollowupDate: new Date(nextFollowupDate) }
      });
    }

    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: "Failed to log activity" });
  }
});

// 7. LEAD CONVERSION LOGIC (Internal Function)
async function convertLeadToCustomer(leadId, userId) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  
  // Check for existing customer by email, phone or name to avoid unique constraint errors
  let customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { name: lead.name },
        lead.email ? { email: lead.email } : null,
        lead.phone ? { phone: lead.phone } : null
      ].filter(Boolean)
    }
  });

  if (!customer) {
    // Create Customer if not exists
    customer = await prisma.customer.create({
      data: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        companyName: lead.company,
        customerType: 'Individual',
        status: 'Active',
        leadId: lead.id
      }
    });
  } else {
    // Link existing customer to this lead if not already linked
    await prisma.customer.update({
      where: { id: customer.id },
      data: { leadId: lead.id }
    });
  }

  // Check for existing contact
  let contact = await prisma.contact.findFirst({
    where: {
      AND: [
        { name: lead.name },
        { customerId: customer.id }
      ]
    }
  });

  if (!contact) {
    // Create Contact
    contact = await prisma.contact.create({
      data: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        customerId: customer.id,
        leadId: lead.id
      }
    });
  }

  fireLeadEvent('LEAD_CONVERTED', { leadId, contactId: contact.id, customerId: customer.id });
  return { contact, customer };
}

// 9. DASHBOARD & ANALYTICS
router.get('/reports/dashboard', protect, async (req, res) => {
  try {
    // Role-based stats
    const where = req.user.role === 'Sales' ? { assignedTo: req.user.id } : {};

    const [totalLeads, wonLeads, lostLeads, stageStats, sourceStats, salesPerformance] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({ where: { ...where, status: 'Won' } }),
      prisma.lead.count({ where: { ...where, status: 'Lost' } }),
      prisma.lead.groupBy({ by: ['status'], _count: { status: true }, where }),
      prisma.lead.groupBy({ by: ['source'], _count: { source: true }, where }),
      prisma.lead.groupBy({ by: ['assignedTo'], _count: { id: true }, where: { status: 'Won' } })
    ]);

    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

    res.json({
      totalLeads,
      wonLeads,
      lostLeads,
      conversionRate: `${conversionRate}%`,
      stageStats: stageStats.map(s => ({ stage: s.status, count: s._count.status })),
      sourceStats: sourceStats.map(s => ({ source: s.source, count: s._count.source })),
      salesPerformance: salesPerformance.map(s => ({ userId: s.assignedTo, wins: s._count.id }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

module.exports = router;
