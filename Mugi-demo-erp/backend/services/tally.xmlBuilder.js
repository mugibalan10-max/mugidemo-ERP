const validateInvoice = (invoice) => {
  if (!invoice.date) throw new Error("Tally Sync Error: Invoice date is missing.");
  if (!invoice.customer && !invoice.customerName) throw new Error("Tally Sync Error: Customer name is missing.");
  if (!invoice.number && !invoice.invoiceNo) throw new Error("Tally Sync Error: Invoice number is missing.");
  if (!invoice.total && !invoice.amount) throw new Error("Tally Sync Error: Invoice amount is missing.");
};

const buildSalesXML = (invoice) => {
  validateInvoice(invoice);

  const date = (invoice.date || new Date(invoice.createdAt).toISOString().slice(0, 10)).replace(/-/g, "");
  const customer = invoice.customer?.name || invoice.customerName;
  const number = invoice.number || invoice.invoiceNo;
  const totalAmount = parseFloat(invoice.amount || invoice.total);
  const gstAmount = parseFloat(invoice.gstAmount || 0);
  const subtotal = totalAmount - gstAmount;

  // Tally uses Debit (+ve) for Assets/Expenses and Credit (-ve) for Income/Liabilities in Vouchers
  return `
<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
   <REQUESTDATA>
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
     <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJTYPE="Voucher">
      <DATE>${date}</DATE>
      <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
      <VOUCHERNUMBER>${number}</VOUCHERNUMBER>
      <PARTYLEDGERNAME>${customer}</PARTYLEDGERNAME>
      <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
      
      <!-- Customer Debit Entry -->
      <ALLLEDGERENTRIES.LIST>
       <LEDGERNAME>${customer}</LEDGERNAME>
       <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
       <AMOUNT>-${totalAmount}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>

      <!-- Sales Credit Entry -->
      <ALLLEDGERENTRIES.LIST>
       <LEDGERNAME>Sales Accounts</LEDGERNAME>
       <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
       <AMOUNT>${subtotal.toFixed(2)}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>

      <!-- GST Entries (Simplified to single GST ledger if not split) -->
      ${gstAmount > 0 ? `
      <ALLLEDGERENTRIES.LIST>
       <LEDGERNAME>Output GST</LEDGERNAME>
       <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
       <AMOUNT>${gstAmount.toFixed(2)}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>` : ""}
     </VOUCHER>
    </TALLYMESSAGE>
   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>`;
};

const buildPurchaseXML = (purchase) => {
    const date = (purchase.date || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
    return `
<ENVELOPE>
 <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDATA>
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
     <VOUCHER VCHTYPE="Purchase" ACTION="Create">
      <DATE>${date}</DATE>
      <VOUCHERNUMBER>${purchase.billNo}</VOUCHERNUMBER>
      <PARTYLEDGERNAME>${purchase.vendorName}</PARTYLEDGERNAME>
      <ALLLEDGERENTRIES.LIST>
       <LEDGERNAME>${purchase.vendorName}</LEDGERNAME>
       <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
       <AMOUNT>${purchase.total}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
      <ALLLEDGERENTRIES.LIST>
       <LEDGERNAME>Purchase Accounts</LEDGERNAME>
       <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
       <AMOUNT>-${purchase.subtotal}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
     </VOUCHER>
    </TALLYMESSAGE>
   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>`;
};

const buildReceiptXML = (payment, customerName) => {
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
              <LEDGERNAME>Bank / Cash</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${payment.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
};

const buildStockXML = (product) => {
    return `
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <STOCKITEM NAME="${product.productName}" ACTION="Create">
            <NAME.LIST><NAME>${product.productName}</NAME></NAME.LIST>
            <BASEUNITS>Nos</BASEUNITS>
            <GSTAPPLICABLE>Applicable</GSTAPPLICABLE>
            <OPENINGBALANCE>${product.quantity} Nos</OPENINGBALANCE>
            <OPENINGVALUE>-${(product.quantity * product.price).toFixed(2)}</OPENINGVALUE>
          </STOCKITEM>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
};

module.exports = { buildSalesXML, buildPurchaseXML, buildReceiptXML, buildStockXML };
