-- Migration: Fix messages RLS policies (2026-06-04)
-- Purpose: remove any overly-permissive policies and ensure conversation-based access
-- Run this in your Supabase SQL editor or psql connected to the database.

-- Drop any legacy permissive policy if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND polname = 'Anyone can view messages') THEN
    EXECUTE 'DROP POLICY "Anyone can view messages" ON messages';
  END IF;
END$$;

-- Drop any other generic policy that grants ALL authenticated users SELECT on messages
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT polname FROM pg_policies WHERE tablename = 'messages' AND polcmd = 'r' LOOP
    -- if the policy qualification is empty (allows all), drop it
    IF (SELECT polqual FROM pg_policies WHERE tablename='messages' AND polname = r.polname) IS NULL THEN
      EXECUTE format('DROP POLICY %I ON messages', r.polname);
    END IF;
  END LOOP;
END$$;

-- Create strict SELECT policy: only participants in the conversation can read messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  USING (
    -- user is the sender
    auth.uid() = user_id
    OR
    -- user belongs to the conversation
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- Create INSERT policy: only conversation participants may insert messages and user_id must be the authenticated user
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
CREATE POLICY "Users can insert their own messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- Create DELETE policy: only message owner can delete their own messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
CREATE POLICY "Users can delete their own messages"
  ON messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Optionally, restrict UPDATE if your app allows editing messages
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- End migration
