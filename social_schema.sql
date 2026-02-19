-- =====================================================
-- ClubSpace — Social Schema (Follows, Notifications)
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Follows Table
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')), -- 'pending' for private accounts logic later
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- 2. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Who receives the notification
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Who triggered it (optional, e.g. system msg)
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'system')),
  title TEXT,
  message TEXT NOT NULL,
  resource_id UUID, -- Link to post_id or other resource
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;

-- 4. RLS for Follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Everyone can read who follows who (for public profiles)
CREATE POLICY "Public follows view"
  ON follows FOR SELECT
  USING (true);

-- Users can follow others
CREATE POLICY "Users can follow"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- 5. RLS for Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System or triggers insert notifications (usually via server-side or triggers, but allowing insert for now for client actions like likes triggering notifs if simpler)
-- Better approach: Database Triggers. For now, let's allow authenticated users to insert notifications to others (e.g. "User A liked User B's post").
-- A stricter policy would be: auth.uid() = actor_id
CREATE POLICY "Users can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- 6. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 7. Trigger to auto-notify on follow
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, title, message, resource_id)
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow',
    'New Follower',
    'started following you',
    NEW.follower_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_follow_created
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_follow();
