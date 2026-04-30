
const axios = require('axios');

async function checkTally() {
  const url = "http://localhost:9000";
  try {
    const xml = `<?xml version="1.0" encoding="utf-8"?><ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export Data</TALLYREQUEST><TYPE>Data</TYPE><ID>Company</ID></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></DESC></BODY></ENVELOPE>`;
    const res = await axios.post(url, xml, { 
      headers: { 'Content-Type': 'text/xml' },
      timeout: 2000 
    });
    if (res.status === 200) {
      console.log('TALLY_STATUS: CONNECTED');
      console.log('RESPONSE_SAMPLE:', res.data.toString().slice(0, 50));
    } else {
      console.log('TALLY_STATUS: DISCONNECTED');
      console.log('REASON: Received status ' + res.status);
    }
  } catch (err) {
    console.log('TALLY_STATUS: DISCONNECTED');
    console.log('REASON:', err.code || err.message);
  }
}

checkTally();
