console.log("🚀 Script started");

const axios = require("axios");

(async () => {
    try {
        console.log("📤 Sending request to Tally...");
        const xml = `
<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>

 <BODY>
  <IMPORTDATA>
   <REQUESTDESC>
    <REPORTNAME>Vouchers</REPORTNAME>
   </REQUESTDESC>

   <REQUESTDATA>
    <TALLYMESSAGE>
     <VOUCHER VCHTYPE="Sales">
      <DATE>20260415</DATE>
      <VOUCHERNUMBER>INV-001</VOUCHERNUMBER>
      <PARTYLEDGERNAME>Cash</PARTYLEDGERNAME>

      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>Sales</LEDGERNAME>
        <AMOUNT>-1000</AMOUNT>
      </ALLLEDGERENTRIES.LIST>

      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>Cash</LEDGERNAME>
        <AMOUNT>1000</AMOUNT>
      </ALLLEDGERENTRIES.LIST>

     </VOUCHER>
    </TALLYMESSAGE>
   </REQUESTDATA>

  </IMPORTDATA>
 </BODY>
</ENVELOPE>
`;




        const response = await axios.post("http://localhost:9000", xml, {
            headers: {
                "Content-Type": "text/xml"
            }
        });

        console.log("✅ SUCCESS RESPONSE:");
        console.log(response.data);

    } catch (error) {
        console.log("❌ ERROR:");
        console.log(error.message);
    }
})();