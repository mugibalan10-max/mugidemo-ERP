const buildSalesXML = (invoice) => {
  return `
<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
   <REQUESTDATA>
    <TALLYMESSAGE>
     <VOUCHER VCHTYPE="Sales">
      <DATE>${invoice.date}</DATE>
      <PARTYLEDGERNAME>${invoice.customer}</PARTYLEDGERNAME>
      <VOUCHERNUMBER>${invoice.number}</VOUCHERNUMBER>
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>Sales</LEDGERNAME>
        <AMOUNT>-${invoice.amount}</AMOUNT>
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
            <OPENINGBALANCE>${product.quantity} Nos</OPENINGBALANCE>
            <OPENINGVALUE>-${product.quantity * product.price}</OPENINGVALUE>
          </STOCKITEM>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
};

module.exports = { buildSalesXML, buildReceiptXML, buildStockXML };
