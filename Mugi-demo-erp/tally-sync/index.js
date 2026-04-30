const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.get("/", (req, res) => {
  res.send("<h1>Standalone Tally Sync Server is Running!</h1><p>Visit <a href='/sync-tally-customers'>/sync-tally-customers</a> to sync.</p>");
});

app.get("/sync-tally-customers", async (req, res) => {

  console.log(`🚀 [${new Date().toLocaleTimeString()}] Tally Sync API Hit`);

  const xmlRequest = `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>Ledger</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="LedgerCollection">
            <TYPE>Ledger</TYPE>
            <FETCH>Name, Parent, Address, StateName, GSTIN</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

  try {
    const response = await fetch("http://localhost:9999", {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xmlRequest
    });

    console.log("📡 Tally connection successful");

    const xmlData = await response.text();

    console.log("📥 Response received from Tally");

    // 🔥 SANITIZE XML
    const sanitizedData = xmlData
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/g, "")
      .replace(/&#(x[0-9a-fA-F]+|[0-9]+);/g, (match, capture) => {
          const charCode = capture.startsWith('x') ? parseInt(capture.slice(1), 16) : parseInt(capture, 10);
          if ((charCode >= 0 && charCode <= 31 && charCode !== 9 && charCode !== 10 && charCode !== 13) || (charCode >= 127 && charCode <= 159)) {
              return "";
          }
          return match;
      });

    // 🔥 PARSE XML -> JSON
    const xml2js = require("xml2js");
    const parser = new xml2js.Parser({ explicitArray: true });
    const result = await parser.parseStringPromise(sanitizedData);

    const dataNode = result?.ENVELOPE?.BODY?.[0]?.DATA?.[0];
    const collectionNode = dataNode?.COLLECTION?.[0];
    
    // DEBUG: Log available keys to find the correct data path
    if (collectionNode) {
        console.log("📂 Collection Node Keys:", Object.keys(collectionNode));
    }

    const ledgers = collectionNode?.LedgerCollection || collectionNode?.LEDGER || [];

    const customers = ledgers
      // .filter(l => l.PARENT?.[0] === "Sundry Debtors")
      .map(l => ({
        name: l.NAME?.[0] || l.$.NAME,
        parent: l.PARENT?.[0] || "Unknown",
        address: l["ADDRESS.LIST"]?.[0]?.ADDRESS?.[0] || "",
        state: l.STATENAME?.[0] || "",
        gst: l.GSTIN?.[0] || ""
      }));

    console.log(`✅ Synced ${customers.length} Customers`);

    res.json({
      status: "success",
      count: customers.length,
      customers: customers
    });

  } catch (err) {
    console.log("❌ ERROR:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Debug middleware
app.use((req, res) => {
  console.log(`❓ Unknown Route: ${req.originalUrl}`);
  res.status(404).send(`Cannot GET ${req.originalUrl} - Try visiting /sync-tally-customers`);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Standalone Tally Sync Server running on http://localhost:${PORT}`);
});
