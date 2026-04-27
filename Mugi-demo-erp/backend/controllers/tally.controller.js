const tallyService = require("../services/tally.service");
const { prisma } = require("../lib/prisma");

const syncInvoiceToTally = async (req, res) => {
    try {
        const result = await tallyService.pushSalesToTally(req.body);
        res.json({ success: true, message: "Queued for Tally Sync", data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const manualSyncInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.body;
        const invoice = await prisma.invoice.findUnique({ where: { id: parseInt(invoiceId) } });
        if (!invoice) return res.status(404).json({ error: "Invoice not found" });
        const result = await tallyService.pushSalesToTally(invoice);
        res.json({ message: "Invoice added to sync queue", result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getSyncStatus = async (req, res) => {
    try {
        const { entityId } = req.params;
        const logs = await prisma.syncQueue.findMany({
            where: { entityId: entityId },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const manualRetry = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.syncQueue.update({
            where: { id: id },
            data: {
                status: "QUEUED",
                retryCount: 0,
                nextRetryAt: null
            }
        });
        res.json({ success: true, message: "Retry queued successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const testConnection = async (req, res) => {
    res.json({ success: true, message: "Tally Module Working" });
};

const getTallyStatus = async (req, res) => {
    try {
        const axios = require("axios");
        const TALLY_URL = process.env.TALLY_URL || "http://localhost:9000";
        await axios.get(TALLY_URL, { timeout: 1000 });
        res.json({ connected: true });
    } catch (err) {
        res.json({ connected: false });
    }
};

const getLedgers = async (req, res) => {
    try {
        const ledgers = await tallyService.fetchLedgers();
        res.json({ success: true, count: ledgers.length, data: ledgers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getSales = async (req, res) => {
    try {
        const sales = await tallyService.fetchVouchers("Sales");
        res.json({ success: true, count: sales.length, data: sales });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getPurchase = async (req, res) => {
    try {
        const purchase = await tallyService.fetchVouchers("Purchase");
        res.json({ success: true, count: purchase.length, data: purchase });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getProfitLoss = async (req, res) => {
    try {
        const pl = await tallyService.fetchProfitLoss();
        res.json({ success: true, data: pl });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getStock = async (req, res) => {
    try {
        const stock = await tallyService.fetchStockSummary();
        res.json({ success: true, count: stock.length, data: stock });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getDashboardSummary = async (req, res) => {
    try {
        const analytics = await tallyService.getDashboardAnalytics();
        res.json({
            success: true,
            data: {
                totalSales: analytics.totalSales,
                totalPurchase: analytics.totalPurchase,
                totalProfit: analytics.totalProfit,
                cashBalance: analytics.cashBalance,
                stockValue: analytics.stockValue,
                recentTransactions: analytics.recentTransactions,
                lowStock: analytics.lowStock,
                gstSummary: analytics.gstSummary,
                tallyStatus: "Connected"
            }
        });
    } catch (err) {
        res.json({
            success: false,
            error: err.message,
            data: {
                totalSales: 0,
                totalPurchase: 0,
                totalProfit: 0,
                cashBalance: 0,
                stockValue: 0,
                recentTransactions: [],
                lowStock: [],
                gstSummary: { collected: 0, paid: 0, net: 0 },
                tallyStatus: "Disconnected"
            }
        });
    }
};

const getSyncQueue = async (req, res) => {
    try {
        const queue = await prisma.syncQueue.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json({ success: true, data: queue });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    testConnection,
    syncInvoiceToTally,
    manualSyncInvoice,
    getTallyStatus,
    getLedgers,
    getSales,
    getPurchase,
    getProfitLoss,
    getStock,
    getDashboardSummary,
    getSyncStatus,
    getSyncQueue,
    manualRetry
};

