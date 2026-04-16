const tallyService = require("../services/tally.service");
const { prisma } = require("../lib/prisma");

const syncInvoiceToTally = async (req, res) => {
    try {
        const result = await tallyService.pushSalesToTally(req.body);
        await prisma.tallySyncLog.create({
            data: {
                module: 'invoice',
                referenceId: String(req.body.number || req.body.invoiceNo || 'Unknown'),
                status: 'success',
                // Tally usually returns a string response in XML format
                response: typeof result === 'string' ? result : JSON.stringify(result)
            }
        });
        res.json({ success: true, message: "Synced to Tally", data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const manualSyncInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.body;
        const invoice = await prisma.invoice.findUnique({ where: { id: parseInt(invoiceId) } });
        if (!invoice) return res.status(404).json({ error: "Invoice not found" });
        const tallyResponse = await tallyService.pushSalesToTally(invoice);
        await tallyService.updateSyncStatus(invoiceId, "Invoice", "Success");
        res.json({ message: "Manual sync successful", tallyResponse });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
    getDashboardSummary
};

