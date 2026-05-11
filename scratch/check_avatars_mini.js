const axios = require('axios');
require('dotenv').config();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

async function checkAvatars() {
  try {
    const response = await axios.get('https://api.heygen.com/v2/avatars', {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    // Print only the first few avatars to avoid huge output
    console.log(JSON.stringify(response.data.data.avatars.slice(0, 3), null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkAvatars();
