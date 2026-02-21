-- =====================================================
-- ClubSpace Security Audit Fixes
-- Run this in your Supabase SQL Editor
-- This script fixes critical vulnerabilities identified in the audit.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. BLOCKS TABLE FIXES
--    Consolidate policies, enforce auth.uid() = blocker_id
-- =====================================================
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Drop all existing block policies to prevent OR'ing conflicts
DROP POLICY IF EXISTS "Users view their own blocks" ON blocks;
DROP POLICY IF EXISTS "Users can view their blocks" ON blocks;
DROP POLICY IF EXISTS "Users can block" ON blocks;
DROP POLICY IF EXISTS "Users can block others" ON blocks;
DROP POLICY IF EXISTS "Users can unblock" ON blocks;

-- Create minimal, strict policies
CREATE POLICY "Users can view their blocks" 
  ON blocks FOR SELECT 
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others" 
  ON blocks FOR INSERT 
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock" 
  ON blocks FOR DELETE 
  USING (auth.uid() = blocker_id);

-- =====================================================
-- 2. MESSAGES & CONVERSATIONS FIXES
--    Prevent injection, snooping, and hijacking
-- =====================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- SELECT (Snooping fix)
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
CREATE POLICY "Users can view messages in own conversations" 
  ON messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- INSERT (Injection fix)
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" 
  ON messages FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- UPDATE (Hijack fix)
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages" 
  ON messages FOR UPDATE 
  USING (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- =====================================================
-- 3. FOLLOWS TABLE FIXES
--    Add missing delete policies, strict insert
-- =====================================================
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can follow" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;
DROP POLICY IF EXISTS "Users can remove follower" ON follows;

-- Insert (Forced follow fix)
CREATE POLICY "Users can follow" 
  ON follows FOR INSERT 
  WITH CHECK (auth.uid() = follower_id);

-- Unfollow (I am the follower, I want to stop following them)
CREATE POLICY "Users can unfollow" 
  ON follows FOR DELETE 
  USING (auth.uid() = follower_id);

-- Remove follower (They are the follower, I want to force them to stop following me)
CREATE POLICY "Users can remove follower" 
  ON follows FOR DELETE 
  USING (auth.uid() = following_id);

-- =====================================================
-- 4. PRIVACY SYSTEM FIXES
--    Use AS RESTRICTIVE to prevent OR'ing bypass
-- =====================================================

-- PROFILES
DROP POLICY IF EXISTS "Hide blocked profiles" ON profiles;
CREATE POLICY "Hide blocked profiles" 
  ON profiles AS RESTRICTIVE FOR SELECT 
  USING (
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = id)
         OR (blocker_id = id AND blocked_id = auth.uid())
    )
  );

-- POSTS
DROP POLICY IF EXISTS "Hide posts from blocked users" ON posts;
CREATE POLICY "Hide posts from blocked users" 
  ON posts AS RESTRICTIVE FOR SELECT 
  USING (
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = user_id)
         OR (blocker_id = user_id AND blocked_id = auth.uid())
    )
  );

-- REACTIONS
DROP POLICY IF EXISTS "Hide reactions from blocked users" ON reactions;
CREATE POLICY "Hide reactions from blocked users" 
  ON reactions AS RESTRICTIVE FOR SELECT 
  USING (
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = user_id)
         OR (blocker_id = user_id AND blocked_id = auth.uid())
    )
  );

COMMIT;
