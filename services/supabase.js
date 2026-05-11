const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing credentials. Supabase integration will be disabled.');
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Save a new video generation record
 */
async function saveVideo(videoData) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('videos')
    .insert([{
      video_id: videoData.videoId,
      avatar_id: videoData.avatarId,
      voice_id: videoData.voiceId,
      script: videoData.script,
      status: 'processing',
      created_at: new Date()
    }])
    .select();

  if (error) {
    console.error('[Supabase] Error saving video:', error.message);
    return null;
  }
  return data[0];
}

/**
 * Update video status and URL
 */
async function updateVideoStatus(videoId, status, videoUrl = null) {
  if (!supabase) return null;

  const updateData = { status };
  if (videoUrl) updateData.video_url = videoUrl;

  const { data, error } = await supabase
    .from('videos')
    .update(updateData)
    .eq('video_id', videoId)
    .select();

  if (error) {
    console.error('[Supabase] Error updating video status:', error.message);
    return null;
  }
  return data[0];
}

module.exports = {
  supabase,
  saveVideo,
  updateVideoStatus
};
