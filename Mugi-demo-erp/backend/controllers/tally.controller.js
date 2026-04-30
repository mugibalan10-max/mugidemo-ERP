const { prisma } = require("../lib/prisma");
const tallyService = require("../services/tally.service");
const axios = require("axios");

const testConnection = async (req, res) => {
    res.json({ success: true, message: "Tally Module Working" });
};

const getTallyStatus = async (req, res) => {
    const ports = [9999, 9000];
    let connected = false;
    let error = null;

    for (const port of ports) {
        try {
            const url = `http://127.0.0.1:${port}`;
            console.log(`🔍 Probing Tally at ${url}...`);
            const xmlCheck = `<?xml version="1.0" encoding="utf-8"?><ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export Data</TALLYREQUEST><TYPE>Data</TYPE><ID>Company</ID></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></DESC></BODY></ENVELOPE>`;
            
            await axios.post(url, xmlCheck, { 
                headers: { 'Content-Type': 'text/xml' },
                timeout: 2000 
            });
            connected = true;
            console.log(`✅ Tally found on port ${port}`);
            break;
        } catch (err) {
            error = err.message;
            console.log(`❌ Port ${port} failed: ${err.message}`);
        }
    }

    res.json({ connected, error });
};

const syncInvoiceToTally = async (req, res) => {
    try {
        const { invoice } = req.body;
        const result = await tallyService.pushSalesToTally(invoice);
        res.json({ message: "Invoice added to sync queue", result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getLedgers = async (req, res) => {
    try {
        const ledgers = await prisma.syncQueue.findMany({ where: { entityType: 'ledger', status: 'SUCCESS' } });
        res.json({ success: true, data: ledgers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getSales = async (req, res) => {
    try {
        const sales = await prisma.syncQueue.findMany({ where: { entityType: 'invoice', status: 'SUCCESS' } });
        res.json({ success: true, data: sales });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getPurchase = async (req, res) => {
    try {
        res.json({ success: true, data: [] }); // Placeholder for purchase sync
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getProfitLoss = async (req, res) => {
    try {
        res.json({ success: true, data: {} }); // Placeholder for P&L
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getStock = async (req, res) => {
    try {
        const stock = await prisma.syncQueue.findMany({ where: { entityType: 'stock', status: 'SUCCESS' } });
        res.json({ success: true, data: stock });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getDashboardSummary = async (req, res) => {
    try {
        const stats = await prisma.syncQueue.groupBy({
            by: ['status'],
            _count: { id: true }
        });
        res.json({ success: true, data: stats });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
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

const getSyncQueue = async (req, res) => {
    try {
        const queue = await prisma.syncQueue.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 50
        });
        res.json({ success: true, data: queue });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const bulkRetry = async (req, res) => {
    try {
        console.log("📥 [API] Bulk Retry Request received");
        
        const { count } = await prisma.syncQueue.updateMany({
            where: { 
                status: { in: ["FAILED", "RETRY", "QUEUED", "PROCESSING"] } 
            },
            data: { 
                status: "QUEUED", 
                retryCount: 0,
                nextRetryAt: null,
                lastError: null
            }
        });

        console.log(`✅ [API] Reset ${count} items. Triggering background sync...`);

        const { processQueue } = require("../services/tally.queue.processor");
        setTimeout(() => {
            processQueue().catch(e => console.error("❌ Background Process Error:", e.message));
        }, 100);

        return res.json({ 
            success: true, 
            message: `Successfully reset ${count} items. Syncing has started in the background.`,
            count
        });
    } catch (err) {
        console.error("❌ [API] Bulk Retry Critical Failure:", err.message);
        return res.status(500).json({ success: false, error: "Internal Server Error: " + err.message });
    }
};

const manualRetry = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.syncQueue.update({
            where: { id: parseInt(id) },
            data: { status: "QUEUED", retryCount: 0, nextRetryAt: null }
        });
        
        const { processQueue } = require("../services/tally.queue.processor");
        processQueue();

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const manualSyncInvoice = async (req, res) => {
    // Legacy support or manual override
    res.json({ success: true, message: "Manual sync triggered" });
};

const syncTallyCustomers = async (req, res) => {
    try {
        const { importCustomersFromTally } = require("../services/tally.import.service");
        const result = await importCustomersFromTally();
        res.json(result);
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

const retryFailedSyncs = async (req, res) => {
    try {
        const { retryFailedSyncs } = require("../services/tally.import.service");
        const result = await retryFailedSyncs();
        res.json(result);
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

module.exports = {
    testConnection,
    getTallyStatus,
    syncInvoiceToTally,
    manualSyncInvoice,
    getLedgers,
    getSales,
    getPurchase,
    getProfitLoss,
    getStock,
    getDashboardSummary,
    getSyncStatus,
    getSyncQueue,
    manualRetry,
    bulkRetry,
    syncTallyCustomers,
    retryFailedSyncs
};
