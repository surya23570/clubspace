-- Add is_private column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Ensure follows table has correct constraints if not already set
-- (The original schema had status check, but let's make sure we can handle 'pending')

-- If the constraint "follows_status_check" exists, we might need to drop and recreate it if it didn't include 'pending'
-- But the original schema had: CHECK (status IN ('pending', 'accepted'))
-- So it should be fine. If you authored it differently before, run:
-- ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_status_check;
-- ALTER TABLE follows ADD CONSTRAINT follows_status_check CHECK (status IN ('pending', 'accepted'));

-- Create/Update Policies for Private Profiles

-- 1. "Public follows view": 
-- Modified to: users can see who follows whom ONLY IF:
--   a) The user being followed is public
--   b) OR the viewer is the follower
--   c) OR the viewer is the followed user
--   d) OR the viewer is already following the user (accepted) -- complex to check in RLS without recursion/perf hit
-- For now, let's keep "Public follows view" as is (public visibility of graph), 
-- OR restrict if strict privacy is needed.
-- Let's stick to the plan: simple private/public switch. 
-- Privacy usually means:
-- - Non-followers cannot see posts of private user.
-- - Non-followers cannot see followers/following list of private user (optional).

-- Let's update Posts policy if you have one (not in this file, but conceptually):
-- POLICY "Anyone can view posts" -> needs to adhere to privacy.

-- For this task, we focus on the Follow Request Flow mechanism.

-- 2. Update "Users can follow" policy?
-- No, 'insert' is fine. The API logic will determine if it's 'pending' or 'accepted'.

-- 3. We need a policy for 'update' on follows table (to Accept requests)
CREATE POLICY "Users can update follow status"
ON follows
FOR UPDATE
USING (auth.uid() = following_id) -- The person being followed can accept
WITH CHECK (auth.uid() = following_id);

-- 4. Delete policy (Unfollow / Reject / Cancel)
-- Existing: 'Users can unfollow' (auth.uid() = follower_id)
-- We need: 'Users can remove follower' (auth.uid() = following_id)
CREATE POLICY "Users can remove follower"
ON follows
FOR DELETE
USING (auth.uid() = following_id);
