const axios = require('axios');
require('dotenv').config();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const ID = 'ce4eb991d06b4209882e04576086c313';
const VOICE_ID = '662adba1af7246a595fee67112d46dcd';
const SCRIPT = "Kusoo dhowow Shiine AI Studio! Kan waa tusaale fiidiyow ah oo lagu soo saaray tignoolajiyada HeyGen iyo codka asalka ah. Shiine waa xalka ugu habboon ee lagu abuuro xayeysiisyada casriga ah ee Somaliya.";

async function runTemplate() {
  console.log(`[Shiine] Attempting V2 Template Generation for ID: ${ID}`);
  
  const payload = {
    template_id: ID,
    template_inputs: [
      {
        selector: "character_1", // Just a guess for common templates
        voice: {
          type: "text",
          input_text: SCRIPT,
          voice_id: VOICE_ID
        }
      }
    ]
  };

  try {
    const response = await axios.post('https://api.heygen.com/v2/template/generate', payload, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('[Shiine] SUCCESS (Template)!', JSON.stringify(response.data, null, 2));
    return response.data.data.video_id;
  } catch (error) {
    console.error('[Shiine] Template failed:', error.response?.data || error.message);
  }
}

runTemplate();
