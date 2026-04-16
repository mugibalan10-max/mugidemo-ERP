const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
require('dotenv').config();

// GET all leads
router.get("/", async (req, res) => {
    try {
        const leads = await prisma.lead.findMany({
            orderBy: { id: 'desc' }
        });
        res.json(leads);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

const automationService = require('../services/automationService');

// POST Create new lead (AI Automation Layer: Step 1)
router.post("/", async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        const newLead = await prisma.lead.create({
            data: { 
                name, 
                email, 
                phone,
                status: "New"
            }
        });

        // 🔥 Trigger ERP Brain Automation
        await automationService.runAutomation({
            type: "LEAD_CREATED",
            data: { leadId: newLead.id, name: newLead.name }
        });

        res.status(201).json({ message: "Lead Created & Automation Triggered", lead: newLead });
    } catch (err) {
        console.error("Lead Route Error:", err.message);
        res.status(500).send("Server Error");
    }
});

/**
 * PUT Update Lead Status
 * AUTOMATION: If status is 'Converted', lead is automatically added to customers.
 */
router.put("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const leadId = parseInt(req.params.id);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch current lead
            const lead = await tx.lead.findUnique({ where: { id: leadId } });
            if (!lead) throw new Error("Lead not found");

            const oldStatus = lead.status;

            // 2. Update status
            const updatedLead = await tx.lead.update({
                where: { id: leadId },
                data: { status }
            });

            // 3. Automation Logic: If status changed to 'Converted'
            if (status === 'Converted' && oldStatus !== 'Converted') {
                // Check if customer already exists (optional but good)
                await tx.customer.create({
                    data: {
                        name: lead.name,
                        email: lead.email,
                        phone: lead.phone
                    }
                });

                // Activity Log for conversion
                await tx.activityLog.create({
                    data: {
                        module: "Leads",
                        action: "Conversion",
                        targetId: leadId,
                        message: `Lead ${lead.name} converted to Customer automatically.`
                    }
                });
            } else {
                // Normal status update log
                await tx.activityLog.create({
                    data: {
                        module: "Leads",
                        action: "Status Update",
                        targetId: leadId,
                        message: `Status changed from ${oldStatus} to ${status}`
                    }
                });
            }

            return updatedLead;
        });

        res.json({ message: "Lead status updated", lead: result });
    } catch (err) {
        console.error(err.message);
        if (err.message === "Lead not found") return res.status(404).json({ error: err.message });
        res.status(500).send("Server Error");
    }
});

// GET Activity Logs (useful for verification)
router.get("/logs", async (req, res) => {
    try {
        const logs = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(logs);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;
