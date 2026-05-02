const express = require("express");
const cors = require("cors");
const axios = require("axios");
const xml2js = require("xml2js");
const { prisma } = require("./lib/prisma");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/tally-data", async (req, res) => {
  try {
    const xmlRequest = `
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>Voucher</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Voucher">
            <TYPE>Voucher</TYPE>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>
`;

    const response = await axios.post("http://localhost:9000", xmlRequest, {
      headers: { "Content-Type": "text/xml" }
    });

    xml2js.parseString(response.data, (err, result) => {
      if (err) return res.status(500).send("Parse Error");

      try {
        const vouchers =
          result?.ENVELOPE?.BODY?.[0]?.DATA?.[0]?.COLLECTION?.[0]?.VOUCHER || [];

        const cleanData = vouchers.map(v => {
          let amount = 0;
          const inventory = v.ALLINVENTORYENTRIESLIST?.[0] || {};
          const ledger = v.ALLLEDGERENTRIESLIST?.[0] || {};

          if (inventory.AMOUNT) {
            amount = parseFloat(inventory.AMOUNT[0]);
          } else if (ledger.AMOUNT) {
            amount = parseFloat(ledger.AMOUNT[0]);
          }

          return {
            date: v.DATE?.[0]?._ || v.DATE?.[0],
            type: v.VOUCHERTYPENAME?.[0],
            party: v.PARTYLEDGERNAME?.[0],
            amount: Math.abs(amount) || 0
          };
        });

        res.json(cleanData);

      } catch (e) {
        res.status(500).send("Mapping Error");
      }
    });

  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Database Connection check
prisma.$connect()
  .then(() => console.log("✅ Database Connected successfully via Prisma"))
  .catch(err => {
    console.error("❌ Database connection error:", err.message);
  });

// --- Routes Import ---
// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Zen Finance ERP Backend is operational" });
});

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const leadRoutes = require("./routes/leadRoutes");
const tallyRoutes = require("./routes/tally.routes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const hrRoutes = require("./routes/hrRoutes");
const reportRoutes = require("./routes/reportRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const customerRoutes = require("./routes/customerRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const procurementRoutes = require("./routes/procurementRoutes");
const financeRoutes = require("./routes/financeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const apRoutes = require("./routes/apRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const quotationRoutes = require("./routes/quotationRoutes");

// --- Route Mounting ---
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/tally", tallyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api", invoiceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/task-manager", taskRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/ap", apRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/quotations", quotationRoutes);

// Start Background Workers
require("./workers/tallySync.worker");
require("./workers/tallyImport.worker");

const tallyService = require("./services/tally.service");
app.post("/create-customer", async (req, res) => {
  const { name } = req.body;
  try {
    const result = await tallyService.syncLedger(name, 'Sundry Debtors');
    res.send({
      message: "Customer synced to Tally Queue",
      tallyResponse: result
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

const tallyClient = require("./services/tally.client");
const xmlBuilder = require("./services/tally.xmlBuilder");

app.post("/create-invoice", async (req, res) => {
  const { customer, amount } = req.body;
  try {
    // Step 1: Ensure customer ledger exists in Tally
    const customerXml = xmlBuilder.buildLedgerXML(customer, "Sundry Debtors");
    await tallyClient.sendToTally(customerXml);

    // Step 2: Ensure Sales ledger exists in Tally
    const salesLedgerXml = xmlBuilder.buildLedgerXML("Sales", "Sales Accounts");
    await tallyClient.sendToTally(salesLedgerXml);

    // Step 3: Create Sales Invoice
    const invoiceXml = `
    <ENVELOPE>
     <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
     <BODY>
      <IMPORTDATA>
       <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
       <REQUESTDATA>
        <TALLYMESSAGE>
         <VOUCHER VCHTYPE="Sales" ACTION="Create">
          <DATE>${new Date().toISOString().slice(0,10).replace(/-/g, '')}</DATE>
          <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
          <PARTYLEDGERNAME>${customer}</PARTYLEDGERNAME>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>${customer}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>-${amount}</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Sales</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>${amount}</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
         </VOUCHER>
        </TALLYMESSAGE>
       </REQUESTDATA>
      </IMPORTDATA>
     </BODY>
    </ENVELOPE>`;

    const result = await tallyClient.sendToTally(invoiceXml);
    res.send({
      message: "Sales Invoice successfully synced to Tally",
      tallyResponse: result
    });
  } catch (err) {
    console.error("Invoice Sync Error:", err.message);
    res.status(500).send({ error: "Sync Failed", details: err.message });
  }
});

// --- 404 Fallback ---
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Zen Finance Backend running on http://localhost:${PORT}`);
});






// restart nodemon trigger
// HRMS architecture trigger
 
