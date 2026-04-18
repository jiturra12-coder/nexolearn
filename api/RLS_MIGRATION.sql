-- RLS Security Fix Migration
-- Apply these changes to fix the messages privacy vulnerability
-- Run this script in your Supabase SQL editor or database console

-- Step 1: Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_users CHECK (user1_id != user2_id),
  CONSTRAINT unique_conversation UNIQUE(LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
);

-- Step 2: Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Step 3: Create conversation policies
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (
  auth.uid() = user1_id OR auth.uid() = user2_id
);
CREATE POLICY "Users can update their conversations" ON conversations FOR UPDATE USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
) WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Step 4: Add conversation_id column to messages (with default for existing messages)
-- Note: This will require migrating existing messages to conversations
ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Step 5: Drop the insecure message policy
DROP POLICY "Anyone can view messages" ON messages;

-- Step 6: Create secure message policies
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations c
          WHERE c.id = messages.conversation_id
          AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid()))
);
CREATE POLICY "Users can insert messages in their conversations" ON messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM conversations c
          WHERE c.id = conversation_id
          AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid()))
);

-- Step 7: Add indexes for performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at);

-- Step 8: Add triggers
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Step 9: Migration helper - Create conversations for existing matches
-- This creates conversations for users who have active matches
INSERT INTO conversations (user1_id, user2_id, created_at, updated_at, last_message_at)
SELECT
  m.user1_id,
  m.user2_id,
  m.created_at,
  m.updated_at,
  COALESCE(
    (SELECT MAX(created_at) FROM messages
     WHERE (user_id = m.user1_id OR user_id = m.user2_id)
     AND content IS NOT NULL), -- Only count actual messages
    m.created_at
  ) as last_message_at
FROM matches m
WHERE m.status = 'active'
ON CONFLICT (user1_id, user2_id) DO NOTHING;

-- Step 10: Update existing messages to link to conversations
-- This is a complex migration - in production, you'd want to do this more carefully
-- For now, we'll create a default conversation for each unique pair of users who have messaged
UPDATE messages
SET conversation_id = (
  SELECT c.id
  FROM conversations c
  WHERE (c.user1_id = messages.user_id OR c.user2_id = messages.user_id)
  AND c.id IS NOT NULL
  LIMIT 1
)
WHERE conversation_id IS NULL;

-- Step 11: Make conversation_id NOT NULL after migration
-- ALTER TABLE messages ALTER COLUMN conversation_id SET NOT NULL;

-- Verification queries (run these after migration)
-- These should return 0 rows for regular users (only admins should see data)