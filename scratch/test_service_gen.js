const heygen = require('../services/heygen');
require('dotenv').config();

const AVATAR_ID = 'ce4eb991d06b4209882e04576086c313';
const VOICE_ID = '662adba1af7246a595fee67112d46dcd';
const SCRIPT = "Kusoo dhowow Shiine AI Studio! Kan waa tusaale fiidiyow ah oo lagu soo saaray tignoolajiyada HeyGen iyo codka asalka ah. Shiine waa xalka ugu habboon ee lagu abuuro xayeysiisyada casriga ah ee Somaliya.";

async function runFromService() {
  console.log('[Shiine] Attempting generation using project services...');
  try {
    const videoId = await heygen.createVideo(AVATAR_ID, VOICE_ID, SCRIPT);
    console.log('[Shiine] Video ID generated:', videoId);
  } catch (error) {
    console.error('[Shiine] Service-based generation failed:', error.response?.data || error.message);
  }
}

runFromService();
