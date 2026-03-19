const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:8000/api/auth/login', {
      email: 'admin@example.com',
      password: 'password',
      device_name: 'web',
      device_platform: 'Web'
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}
test();
