const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/prisma");

// Helper to get date range
const getDateFilter = (range, customFrom, customTo) => {
    const now = new Date();
    let fromDate, toDate = new Date();
    
    switch (range) {
        case 'today':
            fromDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case 'month':
            fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            fromDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'custom':
            fromDate = customFrom ? new Date(customFrom) : new Date(0);
            toDate = customTo ? new Date(customTo) : new Date();
            break;
        default:
            // default to all time if not specified
            fromDate = new Date(0); 
    }
    return { fromDate, toDate };
};

// Main Dashboard Summary
router.get("/summary", async (req, res) => {
    try {
        const { date_filter = 'all', from_date, to_date, branch_id } = req.query;
        const { fromDate, toDate } = getDateFilter(date_filter, from_date, to_date);
        
        const dateQuery = { gte: fromDate, lte: toDate };

        // SALES
        const salesData = await prisma.invoice.aggregate({
            where: { createdAt: dateQuery },
            _sum: { total: true, amountPaid: true },
            _count: { _all: true }
        });
        const totalSales = salesData._sum.total || 0;
        const paidSales = salesData._sum.amountPaid || 0;
        const unpaidSales = totalSales - paidSales;

        // PURCHASES
        const purchaseData = await prisma.vendorBill.aggregate({
            where: { createdAt: dateQuery },
            _sum: { totalAmount: true, paidAmount: true, balanceAmount: true },
            _count: { _all: true }
        });
        const totalPurchases = purchaseData._sum.totalAmount || 0;

        // INVENTORY
        const products = await prisma.product.findMany();
        const totalStockValue = products.reduce((sum, p) => sum + (p.quantity * parseFloat(p.price || 0)), 0);
        const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;
        const outOfStockItems = products.filter(p => p.quantity <= 0).length;

        // FINANCE (Expenses = vendor bills + payroll)
        const payrollData = await prisma.payroll.aggregate({
            where: { createdAt: dateQuery, status: 'Paid' },
            _sum: { netSalary: true }
        });
        const totalPayroll = payrollData._sum.netSalary || 0;
        const totalExpenses = Number(purchaseData._sum.totalAmount || 0) + Number(totalPayroll);
        const profitLoss = Number(totalSales) - Number(totalExpenses);

        res.json({
            sales: {
                totalAmount: Number(totalSales),
                invoiceCount: salesData._count._all,
                paidAmount: Number(paidSales),
                pendingReceivables: Number(unpaidSales)
            },
            purchases: {
                totalAmount: Number(totalPurchases),
                billCount: purchaseData._count._all,
                pendingPayables: Number(purchaseData._sum.balanceAmount || 0)
            },
            inventory: {
                totalStockValue: Number(totalStockValue),
                lowStockItems,
                outOfStockItems
            },
            finance: {
                totalExpenses: Number(totalExpenses),
                profitLoss: Number(profitLoss),
                cashAndBank: Number(paidSales) - (Number(purchaseData._sum.paidAmount || 0) + Number(totalPayroll))
            }
        });
    } catch (err) {
        console.error("Summary error:", err);
        res.status(500).json({ error: "Failed to fetch summary" });
    }
});

// Sales Chart Data
router.get("/sales-chart", async (req, res) => {
    try {
        // Group by month for current year
        const year = new Date().getFullYear();
        const startDate = new Date(year, 0, 1);
        
        const invoices = await prisma.invoice.findMany({
            where: { createdAt: { gte: startDate } },
            select: { total: true, createdAt: true }
        });
        
        const bills = await prisma.vendorBill.findMany({
            where: { createdAt: { gte: startDate } },
            select: { totalAmount: true, createdAt: true }
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartData = months.map(m => ({ name: m, Sales: 0, Purchases: 0 }));

        invoices.forEach(inv => {
            const mIndex = new Date(inv.createdAt).getMonth();
            chartData[mIndex].Sales += Number(inv.total);
        });

        bills.forEach(bill => {
            const mIndex = new Date(bill.createdAt).getMonth();
            chartData[mIndex].Purchases += Number(bill.totalAmount);
        });

        res.json(chartData);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch chart data" });
    }
});

// Top Products
router.get("/top-products", async (req, res) => {
    try {
        const { date_filter = 'all', from_date, to_date } = req.query;
        const { fromDate, toDate } = getDateFilter(date_filter, from_date, to_date);
        
        // Find top selling products by quantity in invoices
        const items = await prisma.invoiceItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true, total: true },
            where: { invoice: { createdAt: { gte: fromDate, lte: toDate } } },
            orderBy: { _sum: { total: 'desc' } },
            take: 5
        });

        const result = [];
        for (const item of items) {
            const p = await prisma.product.findUnique({ where: { id: item.productId } });
            if (p) {
                result.push({
                    name: p.productName,
                    salesValue: item._sum.total,
                    quantity: item._sum.quantity
                });
            }
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch top products" });
    }
});

// Alerts
router.get("/alerts", async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { quantity: { lte: prisma.product.fields.minStock } },
            take: 5
        });
        
        const overdueInvoices = await prisma.invoice.findMany({
            where: { dueDate: { lt: new Date() }, status: { notIn: ['Paid', 'Void'] } },
            take: 5
        });

        const alerts = [];
        products.forEach(p => alerts.push({ id: `p_${p.id}`, type: 'warning', message: `Low Stock: ${p.productName} (${p.quantity} left)` }));
        overdueInvoices.forEach(inv => alerts.push({ id: `i_${inv.id}`, type: 'danger', message: `Overdue Invoice: ${inv.invoiceNo} (₹${inv.total})` }));

        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch alerts" });
    }
});

module.exports = router;
