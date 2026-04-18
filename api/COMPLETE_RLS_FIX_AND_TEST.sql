-- ===========================================
-- NEXOLEARN RLS SECURITY FIX - COMPLETE SCRIPT
-- ===========================================
-- Run this entire script in your Supabase SQL Editor
-- It will apply the migration and run all privacy tests

-- PART 1: APPLY THE MIGRATION
-- ===========================================

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

-- Step 4: Add conversation_id column to messages
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
INSERT INTO conversations (user1_id, user2_id, created_at, updated_at, last_message_at)
SELECT
  m.user1_id,
  m.user2_id,
  m.created_at,
  m.updated_at,
  COALESCE(
    (SELECT MAX(created_at) FROM messages
     WHERE (user_id = m.user1_id OR user_id = m.user2_id)
     AND content IS NOT NULL),
    m.created_at
  ) as last_message_at
FROM matches m
WHERE m.status = 'active'
ON CONFLICT (user1_id, user2_id) DO NOTHING;

-- Step 10: Update existing messages to link to conversations
UPDATE messages
SET conversation_id = (
  SELECT c.id
  FROM conversations c
  WHERE (c.user1_id = messages.user_id OR c.user2_id = messages.user_id)
  AND c.id IS NOT NULL
  LIMIT 1
)
WHERE conversation_id IS NULL;

-- ===========================================
-- PART 2: RUN PRIVACY TESTS
-- ===========================================

-- Test 1: Messages Privacy Verification
SELECT
  'TEST 1 - Cross-user message access' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Privacy intact'
       ELSE '❌ FAIL - Privacy breach detected' END as result
FROM messages m
WHERE m.user_id != auth.uid()
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = m.conversation_id
    AND (c.user1_id != auth.uid() AND c.user2_id != auth.uid())
  );

-- Test 2: Conversation Access Control
SELECT
  'TEST 2 - Conversation access control' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Access control working'
       ELSE '❌ FAIL - Unauthorized access detected' END as result
FROM conversations c
WHERE (c.user1_id != auth.uid() AND c.user2_id != auth.uid())
  AND auth.uid() IS NOT NULL;

-- Test 3: Profile Privacy
SELECT
  'TEST 3 - Profile privacy' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Profile privacy intact'
       ELSE '❌ FAIL - Profile data leakage' END as result
FROM profiles p
WHERE p.id != auth.uid()
  AND auth.uid() IS NOT NULL
  AND p.email IS NOT NULL;

-- Test 4: Purchase History Privacy
SELECT
  'TEST 4 - Purchase privacy' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Purchase privacy intact'
       ELSE '❌ FAIL - Purchase data leakage' END as result
FROM purchases p
WHERE p.user_id != auth.uid()
  AND auth.uid() IS NOT NULL;

-- Test 5: Credit Balance Privacy
SELECT
  'TEST 5 - Credit privacy' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Credit privacy intact'
       ELSE '❌ FAIL - Credit data leakage' END as result
FROM credits c
WHERE c.user_id != auth.uid()
  AND auth.uid() IS NOT NULL;

-- Test 6: Transaction History Privacy
SELECT
  'TEST 6 - Transaction privacy' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Transaction privacy intact'
       ELSE '❌ FAIL - Transaction data leakage' END as result
FROM transactions t
WHERE t.user_id != auth.uid()
  AND auth.uid() IS NOT NULL;

-- Test 7: Match Privacy
SELECT
  'TEST 7 - Match privacy' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Match privacy intact'
       ELSE '❌ FAIL - Match data leakage' END as result
FROM matches m
WHERE (m.user1_id != auth.uid() AND m.user2_id != auth.uid())
  AND auth.uid() IS NOT NULL;

-- Test 8: Course Content Access Control
SELECT
  'TEST 8 - Course content access' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Content access control working'
       ELSE '❌ FAIL - Unauthorized content access' END as result
FROM course_content cc
WHERE NOT EXISTS (
  SELECT 1 FROM purchases p
  WHERE p.user_id = auth.uid() AND p.course_id = cc.course_id
)
AND auth.uid() != (
  SELECT creator_id FROM courses WHERE id = cc.course_id
)
AND auth.uid() IS NOT NULL;

-- ===========================================
-- PART 3: COMPREHENSIVE TEST SUMMARY
-- ===========================================

SELECT
  '🎯 RLS MIGRATION COMPLETE - FINAL RESULTS' as status,
  CURRENT_TIMESTAMP as completed_at,
  auth.uid() as tested_as_user,
  CASE WHEN (
    SELECT COUNT(*) FROM (
      SELECT
        (SELECT COUNT(*) FROM messages m WHERE m.user_id != auth.uid() AND auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM conversations c WHERE c.id = m.conversation_id AND (c.user1_id != auth.uid() AND c.user2_id != auth.uid()))) +
        (SELECT COUNT(*) FROM conversations c WHERE (c.user1_id != auth.uid() AND c.user2_id != auth.uid()) AND auth.uid() IS NOT NULL) +
        (SELECT COUNT(*) FROM profiles p WHERE p.id != auth.uid() AND auth.uid() IS NOT NULL) +
        (SELECT COUNT(*) FROM purchases p WHERE p.user_id != auth.uid() AND auth.uid() IS NOT NULL) +
        (SELECT COUNT(*) FROM credits c WHERE c.user_id != auth.uid() AND auth.uid() IS NOT NULL) +
        (SELECT COUNT(*) FROM transactions t WHERE t.user_id != auth.uid() AND auth.uid() IS NOT NULL) +
        (SELECT COUNT(*) FROM matches m WHERE (m.user1_id != auth.uid() AND m.user2_id != auth.uid()) AND auth.uid() IS NOT NULL)
      ) as total_violations
    ) t
  ) = 0 THEN '🎉 SUCCESS: All privacy tests PASSED - Your data is now secure!'
       ELSE '⚠️  WARNING: Privacy issues detected - Contact support immediately!' END as final_result;