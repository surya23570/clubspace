-- =====================================================
-- ClubSpace — Blocking System
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Blocks Table
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

-- 3. RLS for Blocks Table
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Users can see who they blocked
DROP POLICY IF EXISTS "Users view their own blocks" ON blocks;
CREATE POLICY "Users view their own blocks"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can block others
DROP POLICY IF EXISTS "Users can block" ON blocks;
CREATE POLICY "Users can block"
  ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
DROP POLICY IF EXISTS "Users can unblock" ON blocks;
CREATE POLICY "Users can unblock"
  ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- =====================================================
-- 4. RLS Updates for Other Tables (Mutual Invisibility)
-- =====================================================

-- NOTE: We must ensure recursive policies don't crash. 
-- For simple blocked lists, it's usually fine.

-- PROFILES: Hide blocked users from each other
-- (User A cannot see User B if A blocked B OR B blocked A)
DROP POLICY IF EXISTS "Hide blocked profiles" ON profiles;
CREATE POLICY "Hide blocked profiles"
  ON profiles FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = id) -- I blocked them
         OR (blocker_id = id AND blocked_id = auth.uid()) -- They blocked me
    )
  );

-- POSTS: Hide posts from blocked users
DROP POLICY IF EXISTS "Hide posts from blocked users" ON posts;
CREATE POLICY "Hide posts from blocked users"
  ON posts FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = user_id) -- I blocked post author
         OR (blocker_id = user_id AND blocked_id = auth.uid()) -- Post author blocked me
    )
  );

-- COMMENTS/REACTIONS: Same logic if needed, but usually Posts visibility handles the bulk.
-- Let's add it for Reactions to be safe.
DROP POLICY IF EXISTS "Hide reactions from blocked users" ON reactions;
CREATE POLICY "Hide reactions from blocked users"
  ON reactions FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = user_id)
         OR (blocker_id = user_id AND blocked_id = auth.uid())
    )
  );

-- MESSAGES: 
-- Should already be handled by UI logic, but for RLS:
-- Users shouldn't receive messages from people they blocked.
-- (This might be tricky if we want to keep old chats visible but inactive. 
-- Instagram hides the thread entirely or moves it to 'Blocked Accounts' requests. 
-- For now, let's NOT apply RLS to messages table strictly to avoid breaking `getConversations` 
-- if we want to show "Blocked User" in the list. We handle this in App logic.)

-- 5. Helper Function to Force Unfollow
CREATE OR REPLACE FUNCTION handle_block_side_effects()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete follows in both directions
  DELETE FROM follows 
  WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
     OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_block_created
  AFTER INSERT ON blocks
  FOR EACH ROW
  EXECUTE FUNCTION handle_block_side_effects();

-- 6. Trigger to Prevent Follows if Blocked
CREATE OR REPLACE FUNCTION prevent_blocked_follows()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = NEW.follower_id AND blocked_id = NEW.following_id)
       OR (blocker_id = NEW.following_id AND blocked_id = NEW.follower_id)
  ) THEN
    RAISE EXCEPTION 'Cannot follow this user due to a block.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_blocks_before_follow ON follows;
CREATE TRIGGER check_blocks_before_follow
  BEFORE INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION prevent_blocked_follows();
