
const axios = require('axios');
try {
  axios.post('post http://localhost:9000');
} catch (err) {
  console.log('REPLICATED ERROR:', err.message);
}
