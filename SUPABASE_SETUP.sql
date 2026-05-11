-- Create a table for tracking HeyGen videos
CREATE TABLE IF NOT EXISTS videos (
    id BIGSERIAL PRIMARY KEY,
    video_id TEXT UNIQUE NOT NULL,
    avatar_id TEXT,
    voice_id TEXT,
    script TEXT,
    status TEXT DEFAULT 'processing',
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (optional but recommended)
-- ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Allow public read (optional, depends on your use case)
-- CREATE POLICY "Public Access" ON videos FOR SELECT USING (true);
