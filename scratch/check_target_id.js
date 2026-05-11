const axios = require('axios');
require('dotenv').config();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const TARGET_ID = 'ce4eb991d06b4209882e04576086c313';

async function checkSpecificId() {
  try {
    console.log(`Checking ID: ${TARGET_ID}`);
    
    // Check Avatars
    const avRes = await axios.get('https://api.heygen.com/v2/avatars', {
      headers: { 'X-Api-Key': HEYGEN_API_KEY }
    });
    const avatar = avRes.data.data.avatars.find(a => a.avatar_id === TARGET_ID);
    if (avatar) {
      console.log('FOUND AS AVATAR:');
      console.log(JSON.stringify(avatar, null, 2));
      return;
    }

    // Check Talking Photos
    const tpRes = await axios.get('https://api.heygen.com/v2/talking_photos', {
      headers: { 'X-Api-Key': HEYGEN_API_KEY }
    });
    const photo = tpRes.data.data.talking_photos.find(p => p.talking_photo_id === TARGET_ID);
    if (photo) {
      console.log('FOUND AS TALKING PHOTO:');
      console.log(JSON.stringify(photo, null, 2));
      return;
    }

    console.log('ID not found in Avatars or Talking Photos.');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkSpecificId();
