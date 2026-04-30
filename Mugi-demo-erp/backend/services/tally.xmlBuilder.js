const xml2js = require("xml2js");

function escapeXML(str) {
  if (!str) return "";
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(dateStr) {
  // Educational Mode Support: Force DATE = 01 for testing if needed
  // For production, we use the actual date but keep day as 01 for Tally Educational Version
  const d = dateStr ? new Date(dateStr) : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = "01"; // Forced to 01 for Educational Mode
  return `${yyyy}${mm}${dd}`;
}

function buildSalesXML(data) {
  // data: { date, customer, number, amount, cgst, sgst, igst, isInterState, items: [] }
  const builder = new xml2js.Builder({ headless: true });
  
  const customerName = escapeXML(data.customer);
  const vchDate = formatDate(data.date);

  const obj = {
    ENVELOPE: {
      HEADER: { TALLYREQUEST: "Import Data" },
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
                DATE: vchDate,
                VOUCHERTYPENAME: "Sales",
                VOUCHERNUMBER: escapeXML(data.number),
                PARTYLEDGERNAME: customerName,
                PERSISTEDVIEW: "Accounting Voucher View",
                "ALLLEDGERENTRIES.LIST": [
                  {
                    LEDGERNAME: customerName,
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
  const voucher = obj.ENVELOPE.BODY.IMPORTDATA.REQUESTDATA.TALLYMESSAGE.VOUCHER;
  if (data.cgst > 0) {
      voucher["ALLLEDGERENTRIES.LIST"].push({
          LEDGERNAME: "Output CGST", ISDEEMEDPOSITIVE: "No", AMOUNT: data.cgst
      });
  }
  if (data.sgst > 0) {
      voucher["ALLLEDGERENTRIES.LIST"].push({
          LEDGERNAME: "Output SGST", ISDEEMEDPOSITIVE: "No", AMOUNT: data.sgst
      });
  }
  if (data.igst > 0) {
      voucher["ALLLEDGERENTRIES.LIST"].push({
          LEDGERNAME: "Output IGST", ISDEEMEDPOSITIVE: "No", AMOUNT: data.igst
      });
  }

  return builder.buildObject(obj);
}

function buildReceiptXML(data, customerName) {
  const builder = new xml2js.Builder({ headless: true });
  const name = escapeXML(customerName);
  const vchDate = formatDate(data.paymentDate);

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
                DATE: vchDate,
                VOUCHERTYPENAME: "Receipt",
                PARTYLEDGERNAME: name,
                "ALLLEDGERENTRIES.LIST": [
                  {
                    LEDGERNAME: name,
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

function buildLedgerXML(data, group = "Sundry Debtors") {
  // data can be a string (name) or an object { name, address, state, gst }
  const builder = new xml2js.Builder({ headless: true });
  const name = typeof data === 'string' ? data : data.name;
  const escapedName = escapeXML(name);
  
  const obj = {
    ENVELOPE: {
      HEADER: { TALLYREQUEST: "Import Data" },
      BODY: {
        IMPORTDATA: {
          REQUESTDESC: { REPORTNAME: "All Masters" },
          REQUESTDATA: {
            TALLYMESSAGE: {
              LEDGER: {
                $: { NAME: escapedName, ACTION: "Create" },
                NAME: escapedName,
                PARENT: group,
                ISBILLWISEON: "Yes",
                "ADDRESS.LIST": {
                    $: { TYPE: "String" },
                    ADDRESS: escapeXML(data.address || "")
                },
                STATENAME: escapeXML(data.state || ""),
                GSTIN: escapeXML(data.gst || data.gstNumber || "")
              }
            }
          }
        }
      }
    }
  };
  return builder.buildObject(obj);
}

function buildFetchLedgersXML() {
  const builder = new xml2js.Builder({ headless: true });
  const obj = {
    ENVELOPE: {
      HEADER: {
        VERSION: 1,
        TALLYREQUEST: "Export",
        TYPE: "Collection",
        ID: "Ledger"
      },
      BODY: {
        DESC: {
          STATICVARIABLES: {
            SVEXPORTFORMAT: "$$SysName:XML"
          },
          TDL: {
            TDLMESSAGE: {
              COLLECTION: {
                $: { NAME: "LedgerCollection" },
                TYPE: "Ledger",
                FETCH: "Name, Parent, Address, StateName, GSTIN"
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
  buildReceiptXML,
  buildLedgerXML,
  buildFetchLedgersXML,
  escapeXML
};
