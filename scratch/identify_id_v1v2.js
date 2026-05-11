const axios = require('axios');
require('dotenv').config();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const TARGET_ID = 'ce4eb991d06b4209882e04576086c313';

async function identify() {
  const headers = { 'X-Api-Key': HEYGEN_API_KEY };
  
  // Try v2 avatars
  try {
    const res = await axios.get('https://api.heygen.com/v2/avatars', { headers });
    const found = res.data.data.avatars.find(a => a.avatar_id === TARGET_ID);
    if (found) { console.log('TYPE: V2 Avatar'); return; }
  } catch (e) {}

  // Try v1 talking photos
  try {
    const res = await axios.get('https://api.heygen.com/v1/talking_photo.list', { headers });
    const found = res.data.data.talking_photos.find(p => p.talking_photo_id === TARGET_ID);
    if (found) { console.log('TYPE: V1 Talking Photo'); return; }
  } catch (e) {}
  
  // Try v2 video status (maybe it's a video ID for lipsync?)
  try {
    const res = await axios.get(`https://api.heygen.com/v1/video_status.get?video_id=${TARGET_ID}`, { headers });
    if (res.data.data) { console.log('TYPE: Video ID (Status exists)'); return; }
  } catch (e) {}

  console.log('TYPE: Unknown');
}

identify();
