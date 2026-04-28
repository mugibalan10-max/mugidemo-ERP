const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// Helper for Automation & Alerts
function fireLeadEvent(eventName, payload) {
  // Real-time integration mock (WebSocket / Push)
  console.log(`[CRM_EVENT: ${eventName}]`, payload);
}

// 1. LEAD CREATION (Manual, API, CSV logic wrapped here)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, source, status, tags, assignedTo } = req.body;

    // 8. DUPLICATE MANAGEMENT
    if (email || phone) {
      const existing = await prisma.lead.findFirst({
        where: { OR: [ { email: email || '' }, { phone: phone || '' } ] }
      });
      if (existing) {
        return res.status(409).json({ error: "Duplicate lead detected", leadId: existing.id });
      }
    }

    // 2. LEAD ASSIGNMENT ENGINE (Mocking auto-assignment round-robin if assignedTo is null)
    let ownerId = assignedTo;
    if (!ownerId) {
      // Very simple Round-Robin simulation for load balancing
      const employees = await prisma.employee.findMany({ select: { id: true } });
      if (employees.length > 0) {
        ownerId = employees[Math.floor(Math.random() * employees.length)].id;
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

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        company,
        source: source || 'Manual',
        status: status || 'New',
        tags: parsedTags,
        assignedTo: ownerId ? parseInt(ownerId) : null
      }
    });

    // 7. AUTOMATION ENGINE (Triggers on lead creation)
    if (ownerId) fireLeadEvent('LEAD_ASSIGNED', { leadId: lead.id, ownerId });

    res.status(201).json(lead);
  } catch (err) {
    console.error("Lead creation error:", err);
    res.status(500).json({ error: "Failed to create lead", details: err.message || err.toString() });
  }
});

// BULK LEAD CREATION (For CSV / Array imports)
router.post('/bulk', async (req, res) => {
  try {
    const leadsData = Array.isArray(req.body) ? req.body : [req.body];
    const results = { successful: 0, failed: 0, errors: [] };
    
    // Fetch active employees for round-robin assignment
    const employees = await prisma.employee.findMany({ select: { id: true } });

    for (const lead of leadsData) {
      try {
        if (!lead.name) throw new Error("Name is required");

        // Duplicate Check
        if (lead.email || lead.phone) {
          const existing = await prisma.lead.findFirst({
            where: { OR: [ { email: lead.email || '' }, { phone: lead.phone || '' } ] }
          });
          if (existing) {
            results.failed++;
            results.errors.push(`Duplicate skipped: ${lead.email || lead.phone}`);
            continue;
          }
        }

        // Round Robin Assignment
        let ownerId = lead.assignedTo;
        if (!ownerId && employees.length > 0) {
          ownerId = employees[Math.floor(Math.random() * employees.length)].id;
        }

        // Tags parsing
        let parsedTags = [];
        if (lead.tags) {
          try {
            parsedTags = typeof lead.tags === 'string' ? JSON.parse(lead.tags) : lead.tags;
          } catch (e) {
            parsedTags = [lead.tags];
          }
        }

        await prisma.lead.create({
          data: {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            source: lead.source || 'Manual',
            status: lead.status || 'New',
            tags: parsedTags,
            assignedTo: ownerId ? parseInt(ownerId) : null
          }
        });
        results.successful++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Failed for ${lead.name || 'Unknown'}: ${err.message}`);
      }
    }

    res.status(201).json({ message: "Bulk import completed", results });
  } catch (err) {
    console.error("Bulk Import Error:", err);
    res.status(500).json({ error: "Failed to process bulk import" });
  }
});

// GET Leads with 10. REPORTS & DASHBOARD pipeline support
router.get('/', async (req, res) => {
  try {
    const { status, source, assignedTo } = req.query;
    let where = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (assignedTo) where.assignedTo = parseInt(assignedTo);

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { activities: true }
    });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// Update Lead / 3. LEAD PIPELINE (Drag and Drop Status Change)
router.patch('/:id', async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const { status, assignedTo, scoreDelta } = req.body;
    
    let dataToUpdate = {};
    const oldLead = await prisma.lead.findUnique({ where: { id: leadId } });

    if (status) dataToUpdate.status = status;
    if (assignedTo) dataToUpdate.assignedTo = parseInt(assignedTo);
    if (scoreDelta) dataToUpdate.score = { increment: parseInt(scoreDelta) };

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: dataToUpdate
    });

    // 7. AUTOMATION ENGINE: On stage change notify manager
    if (status && status !== oldLead.status) {
      fireLeadEvent('STAGE_CHANGE', { leadId, oldStatus: oldLead.status, newStatus: status });
    }

    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// 4. ACTIVITY MANAGEMENT (Log calls, emails, meetings)
router.post('/:id/activities', async (req, res) => {
  try {
    const { type, description, scheduledAt, completed } = req.body;
    const leadId = parseInt(req.params.id);

    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        type, // 'Call', 'Email', 'Meeting'
        description,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        completed: completed === true
      }
    });

    // 5. LEAD SCORING SYSTEM: Auto score calculation
    let scoreBoost = 0;
    if (type === 'Email') scoreBoost = 2;
    if (type === 'Call') scoreBoost = 5;
    if (type === 'Meeting') scoreBoost = 10;
    
    if (scoreBoost > 0) {
      await prisma.lead.update({ where: { id: leadId }, data: { score: { increment: scoreBoost } }});
    }

    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: "Failed to log activity" });
  }
});

// 13. NOTES & ATTACHMENTS
router.post('/:id/notes', async (req, res) => {
  try {
    const { content, createdBy } = req.body;
    const note = await prisma.leadNote.create({
      data: {
        leadId: parseInt(req.params.id),
        content,
        createdBy: createdBy ? parseInt(createdBy) : null
      }
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: "Failed to add note" });
  }
});

// 6. LEAD CONVERSION (Convert -> Opportunity/Customer)
router.post('/:id/convert', async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const { expectedValue, closeDate } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    // 1. Create Customer Account
    const customer = await prisma.customer.create({
      data: {
        name: lead.company || lead.name,
        email: lead.email,
        phone: lead.phone
      }
    });

    // 2. Auto create Opportunity (Deal)
    const opportunity = await prisma.opportunity.create({
      data: {
        leadId,
        customerId: customer.id,
        value: parseFloat(expectedValue || 0),
        stage: 'Proposal Sent',
        expectedCloseDate: closeDate ? new Date(closeDate) : null
      }
    });

    // 3. Mark Lead as Won/Converted
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'Qualified' }
    });

    fireLeadEvent('LEAD_CONVERTED', { leadId, opportunityId: opportunity.id, customerId: customer.id });

    res.status(201).json({ customer, opportunity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to convert lead" });
  }
});

// 10. REPORTS & DASHBOARD
router.get('/reports/dashboard', async (req, res) => {
  try {
    const [totalLeads, wonLeads, sourceStats] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'Won' } }),
      prisma.lead.groupBy({ by: ['source'], _count: { source: true } })
    ]);

    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(2) : 0;

    res.json({
      totalLeads,
      wonLeads,
      conversionRate: `${conversionRate}%`,
      leadsBySource: sourceStats.map(s => ({ source: s.source, count: s._count.source }))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate report" });
  }
});

module.exports = router;
