const axios = require('axios');

async function testRegistration() {
  try {
    console.log('🔑 Logging in to get token...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@mugi.com',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Logged in. Token received.');

    console.log('🚀 Attempting to register customer...');
    const response = await axios.post('http://localhost:5000/api/leads/customers', {
      name: 'Test Client ' + Date.now(),
      email: 'test@example.com',
      phone: '1234567890',
      gstNumber: '22AAAAA0000A1Z5',
      address: '123 Test St'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Success:', response.status, response.data);
  } catch (err) {
    if (err.response) {
      console.error('❌ Failed:', err.response.status, err.response.data);
    } else {
      console.error('❌ Error:', err.message);
    }
  }
}

testRegistration();
