const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const heygen = require('./services/heygen');
const supabase = require('./services/supabase');
require('dotenv').config();

// Tell fluent-ffmpeg where it can find the ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const port = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `voice_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.mp4'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${ext}. Use mp3, wav, m4a, ogg, webm, or mp4.`));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Utility: Convert any audio/video to mp3
const convertToMp3 = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('mp3')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
};

// ---------- Health ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Shiine API is running' });
});

// ---------- HeyGen: List Avatars ----------
app.get('/api/heygen/avatars', async (req, res) => {
  try {
    const data = await heygen.listAvatars();
    // Optimization: Return all avatars without aggressive filtering
    const avatars = (data.data.avatars || [])
      .map(a => ({
        id: a.avatar_id,
        name: a.avatar_name || a.avatar_id,
        preview_image: a.preview_image_url,
        default_voice_id: a.default_voice_id || null
      }));
    
    res.json({ success: true, avatars });
  } catch (err) {
    console.error('Error fetching avatars:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- HeyGen: List Voices ----------
app.get('/api/heygen/voices', async (req, res) => {
  try {
    const data = await heygen.listVoices();
    // Return all voices instead of aggressively filtering
    const voices = data.data.voices || [];
    res.json({ success: true, voices });
  } catch (err) {
    console.error('Error fetching voices:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- HeyGen: Upload Audio + Generate Video ----------
app.post('/api/heygen/generate-with-audio', upload.single('audio'), async (req, res) => {
  try {
    const avatarId = req.body.avatarId;
    
    if (!avatarId) {
      return res.status(400).json({ success: false, error: 'No avatar selected.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file uploaded.' });
    }

    console.log(`[Shiine] Audio file received: ${req.file.filename} (${(req.file.size / 1024).toFixed(1)} KB)`);

    // Step 0: Convert to MP3 to ensure HeyGen compatibility
    const mp3Path = req.file.path + '.mp3';
    console.log('[Shiine] Converting to MP3...');
    await convertToMp3(req.file.path, mp3Path);
    console.log('[Shiine] Conversion complete:', mp3Path);

    // Step 1: Upload audio to HeyGen as an asset
    console.log('[Shiine] Uploading audio to HeyGen...');
    const assetData = await heygen.uploadAudioAsset(mp3Path);
    const audioAssetId = assetData.id || assetData.asset_id;
    console.log('[Shiine] Audio asset ID:', audioAssetId);

    // Step 2: Create video with avatar + audio
    console.log('[Shiine] Creating avatar video with audio...');
    const videoId = await heygen.createVideoWithAudio(avatarId, audioAssetId);
    console.log('[Shiine] Video ID:', videoId);

    // Clean up files
    fs.unlink(req.file.path, () => {});
    fs.unlink(mp3Path, () => {});

    res.json({ success: true, videoId, audioAssetId });
  } catch (err) {
    // Clean up on error
    if (req.file) {
      fs.unlink(req.file.path, () => {});
      if (fs.existsSync(req.file.path + '.mp3')) {
        fs.unlink(req.file.path + '.mp3', () => {});
      }
    }
    console.error('[Shiine] Error in generate-with-audio:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- HeyGen: Generate Video with Text (Professional Mode) ----------
app.post('/api/heygen/generate', async (req, res) => {
  try {
    const { avatarId, voiceId, script } = req.body;

    if (!avatarId || !voiceId || !script) {
      return res.status(400).json({ success: false, error: 'avatarId, voiceId, and script are required.' });
    }

    console.log(`[Shiine] Creating Professional Video for avatar: ${avatarId} with AI Voice: ${voiceId}`);
    const videoId = await heygen.createVideo(avatarId, voiceId, script);
    
    // Save to Supabase
    await supabase.saveVideo({
      videoId,
      avatarId,
      voiceId,
      script
    });

    res.json({ success: true, videoId });
  } catch (err) {
    console.error('[Shiine] Error in generate (TTS):', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- HeyGen: Check Video Status ----------
app.get('/api/heygen/status/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const data = await heygen.getVideoStatus(videoId);
    
    // Update Supabase if completed or failed
    if (data.status === 'completed' || data.status === 'failed') {
      await supabase.updateVideoStatus(videoId, data.status, data.video_url);
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- Facebook Analytics ----------
app.get('/api/analytics', async (req, res) => {
  try {
    const fb = require('./services/facebook');
    const data = await fb.getAdvancedAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- Start Server ----------
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`[Shiine] Server running at http://localhost:${port}`);
    console.log(`[Shiine] HeyGen API Key: ${process.env.HEYGEN_API_KEY ? '✓ configured' : '✗ missing'}`);
  });
}

// Export for Vercel
module.exports = app;
