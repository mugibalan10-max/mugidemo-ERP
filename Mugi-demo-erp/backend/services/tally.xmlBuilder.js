const xml2js = require("xml2js");

function buildSalesXML(data) {
  // data: { date, customer, number, amount, cgst, sgst, igst, isInterState, items: [] }
  const builder = new xml2js.Builder({ headless: true });
  
  const obj = {
    ENVELOPE: {
      HEADER: {
        TALLYREQUEST: "Import Data"
      },
      BODY: {
        IMPORTDATA: {
          REQUESTDESC: {
            REPORTNAME: "Vouchers",
            STATICVARIABLES: { SVCURRENTCOMPANY: "Zen Finance Demo" }
          },
          REQUESTDATA: {
            TALLYMESSAGE: {
              $: { 'xmlns:UDF': "TallyUDF" },
              VOUCHER: {
                $: { VCHTYPE: "Sales", ACTION: "Create", OBJVIEW: "Accounting Voucher View" },
                DATE: data.date,
                VOUCHERTYPENAME: "Sales",
                VOUCHERNUMBER: data.number,
                PARTYLEDGERNAME: data.customer,
                PERSISTEDVIEW: "Accounting Voucher View",
                ALLLEDGERENTRIESLIST: [
                  {
                    LEDGERNAME: data.customer,
                    ISDEEMEDPOSITIVE: "Yes",
                    AMOUNT: `-${data.amount}` // Dr
                  },
                  {
                    LEDGERNAME: "Sales Account",
                    ISDEEMEDPOSITIVE: "No",
                    AMOUNT: data.subtotal || data.amount // Cr
                  }
                ]
              }
            }
          }
        }
      }
    }
  };

  // Add Taxes
  if (data.cgst > 0) {
      obj.ENVELOPE.BODY.IMPORTDATA.REQUESTDATA.TALLYMESSAGE.VOUCHER.ALLLEDGERENTRIESLIST.push({
          LEDGERNAME: "Output CGST", ISDEEMEDPOSITIVE: "No", AMOUNT: data.cgst
      });
  }
  if (data.sgst > 0) {
      obj.ENVELOPE.BODY.IMPORTDATA.REQUESTDATA.TALLYMESSAGE.VOUCHER.ALLLEDGERENTRIESLIST.push({
          LEDGERNAME: "Output SGST", ISDEEMEDPOSITIVE: "No", AMOUNT: data.sgst
      });
  }
  if (data.igst > 0) {
      obj.ENVELOPE.BODY.IMPORTDATA.REQUESTDATA.TALLYMESSAGE.VOUCHER.ALLLEDGERENTRIESLIST.push({
          LEDGERNAME: "Output IGST", ISDEEMEDPOSITIVE: "No", AMOUNT: data.igst
      });
  }

  return builder.buildObject(obj);
}

function buildReceiptXML(data, customerName) {
  const builder = new xml2js.Builder({ headless: true });
  const obj = {
    ENVELOPE: {
      HEADER: { TALLYREQUEST: "Import Data" },
      BODY: {
        IMPORTDATA: {
          REQUESTDESC: { REPORTNAME: "Vouchers", STATICVARIABLES: { SVCURRENTCOMPANY: "Zen Finance Demo" } },
          REQUESTDATA: {
            TALLYMESSAGE: {
              $: { 'xmlns:UDF': "TallyUDF" },
              VOUCHER: {
                $: { VCHTYPE: "Receipt", ACTION: "Create" },
                DATE: data.paymentDate || new Date().toISOString().slice(0, 10).replace(/-/g, ""),
                VOUCHERTYPENAME: "Receipt",
                PARTYLEDGERNAME: customerName,
                ALLLEDGERENTRIESLIST: [
                  {
                    LEDGERNAME: customerName,
                    ISDEEMEDPOSITIVE: "No",
                    AMOUNT: data.amount // Cr
                  },
                  {
                    LEDGERNAME: "Bank Account",
                    ISDEEMEDPOSITIVE: "Yes",
                    AMOUNT: `-${data.amount}` // Dr
                  }
                ]
              }
            }
          }
        }
      }
    }
  };
  return builder.buildObject(obj);
}

module.exports = {
  buildSalesXML,
  buildReceiptXML
};
