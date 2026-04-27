const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/prisma");

router.get("/stats", async (req, res) => {
    try {
        // 1. Core KPIs
        const salesData = await prisma.invoice.aggregate({ _sum: { total: true } });
        const poCount = await prisma.purchaseOrder.count();
        const vendorPayablesData = await prisma.vendorBill.aggregate({ _sum: { balanceAmount: true } });
        const customerCount = await prisma.customer.count();
        
        const products = await prisma.product.findMany();
        const stockValuation = products.reduce((sum, p) => sum + (p.quantity * parseFloat(p.price || 0)), 0);

        // 2. Tally Specific Stats
        const tallySynced = await prisma.syncQueue.count({ where: { status: 'SUCCESS' } });
        const tallyPending = await prisma.syncQueue.count({ where: { status: 'QUEUED' } });

        // 3. Approval Queue
        const [pendingPOs, pendingBills, pendingTasks] = await Promise.all([
            prisma.purchaseOrder.findMany({ 
                where: { status: 'Draft' }, 
                include: { vendor: true },
                take: 3 
            }),
            prisma.vendorBill.findMany({ 
                where: { approvalStatus: 'Pending' }, 
                include: { vendor: true },
                take: 3 
            }),
            prisma.task.findMany({ 
                where: { approvalStatus: 'Pending' }, 
                include: { assignee: true },
                take: 3 
            })
        ]);

        const approvalQueue = [
            ...pendingPOs.map(po => ({
                id: po.id,
                type: 'PO Approval',
                ref: po.poNumber,
                amount: `₹${parseFloat(po.totalAmount).toLocaleString()}`,
                user: po.vendor.vendorName,
                link: '/purchase-view'
            })),
            ...pendingBills.map(bill => ({
                id: bill.id,
                type: 'Bill Approval',
                ref: bill.billNumber,
                amount: `₹${parseFloat(bill.totalAmount).toLocaleString()}`,
                user: bill.vendor.vendorName,
                link: '/vendor-bills'
            })),
            ...pendingTasks.map(task => ({
                id: task.id,
                type: 'Task Approval',
                ref: task.taskCode,
                amount: `${task.completionPercent}%`,
                user: task.assignee?.name || 'Unassigned',
                link: '/tasks'
            }))
        ].slice(0, 5); 

        // 4. Activity Logs
        let logs = [];
        try {
            const syncLogs = await prisma.syncQueue.findMany({
                take: 6,
                orderBy: { createdAt: 'desc' }
            });
            logs = syncLogs.map(s => ({
                id: s.id,
                message: `${s.entityType.toUpperCase()} ${s.entityId} sync ${s.status}`,
                action: s.status,
                module: 'Tally',
                createdAt: s.createdAt
            }));
        } catch (logErr) {
            console.warn("Log fetch failed");
        }

        res.json({
            totalInvoiced: salesData._sum.total || 0,
            purchaseOrders: poCount,
            stockValuation: stockValuation,
            vendorPayables: vendorPayablesData._sum.balanceAmount || 0,
            totalCustomers: customerCount,
            tallySynced: tallySynced,
            tallyPending: tallyPending,
            approvalQueue,
            logs,
            pendingCount: approvalQueue.length
        });
    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
});

module.exports = router;
