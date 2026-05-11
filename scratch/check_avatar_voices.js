const axios = require('axios');
require('dotenv').config();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

async function checkAvatarsDetailed() {
  try {
    const response = await axios.get('https://api.heygen.com/v2/avatars', {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const detailedAvatars = response.data.data.avatars.map(a => {
      return {
        id: a.avatar_id,
        name: a.avatar_name,
        // Check for common voice fields
        voice_id: a.voice_id || a.default_voice_id || (a.preview_voices && a.preview_voices[0]?.voice_id) || null
      };
    }).filter(a => a.voice_id);

    console.log(JSON.stringify(detailedAvatars, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkAvatarsDetailed();
