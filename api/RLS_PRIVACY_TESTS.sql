-- RLS Privacy Testing Queries
-- Run these tests to verify that the privacy fixes work correctly
-- All queries should return 0 results for regular users (privacy intact)

-- ===========================================
-- TEST 1: Messages Privacy Verification
-- ===========================================

-- Test: Can User A see User B's messages?
-- Expected: 0 rows (should not see other users' messages)
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

-- ===========================================
-- TEST 2: Conversation Access Control
-- ===========================================

-- Test: Can users see conversations they're not part of?
-- Expected: 0 rows
SELECT
  'TEST 2 - Conversation access control' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Access control working'
       ELSE '❌ FAIL - Unauthorized access detected' END as result
FROM conversations c
WHERE (c.user1_id != auth.uid() AND c.user2_id != auth.uid())
  AND auth.uid() IS NOT NULL;

-- ===========================================
-- TEST 3: Profile Privacy
-- ===========================================

-- Test: Can users view other users' sensitive profile data?
-- Expected: 0 rows (should only see own profile)
SELECT
  'TEST 3 - Profile privacy' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Profile privacy intact'
       ELSE '❌ FAIL - Profile data leakage' END as result
FROM profiles p
WHERE p.id != auth.uid()
  AND auth.uid() IS NOT NULL
  AND p.email IS NOT NULL; -- Only count profiles with data

-- ===========================================
-- TEST 4: Purchase History Privacy
-- ===========================================

-- Test: Can users see other users' purchase history?
-- Expected: 0 rows
SELECT
  'TEST 4 - Purchase privacy' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Purchase privacy intact'
       ELSE '❌ FAIL - Purchase data leakage' END as result
FROM purchases p
WHERE p.user_id != auth.uid()
  AND auth.uid() IS NOT NULL;

-- ===========================================
-- TEST 5: Credit Balance Privacy
-- ===========================================

-- Test: Can users see other users' credit balances?
-- Expected: 0 rows
SELECT
  'TEST 5 - Credit privacy' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Credit privacy intact'
       ELSE '❌ FAIL - Credit data leakage' END as result
FROM credits c
WHERE c.user_id != auth.uid()
  AND auth.uid() IS NOT NULL;

-- ===========================================
-- TEST 6: Transaction History Privacy
-- ===========================================

-- Test: Can users see other users' transaction history?
-- Expected: 0 rows
SELECT
  'TEST 6 - Transaction privacy' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Transaction privacy intact'
       ELSE '❌ FAIL - Transaction data leakage' END as result
FROM transactions t
WHERE t.user_id != auth.uid()
  AND auth.uid() IS NOT NULL;

-- ===========================================
-- TEST 7: Match Privacy
-- ===========================================

-- Test: Can users see matches they're not involved in?
-- Expected: 0 rows
SELECT
  'TEST 7 - Match privacy' as test_name,
  COUNT(*) as violations,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS - Match privacy intact'
       ELSE '❌ FAIL - Match data leakage' END as result
FROM matches m
WHERE (m.user1_id != auth.uid() AND m.user2_id != auth.uid())
  AND auth.uid() IS NOT NULL;

-- ===========================================
-- TEST 8: Course Content Access Control
-- ===========================================

-- Test: Can users access course content they haven't purchased?
-- Expected: 0 rows (unless they're the creator)
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
-- COMPREHENSIVE PRIVACY TEST SUMMARY
-- ===========================================

-- Run this query to get a complete privacy test report
SELECT
  'RLS PRIVACY TEST SUMMARY' as report_title,
  CURRENT_TIMESTAMP as test_timestamp,
  auth.uid() as current_user_id,
  (
    SELECT COUNT(*) FROM messages m
    WHERE m.user_id != auth.uid()
      AND auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = m.conversation_id
        AND (c.user1_id != auth.uid() AND c.user2_id != auth.uid())
      )
  ) as message_privacy_violations,
  (
    SELECT COUNT(*) FROM conversations c
    WHERE (c.user1_id != auth.uid() AND c.user2_id != auth.uid())
      AND auth.uid() IS NOT NULL
  ) as conversation_access_violations,
  (
    SELECT COUNT(*) FROM profiles p
    WHERE p.id != auth.uid() AND auth.uid() IS NOT NULL
  ) as profile_privacy_violations,
  (
    SELECT COUNT(*) FROM purchases p
    WHERE p.user_id != auth.uid() AND auth.uid() IS NOT NULL
  ) as purchase_privacy_violations,
  (
    SELECT COUNT(*) FROM credits c
    WHERE c.user_id != auth.uid() AND auth.uid() IS NOT NULL
  ) as credit_privacy_violations,
  (
    SELECT COUNT(*) FROM transactions t
    WHERE t.user_id != auth.uid() AND auth.uid() IS NOT NULL
  ) as transaction_privacy_violations,
  (
    SELECT COUNT(*) FROM matches m
    WHERE (m.user1_id != auth.uid() AND m.user2_id != auth.uid())
      AND auth.uid() IS NOT NULL
  ) as match_privacy_violations,
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
  ) = 0 THEN '🎉 ALL TESTS PASSED - Privacy Fully Protected'
       ELSE '⚠️  PRIVACY ISSUES DETECTED - Review Required' END as overall_status;

-- ===========================================
-- MANUAL TESTING INSTRUCTIONS
-- ===========================================

/*
MANUAL TESTING STEPS:

1. Create two test user accounts (User A and User B)
2. Have User A send messages to User B
3. Login as User A and verify they can see their conversation with User B
4. Login as User C (different user) and verify they CANNOT see User A and B's messages
5. Test all other privacy boundaries (profiles, purchases, etc.)

EXPECTED RESULTS:
- Users should only see their own data
- Users should only see conversations they're part of
- Users should only see messages in their conversations
- All privacy test queries should return 0 violations

If any test fails, there is a privacy breach that needs immediate fixing.
*/