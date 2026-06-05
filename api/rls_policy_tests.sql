-- RLS policy tests (queryable by a DB admin / CI using service-role access)
-- Run these in the Supabase SQL editor or via psql as a privileged user.

-- 1) Ensure no permissive 'Anyone can view messages' policy exists
SELECT count(*) AS bad_policy_count
FROM pg_policies
WHERE tablename = 'messages' AND polname = 'Anyone can view messages';

-- Expected: 0

-- 2) Ensure there is at least one SELECT policy that references conversations or auth.uid()
SELECT count(*) AS select_policies
FROM pg_policies
WHERE tablename = 'messages'
  AND polcmd = 'r'
  AND (polqual ILIKE '%conversations%' OR polqual ILIKE '%conversation_id%' OR polqual ILIKE '%auth.uid()%');

-- Expected: >= 1

-- 3) Ensure INSERT policy enforces authenticated user / conversation membership
SELECT count(*) AS insert_policies
FROM pg_policies
WHERE tablename = 'messages'
  AND polcmd = 'a'
  AND (polqual ILIKE '%auth.uid()%'
       OR polwithcheck ILIKE '%auth.uid()%'
       OR polqual ILIKE '%conversation_id%'
       OR polwithcheck ILIKE '%conversation_id%');

-- Expected: >= 1

-- 4) Verify RLS is enabled on messages
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'messages';

-- Expected: relrowsecurity = true

-- 5) (Optional) List all policies on messages for manual review
SELECT polname, polcmd, polqual, polwithcheck
FROM pg_policies
WHERE tablename = 'messages';

-- Use the results above to confirm there is no policy that allows all authenticated users to read messages.
