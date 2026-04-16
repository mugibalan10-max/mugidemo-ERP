const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/prisma");

router.get("/stats", async (req, res) => {
    try {
        const customerCount = await prisma.customer.count();
        const leadCount = await prisma.lead.count();
        const convertedLeads = await prisma.lead.count({ where: { status: 'Converted' } });
        const salesData = await prisma.invoice.aggregate({ _sum: { total: true } });
        const unpaidInvoices = await prisma.invoice.count({ where: { status: 'Unpaid' } });
        const outstandingData = await prisma.invoice.aggregate({ where: { status: 'Unpaid' }, _sum: { total: true } });
        const products = await prisma.product.findMany();
        const lowStockProducts = products.filter(p => p.quantity < p.minStock);
        const tallySynced = await prisma.syncQueue.count({ where: { status: 'Success' } });
        const tallyPending = await prisma.syncQueue.count({ where: { status: 'Pending Retry' } });
        
        res.json({
            totalCustomers: customerCount,
            totalLeads: leadCount,
            convertedLeads: convertedLeads,
            totalSales: salesData._sum.total || 0,
            unpaidInvoices,
            totalOutstanding: outstandingData._sum.total || 0,
            inventoryAlerts: lowStockProducts.length,
            lowStockItems: lowStockProducts.slice(0, 5),
            tallySynced,
            tallyPending,
            conversionRate: leadCount > 0 ? ((convertedLeads / leadCount) * 100).toFixed(1) + "%" : "0%"
        });
    } catch (err) {
        res.status(500).send("Stats Error");
    }
});

module.exports = router;
