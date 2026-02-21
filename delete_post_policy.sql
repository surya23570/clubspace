-- Add RLS policy to allow users to delete their own posts
-- This ensures that only the creator of the post can delete it.

-- First, enable RLS on the posts table if it isn't already (it should be, but just to be safe)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it already exists to avoid errors when re-running
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- Create the policy
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);
