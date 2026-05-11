const axios = require('axios');
require('dotenv').config();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

async function findUserAssets() {
  try {
    const avatarResponse = await axios.get('https://api.heygen.com/v2/avatars', {
      headers: { 'X-Api-Key': HEYGEN_API_KEY }
    });
    const voiceResponse = await axios.get('https://api.heygen.com/v2/voices', {
      headers: { 'X-Api-Key': HEYGEN_API_KEY }
    });

    const userAvatars = avatarResponse.data.data.avatars.filter(a => 
      a.avatar_name.toLowerCase().includes('shiine') || 
      a.avatar_id.toLowerCase().includes('shiine')
    );

    const userVoices = voiceResponse.data.data.voices.filter(v => 
      v.name.toLowerCase().includes('shiine') || 
      v.voice_id.toLowerCase().includes('shiine')
    );

    console.log('User Avatars:', JSON.stringify(userAvatars, null, 2));
    console.log('User Voices:', JSON.stringify(userVoices, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

findUserAssets();
