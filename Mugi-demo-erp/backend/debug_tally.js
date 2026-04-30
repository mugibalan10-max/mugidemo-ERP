
const axios = require('axios');
const xml = `<?xml version="1.0" encoding="utf-8"?><ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export Data</TALLYREQUEST><TYPE>Data</TYPE><ID>Company</ID></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></DESC></BODY></ENVELOPE>`;

async function check() {
  try {
    const res = await axios.post('http://127.0.0.1:9999', xml, {
      headers: { 'Content-Type': 'text/xml' },
      timeout: 3000
    });
    console.log('CONNECTED: TRUE');
    console.log('STATUS:', res.status);
    console.log('DATA:', res.data.substring(0, 100));
  } catch (err) {
    console.log('CONNECTED: FALSE');
    console.log('ERROR:', err.message);
  }
}
check();
