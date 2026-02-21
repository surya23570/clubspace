-- Fix for Blocked Profiles Visibility Issue
-- If a user blocks another user, they should not be able to see each other's profiles.
-- Previously, this was a PERMISSIVE policy, which meant it got bypassed by other "public" policies.
-- By making it RESTRICTIVE, it ensures blocked users are ALWAYs hidden, regardless of other policies.

DROP POLICY IF EXISTS "Hide blocked profiles" ON profiles;

CREATE POLICY "Hide blocked profiles"
  ON profiles AS RESTRICTIVE FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = id) -- I blocked them
         OR (blocker_id = id AND blocked_id = auth.uid()) -- They blocked me
    )
  );

-- Also ensure the same for posts just in case it wasn't restrictive
DROP POLICY IF EXISTS "Hide posts from blocked users" ON posts;

CREATE POLICY "Hide posts from blocked users"
  ON posts AS RESTRICTIVE FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = user_id) -- I blocked post author
         OR (blocker_id = user_id AND blocked_id = auth.uid()) -- Post author blocked me
    )
  );
