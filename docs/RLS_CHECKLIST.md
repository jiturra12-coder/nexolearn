# RLS Checklist — Messages & Conversations (quick actions)

Follow these steps to apply the migration and validate message privacy.

1) Apply migration
- Open Supabase SQL editor (or connect via psql) and run:

```sql
-- Run the migration file content: api/migrations/2026-06-04-fix-messages-rls.sql
\i path/to/api/migrations/2026-06-04-fix-messages-rls.sql
```

2) Verify policies exist and no permissive policy remains
- Run the test queries in `api/rls_policy_tests.sql` (see below). Expected: zero permissive policies, SELECT/INSERT/DELETE policies present.

3) Functional test (manual)
- Create two test users (A and B) and a conversation between them.
- As User A: insert a message into that conversation — should succeed.
- As User B: fetch messages for that conversation — should return messages.
- As an unrelated user C: fetching messages for that conversation should return empty / 0 rows.

4) CI / Automated (optional)
- Add the SQL checks from `api/rls_policy_tests.sql` to your CI pipeline using the Supabase SQL API or psql with a service role user that can read pg_policies.

5) Post-checks
- Confirm RLS is enabled on `messages` and `conversations` (ALTER TABLE ... ENABLE ROW LEVEL SECURITY).
- Confirm no policies grant broad SELECT to authenticated users.

Notes:
- Running the functional test requires executing queries in the context of an authenticated user (use Supabase Auth JWTs or the SQL editor logged as that user). The policy tests in `api/rls_policy_tests.sql` validate the presence/shape of policies and can be run by a database admin.
