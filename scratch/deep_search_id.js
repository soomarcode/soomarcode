const axios = require('axios');
require('dotenv').config();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const TARGET_ID = 'ce4eb991d06b4209882e04576086c313';

async function deepSearch() {
  const headers = { 'X-Api-Key': HEYGEN_API_KEY };
  
  try {
    const res = await axios.get('https://api.heygen.com/v2/avatars', { headers });
    const avatars = res.data.data.avatars;
    
    for (const a of avatars) {
      if (JSON.stringify(a).includes(TARGET_ID)) {
        console.log('MATCH FOUND IN AVATAR:');
        console.log(JSON.stringify(a, null, 2));
        return;
      }
    }

    const res2 = await axios.get('https://api.heygen.com/v2/talking_photos', { headers });
    const photos = res2.data.data.talking_photos;
    for (const p of photos) {
      if (JSON.stringify(p).includes(TARGET_ID)) {
        console.log('MATCH FOUND IN TALKING PHOTO:');
        console.log(JSON.stringify(p, null, 2));
        return;
      }
    }

    console.log('ID not found anywhere in V2 Avatars or Talking Photos.');
  } catch (error) {
    console.error('Search error:', error.response?.data || error.message);
  }
}

deepSearch();
