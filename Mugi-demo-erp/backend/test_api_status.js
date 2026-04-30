
const axios = require('axios');
async function testApi() {
  try {
    const res = await axios.get('http://localhost:5000/api/tally/status');
    console.log('STATUS_RES:', res.data);
    const queue = await axios.get('http://localhost:5000/api/tally/sync/queue');
    console.log('QUEUE_COUNT:', queue.data.data.length);
  } catch (err) {
    console.log('API_ERROR:', err.message);
  }
}
testApi();
