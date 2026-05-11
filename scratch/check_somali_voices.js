const axios = require('axios');
require('dotenv').config();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

async function checkVoices() {
  try {
    const response = await axios.get('https://api.heygen.com/v2/voices', {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    const somaliVoices = response.data.data.voices.filter(v => v.language === 'Somali' || v.name.toLowerCase().includes('somali'));
    console.log(JSON.stringify(somaliVoices, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkVoices();
