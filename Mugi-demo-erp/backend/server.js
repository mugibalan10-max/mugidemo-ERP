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
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const leadRoutes = require("./routes/leadRoutes");
const tallyRoutes = require("./routes/tally.routes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const hrRoutes = require("./routes/hrRoutes");
const reportRoutes = require("./routes/reportRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const procurementRoutes = require("./routes/procurementRoutes");
const financeRoutes = require("./routes/financeRoutes");

// --- Route Mounting ---
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/tally", tallyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", hrRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api", invoiceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/task-manager", taskRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/finance", financeRoutes);

// Start Background Workers
require("./workers/tallySync.worker");

// Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Zen Finance Backend running on http://localhost:${PORT}`);
});
