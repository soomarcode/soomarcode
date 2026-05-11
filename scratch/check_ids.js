const axios = require('axios');
const API_KEY = 'sk_V2_hgu_kkBzyjkzAuN_6JAidde19vHhHzYly87EAknQPgzLo4Md';

async function run() {
  console.log('--- Checking Avatars ---');
  try {
    const res = await axios.get('https://api.heygen.com/v2/avatars', {
      headers: { 'X-Api-Key': API_KEY }
    });
    const avatars = res.data.data.avatars;
    console.log(`Found ${avatars.length} avatars.`);
    const matching = avatars.filter(a => JSON.stringify(a).includes('ce4eb991d06b4209882e04576086c313'));
    if (matching.length > 0) {
      console.log('MATCH FOUND IN AVATARS:');
      console.log(JSON.stringify(matching, null, 2));
    }
  } catch (e) {
    console.error('Avatar Check Error:', e.response?.data || e.message);
  }

  console.log('\n--- Checking Talking Photos ---');
  try {
    const res = await axios.get('https://api.heygen.com/v2/talking_photos', {
      headers: { 'X-Api-Key': API_KEY }
    });
    const photos = res.data.data.talking_photos;
    console.log(`Found ${photos.length} talking photos.`);
    const matching = photos.filter(p => JSON.stringify(p).includes('ce4eb991d06b4209882e04576086c313'));
    if (matching.length > 0) {
      console.log('MATCH FOUND IN TALKING PHOTOS:');
      console.log(JSON.stringify(matching, null, 2));
    }
  } catch (e) {
    console.error('Photo Check Error:', e.response?.data || e.message);
  }
}

run();
