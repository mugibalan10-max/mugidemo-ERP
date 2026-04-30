
const axios = require('axios');

async function checkTally() {
  const url = "http://127.0.0.1:9000";
  try {
    const xml = `<?xml version="1.0" encoding="utf-8"?><ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export Data</TALLYREQUEST><TYPE>Data</TYPE><ID>Company</ID></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></DESC></BODY></ENVELOPE>`;
    const res = await axios.post(url, xml, { 
      headers: { 'Content-Type': 'text/xml' },
      timeout: 3000 
    });
    console.log('STATUS: ' + res.status);
    console.log('CONNECTED: TRUE');
  } catch (err) {
    console.log('CONNECTED: FALSE');
    console.log('REASON: ' + err.message);
  }
}

checkTally();
