const axios = require('axios');
require('dotenv').config();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const ID = 'ce4eb991d06b4209882e04576086c313';
const VOICE_ID = '662adba1af7246a595fee67112d46dcd';
const SCRIPT = "Kusoo dhowow Shiine AI Studio! Kan waa tusaale fiidiyow ah oo lagu soo saaray tignoolajiyada HeyGen iyo codka asalka ah. Shiine waa xalka ugu habboon ee lagu abuuro xayeysiisyada casriga ah ee Somaliya.";

async function runV1() {
  console.log(`[Shiine] Attempting V1 Generation for ID: ${ID}`);
  
  const payload = {
    background: "#ffffff",
    clips: [
      {
        avatar_id: ID,
        avatar_style: "normal",
        voice_id: VOICE_ID,
        input_text: SCRIPT
      }
    ]
  };

  try {
    const response = await axios.post('https://api.heygen.com/v1/video.generate', payload, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('[Shiine] SUCCESS (V1)!', JSON.stringify(response.data, null, 2));
    return response.data.data.video_id;
  } catch (error) {
    console.error('[Shiine] V1 failed:', error.response?.data || error.message);
  }
}

runV1();
