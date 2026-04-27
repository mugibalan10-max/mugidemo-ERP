const tallyClient = require("./tally.client");
const xmlBuilder = require("./tally.xmlBuilder");
const { prisma } = require("../lib/prisma");

const addToSyncQueue = async (data) => {
    return await prisma.syncQueue.create({
        data: {
            ...data,
            status: "QUEUED"
        }
    });
};

const pushSalesToTally = async (invoice) => {
    return await addToSyncQueue({
        entityType: "invoice",
        entityId: invoice.invoiceNo || String(invoice.id),
        payload: invoice
    });
};

const syncPayment = async (payment, customerName) => {
    return await addToSyncQueue({
        entityType: "payment",
        entityId: String(payment.id),
        payload: { ...payment, customerName }
    });
};

const syncStock = async (product) => {
    return await addToSyncQueue({
        entityType: "stock",
        entityId: product.sku || String(product.id),
        payload: product
    });
};

const fetchLedgers = async () => {
    const xml = `
    <ENVELOPE>
        <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>List of Ledgers</REPORTNAME>
                    <STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;
    const result = await tallyClient.getDataFromTally(xml);
    const ledgersRaw = result?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE || [];
    const ledgers = Array.isArray(ledgersRaw) ? ledgersRaw : (ledgersRaw ? [ledgersRaw] : []);
    
    return ledgers.map(l => ({
        name: l.LEDGER?.NAME || l.NAME || "Unknown",
        group: l.LEDGER?.PARENT || l.PARENT || "Sundry Debtors"
    }));
};

const fetchVouchers = async (type = "Sales") => {
    const xml = `
    <ENVELOPE>
        <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Voucher Register</REPORTNAME>
                    <STATICVARIABLES>
                        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                        <VOUCHERTYPENAME>${type}</VOUCHERTYPENAME>
                    </STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;
    const result = await tallyClient.getDataFromTally(xml);
    const vouchersRaw = result?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE || [];
    const vouchers = Array.isArray(vouchersRaw) ? vouchersRaw : (vouchersRaw ? [vouchersRaw] : []);

    return vouchers.map(v => {
        const voucher = v.VOUCHER || v;
        return {
            date: voucher.DATE,
            number: voucher.VOUCHERNUMBER,
            party: voucher.PARTYLEDGERNAME,
            type: type,
            amount: Math.abs(parseFloat(voucher.AMOUNT || 0))
        };
    });
};

const fetchProfitLoss = async () => {
    const xml = `
    <ENVELOPE>
        <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Profit and Loss</REPORTNAME>
                    <STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;
    const result = await tallyClient.getDataFromTally(xml);
    // Simplified parsing for brevity in demo
    return result?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE || {};
};

const fetchStockSummary = async () => {
    const xml = `
    <ENVELOPE>
        <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Stock Summary</REPORTNAME>
                    <STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;
    const result = await tallyClient.getDataFromTally(xml);
    const stockRaw = result?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE || [];
    const stockItems = Array.isArray(stockRaw) ? stockRaw : (stockRaw ? [stockRaw] : []);
    
    return stockItems.map(s => ({
        name: s.STOCKITEM?.NAME || "Unknown Item",
        quantity: s.STOCKITEM?.CLOSINGBALANCE || "0",
        value: s.STOCKITEM?.CLOSINGVALUE || "0"
    }));
};

const getDashboardAnalytics = async () => {
    const sales = await fetchVouchers("Sales");
    const purchases = await fetchVouchers("Purchase");
    const totalSales = sales.reduce((acc, curr) => acc + curr.amount, 0);
    const totalPurchase = purchases.reduce((acc, curr) => acc + curr.amount, 0);
    const stock = await fetchStockSummary();
    const stockValue = stock.reduce((acc, curr) => acc + parseFloat(curr.value || 0), 0);

    return {
        totalSales,
        totalPurchase,
        totalProfit: totalSales - totalPurchase, // Simplified
        cashBalance: 1250000, // Mocked for demo if ledger fetch is too slow
        stockValue,
        recentTransactions: [...sales, ...purchases].sort((a, b) => b.date - a.date).slice(0, 10),
        lowStock: stock.filter(item => parseFloat(item.quantity) < 10).slice(0, 5),
        gstSummary: {
            collected: totalSales * 0.18,
            paid: totalPurchase * 0.18,
            net: (totalSales - totalPurchase) * 0.18
        }
    };
};

const fetchLedgerBalances = async () => {
    const xml = `
    <ENVELOPE>
        <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>List of Ledgers</REPORTNAME>
                    <STATICVARIABLES>
                        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                    </STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;
    const result = await tallyClient.getDataFromTally(xml);
    const ledgersRaw = result?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE || [];
    const ledgers = Array.isArray(ledgersRaw) ? ledgersRaw : (ledgersRaw ? [ledgersRaw] : []);
    
    return ledgers.map(l => {
        const ledger = l.LEDGER || l;
        return {
            name: ledger.NAME || "Unknown",
            tallyBalance: Math.abs(parseFloat(ledger.CLOSINGBALANCE || 0))
        };
    });
};

const updateSyncStatus = async (entityId, entityType, status) => {
    return await prisma.syncQueue.updateMany({
        where: { entityId: String(entityId), entityType: entityType },
        data: { status: status }
    });
};

module.exports = { 
    addToSyncQueue,
    pushSalesToTally, 
    syncPayment, 
    syncStock,
    updateSyncStatus,
    fetchProfitLoss,
    fetchStockSummary,
    getDashboardAnalytics,
    fetchLedgerBalances
};

