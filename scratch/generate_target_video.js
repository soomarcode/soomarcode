const axios = require('axios');
require('dotenv').config();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const AVATAR_ID = 'ce4eb991d06b4209882e04576086c313'; // User provided ID
const VOICE_ID = '662adba1af7246a595fee67112d46dcd'; // "shiine" voice clone
const SCRIPT = "Kusoo dhowow Shiine AI Studio! Kan waa tusaale fiidiyow ah oo lagu soo saaray tignoolajiyada HeyGen iyo codka asalka ah. Shiine waa xalka ugu habboon ee lagu abuuro xayeysiisyada casriga ah ee Somaliya.";

async function generate() {
  console.log(`[Shiine] Starting generation for Avatar: ${AVATAR_ID}`);
  
  const payload = {
    video_inputs: [
      {
        character: {
          type: 'avatar', 
          avatar_id: AVATAR_ID,
          avatar_style: 'normal'
        },
        voice: {
          type: 'text',
          input_text: SCRIPT,
          voice_id: VOICE_ID
        }
      }
    ],
    dimension: { width: 1280, height: 720 }
  };

  try {
    const response = await axios.post('https://api.heygen.com/v2/video/generate', payload, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const videoId = response.data.data.video_id;
    console.log(`[Shiine] SUCCESS! Video ID: ${videoId}`);
    console.log(`[Shiine] You can track the status here: https://api.heygen.com/v1/video_status.get?video_id=${videoId}`);
    return videoId;
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('[Shiine] Generation Error:', JSON.stringify(errData, null, 2));
    
    // Fallback for Talking Photo if Avatar failed
    if (JSON.stringify(errData).includes('avatar_id not found')) {
      console.log('[Shiine] Retrying as Talking Photo...');
      payload.video_inputs[0].character = {
        type: 'talking_photo',
        talking_photo_id: AVATAR_ID
      };
      
      try {
        const res2 = await axios.post('https://api.heygen.com/v2/video/generate', payload, {
          headers: {
            'X-Api-Key': HEYGEN_API_KEY,
            'Content-Type': 'application/json'
          }
        });
        const vid2 = res2.data.data.video_id;
        console.log(`[Shiine] SUCCESS (Talking Photo)! Video ID: ${vid2}`);
        return vid2;
      } catch (err2) {
        console.error('[Shiine] Talking Photo fallback also failed:', err2.response?.data || err2.message);
      }
    }
  }
}

generate();
