const axios = require("axios");

const TALLY_URL = "http://localhost:9000";

/**
 * Tally Integration Service
 * Handles XML-based communication with the Tally ERP 9 / TallyPrime server.
 */
async function sendToTally(xmlData) {
  try {
    const response = await axios.post(TALLY_URL, xmlData, {
      headers: {
        "Content-Type": "application/xml"
      }
    });

    return response.data;
  } catch (err) {
    console.error("Tally Sync Error:", err.message);
    throw new Error("Could not connect to Tally. Ensure Tally is running and ODBC/HTTP is enabled on port 9000.");
  }
}

/**
 * Generates Tally-compatible XML for a Sales Voucher
 */
function generateSalesXML(invoice) {
    const date = new Date(invoice.createdAt || Date.now());
    const tallyDate = date.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    
    return `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create">
            <DATE>${tallyDate}</DATE>
            <PARTYLEDGERNAME>${invoice.customerName}</PARTYLEDGERNAME>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <REFERENCE>${invoice.invoiceNo}</REFERENCE>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${invoice.customerName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${invoice.total}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Sales Accounts</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${invoice.subtotal}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>GST Output</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${invoice.gstAmount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
`;
}

/**
 * Generates Tally-compatible XML for a Receipt Voucher (Payments)
 */
function generateReceiptXML(payment, customerName) {
    const tallyDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Receipt" ACTION="Create">
            <DATE>${tallyDate}</DATE>
            <PARTYLEDGERNAME>${customerName}</PARTYLEDGERNAME>
            <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${customerName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${payment.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Cash / Bank</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${payment.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

/**
 * Generates Tally-compatible XML for a Stock Item sync
 */
function generateStockXML(product) {
    return `
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <STOCKITEM NAME="${product.productName}" ACTION="Create">
            <NAME.LIST>
              <NAME>${product.productName}</NAME>
            </NAME.LIST>
            <BASEUNITS>Nos</BASEUNITS>
            <OPENINGBALANCE>${product.quantity} Nos</OPENINGBALANCE>
            <OPENINGVALUE>-${product.quantity * product.price}</OPENINGVALUE>
          </STOCKITEM>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

module.exports = { sendToTally, generateSalesXML, generateReceiptXML, generateStockXML };
