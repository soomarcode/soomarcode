const axios = require('axios');
const fs = require('fs');
const path = require('path');

const getHeaders = () => ({
  'X-Api-Key': process.env.HEYGEN_API_KEY,
  'Content-Type': 'application/json'
});

async function listAvatars() {
  try {
    const response = await axios.get('https://api.heygen.com/v2/avatars', {
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching avatars:', error.response?.data || error.message);
    throw error;
  }
}

async function listVoices() {
  try {
    const response = await axios.get('https://api.heygen.com/v2/voices', {
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching voices:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Upload an audio file to HeyGen as an asset.
 * Uses upload.heygen.com with raw binary body (NOT form-data).
 * Returns the asset data including the asset_id.
 */
async function uploadAudioAsset(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.webm': 'audio/webm'
    };
    const contentType = mimeTypes[ext] || 'audio/mpeg';
    const fileBuffer = fs.readFileSync(filePath);

    console.log(`[HeyGen] Uploading ${(fileBuffer.length / 1024).toFixed(1)} KB as ${contentType}...`);

    const response = await axios.post('https://upload.heygen.com/v1/asset', fileBuffer, {
      headers: {
        'X-Api-Key': process.env.HEYGEN_API_KEY,
        'Content-Type': contentType
      },
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024
    });

    const assetId = response.data?.data?.id || response.data?.data?.asset_id;
    console.log('[HeyGen] Audio uploaded, asset_id:', assetId);
    return response.data.data;
  } catch (error) {
    console.error('Error uploading audio asset:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a video using a text script and a voice ID.
 */
async function createVideo(avatarId, voiceId, inputScript) {
  try {
    const isHex = /^[a-f0-9]{32}$/i.test(avatarId);
    // For high quality, we ensure we use 'normal' style and high resolution
    const character = isHex 
      ? { type: 'talking_photo', talking_photo_id: avatarId }
      : { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' };

    const payload = {
      video_inputs: [
        {
          character: character,
          voice: {
            type: 'text',
            input_text: inputScript,
            voice_id: voiceId
          }
        }
      ],
      dimension: { width: 1920, height: 1080 }, // Upgrade to 1080p for High Quality
      aspect_ratio: '16:9',
      test: false // Ensure it's NOT a test video (uses credits but higher quality)
    };

    console.log(`[HeyGen] Creating High Quality video for ${avatarId}...`);
    const response = await axios.post('https://api.heygen.com/v2/video/generate', payload, {
      headers: getHeaders()
    });

    return response.data.data.video_id;
  } catch (error) {
    console.error('Error creating video:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a video using an uploaded audio asset.
 * Fallback logic: If it's a hex ID and generation fails, we try a Lipsync request.
 */
async function createVideoWithAudio(avatarId, audioAssetId) {
  // 1. Try standard generation first
  try {
    const isHex = /^[a-f0-9]{32}$/i.test(avatarId);
    
    // Attempt 1: Regular Avatar/Talking Photo generation
    const character = isHex 
      ? { type: 'talking_photo', talking_photo_id: avatarId }
      : { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' };

    const payload = {
      video_inputs: [{
        character: character,
        voice: { type: 'audio', audio_asset_id: audioAssetId }
      }],
      dimension: { width: 1280, height: 720 }
    };

    console.log(`[HeyGen] Attempting video generation with ID: ${avatarId}`);
    const response = await axios.post('https://api.heygen.com/v2/video/generate', payload, {
      headers: getHeaders()
    });

    console.log('[HeyGen] Generation started, video_id:', response.data.data.video_id);
    return response.data.data.video_id;

  } catch (error) {
    const status = error.response?.status;
    const errData = error.response?.data || {};
    
    console.log(`[HeyGen] Generation failed with ${status}. Checking for Lipsync fallback...`);

    // 2. If it failed with 400/404 and looks like a hex ID, it might be a Video ID for Lipsync
    if ((status === 400 || status === 404) && /^[a-f0-9]{32}$/i.test(avatarId)) {
      console.log(`[HeyGen] ID ${avatarId} looks like a Video ID. Attempting Lipsync fallback...`);
      
      try {
        // HeyGen V2 Lipsync Payload
        const lipsyncPayload = {
          video_id: avatarId,
          audio_asset_id: audioAssetId
        };
        
        // Note: Lipsync might use a different endpoint or specific V2 fields
        // We'll try the common v2/lipsync or v2/video/generate with a template-like structure
        const res = await axios.post('https://api.heygen.com/v2/lipsync', lipsyncPayload, {
          headers: getHeaders()
        });

        console.log('[HeyGen] Lipsync request successful:', res.data);
        return res.data.data.video_id;
      } catch (lsError) {
        console.error('[HeyGen] Lipsync fallback ALSO failed:', lsError.response?.data || lsError.message);
        throw error; // Throw the original error or the new one
      }
    }
    
    throw error;
  }
}

async function getVideoStatus(videoId) {
  try {
    const response = await axios.get(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: getHeaders()
    });
    return response.data.data;
  } catch (error) {
    console.error('Error getting video status:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  listAvatars,
  listVoices,
  createVideo,
  createVideoWithAudio,
  uploadAudioAsset,
  getVideoStatus
};
