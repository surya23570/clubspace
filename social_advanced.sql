-- =====================================================
-- ClubSpace — Social Advanced Schema (Blocks, Messaging)
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Blocks Table
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- RLS for Blocks
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their blocks"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
  ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
  ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);


-- 2. Update Messages Table (Rich Media & Replies)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'audio', 'post')),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id);


-- 3. Update Conversations Table (Requests & Deletion)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'request')),
ADD COLUMN IF NOT EXISTS deleted_for UUID[] DEFAULT '{}';

-- 4. Block Check Logic (Optional View to easily filter blocked content)
CREATE OR REPLACE VIEW visible_posts AS
SELECT p.*
FROM posts p
WHERE 
  NOT EXISTS (SELECT 1 FROM blocks b WHERE b.blocker_id = auth.uid() AND b.blocked_id = p.user_id) -- I blocked them
  AND 
  NOT EXISTS (SELECT 1 FROM blocks b WHERE b.blocker_id = p.user_id AND b.blocked_id = auth.uid()); -- They blocked me
