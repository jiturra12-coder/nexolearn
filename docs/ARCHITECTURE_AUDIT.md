# NexoLearn — Architecture Audit

Date: 2026-06-04
Auditor: Senior Staff Engineer (automated audit)

Summary
-------
This audit reviews the repository (API, DB schema, frontend) and covers domain model, database design, scalability, auth, realtime, credit economy, matching, performance, API and frontend architecture, technical debt, missing features, and production readiness. For each issue found I provide: Severity, Explanation, Impact, Proposed Fix.

1. Domain Model
----------------
- Issue: Implicit domain logic in API and DB (Severity: Medium)
  - Explanation: Core business rules (purchases, credit deductions, access checks) are split between `api/index.js` and DB policies/constraints. There is no single domain layer or domain object model.
  - Impact: Harder to reason about invariants, duplicate logic, risk of inconsistent behavior between API and DB.
  - Proposed Fix: Introduce a thin domain/service layer in the API (e.g., `services/purchases.js`, `services/courses.js`) that centralizes business rules and uses DB transactions for critical flows.

- Issue: Missing explicit matching algorithm implementation (Severity: Medium)
  - Explanation: Schema contains `matches` table but no algorithm code in the repo to produce matches.
  - Impact: Hard to validate matching behavior; reliance on external process or manual actions.
  - Proposed Fix: Add a `services/matching` module with a documented algorithm, configurable scoring, and scheduled runner (cron/job) along with tests.

2. Database Design
------------------
- Issue: RLS mostly correct but messaging privacy bug (Severity: High)
  - Explanation: `messages` had permissive SELECT policy allowing authenticated users to read other users' messages (documented in docs). Migration added to fix, but requires deployment.
  - Impact: High privacy breach risk; legal/compliance exposure.
  - Proposed Fix: Apply migration in production, add automated RLS policy tests (already added in `api/rls_policy_tests.sql`), and include RLS checks in CI.

- Issue: Concurrency on purchases/credits (Severity: High)
  - Explanation: `api/index.js` deducts credits with separate SELECT and UPDATE calls — not wrapped in a DB transaction or using `SELECT ... FOR UPDATE`.
  - Impact: Race conditions allow double-spend under concurrent purchases.
  - Proposed Fix: Move credit deduction and purchase insertion into a single DB transaction using `BEGIN`/`COMMIT` or use Supabase `rpc` stored procedures that atomically check and update balances.

- Issue: Missing FK or inconsistent conversation/message relationship checks in code (Severity: Medium)
  - Explanation: Schema includes `conversations` and `messages` with FK, but code does not enforce conversation membership when inserting messages (api lacks messaging endpoints). RLS migration addresses DB-level checks but API should also validate.
  - Impact: Incomplete server-side validation could be abused if DB policies are misconfigured.
  - Proposed Fix: Validate conversation membership server-side before inserting messages; keep DB policies as last line of defense.

- Issue: Index coverage (Severity: Low-Medium)
  - Explanation: Schema has sensible indexes (`idx_courses_published`, `idx_purchases_user`, etc.). Additional composite indexes may be needed for common queries (e.g., messages by conversation + created_at).
  - Impact: Potential query slowdown at scale.
  - Proposed Fix: Add composite indexes for heavy read patterns, monitor with query plan analysis.

3. Scalability
--------------
- Issue: No pagination or cursoring on list endpoints (Severity: High)
  - Explanation: Endpoints like `/courses` and `/transactions` return entire sets without pagination.
  - Impact: Memory/latency blowups as dataset grows.
  - Proposed Fix: Add limit/offset or cursor-based pagination to all list endpoints and enforce sensible defaults.

- Issue: No rate limiting / abuse controls (Severity: High)
  - Explanation: API exposes endpoints without throttle protections.
  - Impact: DOS / abuse / sudden traffic spikes can overwhelm DB/API.
  - Proposed Fix: Add rate-limiting middleware (IP/user-based) and API gateway protection; implement per-user quotas for expensive operations.

- Issue: Realtime scaling (Severity: Medium)
  - Explanation: Likely relies on Supabase realtime or database triggers. Realtime fan-out patterns not documented.
  - Impact: Large chat volumes could increase DB load; subscriptions must be sharded/scaled.
  - Proposed Fix: Use a managed realtime layer (Supabase Realtime with replication) or a message broker (Redis, Kafka) for heavy traffic; document fan-out strategy.

4. Authentication
-----------------
- Issue: Token validation and server usage of `SUPABASE_ANON_KEY` (Severity: High)
  - Explanation: `api/index.js` uses `process.env.SUPABASE_ANON_KEY` and calls `supabase.auth.getUser(token)`. Anon key is not suitable for server-side privileged operations.
  - Impact: Using anon key server-side can limit ability to perform admin operations securely and may leak misunderstanding of roles; also increases attack surface if misused.
  - Proposed Fix: Use service role key (server-only env var) for server-to-db privileged checks and reserve anon key only for client. Implement robust token verification via Supabase JWT verification libraries or use `auth.verify()` where available.

- Issue: Missing refresh / session handling and token expiry handling in API (Severity: Medium)
  - Explanation: `supabase.auth.getUser(token)` is used but no refresh flow or session management is present.
  - Impact: Token expiry may produce silent failures; UX issues on frontend.
  - Proposed Fix: Standardize token validation logic and return consistent 401 responses; implement refresh token handling or require client to refresh and resend tokens.

5. Authorization
----------------
- Issue: Role checks partly enforced in DB and API but inconsistent (Severity: Medium)
  - Explanation: DB enforces role constraints for creating courses; API uses `requireRole(['teacher','admin'])` for POST `/courses`. However, other endpoints rely on DB policies only.
  - Impact: Potential for duplicated checks or gaps; harder to audit end-to-end authorization.
  - Proposed Fix: Centralize authorization logic; keep RBAC mappings in a single source (e.g., `auth/roles.js`) and mirror necessary constraints in DB policies.

6. Realtime Messaging
---------------------
- Issue: Lack of messaging endpoints and client subscription logic in repo (Severity: Medium)
  - Explanation: Schema contains triggers and messages table, but no server-side messaging endpoints or front-end realtime subscription samples except likely Supabase usage in docs.
  - Impact: Hard to reason about real-time guarantees, delivery, ordering, and reconnection strategies.
  - Proposed Fix: Add a messaging service module to the frontend showing subscription usage, and document server-side publish/subscribe behavior; consider using serverless functions to validate messages before insert.

7. Credit Economy
-----------------
- Issue: Non-atomic credit operations (Severity: High)
  - Explanation: Purchase flow reads credits, updates balance, inserts transactions and purchases in multiple separate DB calls.
  - Impact: Double-spend, inconsistent records, incorrect balances under concurrency/failures.
  - Proposed Fix: Implement atomic purchase stored procedure (RPC) or use DB transaction in API; insert transaction row and purchase only on success; add compensation/rollback logic on failure.

- Issue: No scheduled reconciliations/audit (Severity: Medium)
  - Explanation: There is no mechanism to reconcile `credits` vs `transactions` totals.
  - Impact: Silent drift in balances due to bugs or manual DB changes.
  - Proposed Fix: Add daily reconciliation job that computes expected balances from transactions and alerts on drift.

8. Matching Engine
------------------
- Issue: No code for matching decisions (Severity: Medium)
  - Explanation: `matches` table exists but the algorithm to seed or update matches is absent.
  - Impact: Feature incomplete; heavy manual or ad-hoc processes required.
  - Proposed Fix: Implement a matching service with configurable scoring, offline batch jobs, or real-time triggers; include unit tests and explain data inputs.

9. Performance
--------------
- Issue: Unbounded queries and missing caching (Severity: High)
  - Explanation: API endpoints return entire datasets (e.g., `/courses`) with no caching layers.
  - Impact: High latency and increased DB load; poor cost profile.
  - Proposed Fix: Add caching for public lists (Redis or CDN), implement pagination, and apply appropriate TTLs.

- Issue: No observability (Severity: High)
  - Explanation: No logging, metrics, or tracing setup in repo.
  - Impact: Hard to diagnose issues and performance bottlenecks in production.
  - Proposed Fix: Integrate structured logging (e.g., pino/winston), add metrics (Prometheus/Datadog), and distribute tracing (OpenTelemetry).

10. API Design
--------------
- Issue: Minimal request validation and inconsistent error responses (Severity: Medium)
  - Explanation: Endpoints trust `req.body` with minimal checks; errors come from Supabase and are forwarded directly.
  - Impact: Unclear API contracts, potential injection or malformed data errors.
  - Proposed Fix: Add input validation with `zod`/Joi/express-validator, normalize error responses, and document API contract (OpenAPI spec).

- Issue: Lack of pagination, filtering, and versioning (Severity: Medium)
  - Explanation: APIs lack `limit`, `offset`, filters, or versioning headers.
  - Impact: Hard to evolve API safely; scaling limits.
  - Proposed Fix: Add query parameters for pagination and filtering; introduce API versioning (e.g., `/v1/`).

11. Frontend Architecture
------------------------
- Issue: Client-side auth and key exposure patterns (Severity: Medium)
  - Explanation: Frontend uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` — appropriate for anon flows — but there is a risk if server uses same key.
  - Impact: If server uses anon key, privileged operations could fail or leak.
  - Proposed Fix: Ensure server has `SUPABASE_SERVICE_ROLE_KEY` in env and frontend only uses `NEXT_PUBLIC` keys; validate usage across codebase.

- Issue: Mixed SSR/CSR decisions (Severity: Low-Medium)
  - Explanation: App uses client components for auth flows; Next.js 16 allows server components which could improve SEO and performance for certain routes.
  - Impact: Possible suboptimal performance and hydration cost.
  - Proposed Fix: Re-evaluate routes for server components (profile pages, public course lists) and adopt incremental static regeneration or server-side rendering where beneficial.

12. Technical Debt
------------------
- Issue: No tests, no CI integration (Severity: High)
  - Explanation: Repository lacks unit/integration tests and CI workflows.
  - Impact: Risky deployments and regressions.
  - Proposed Fix: Add GitHub Actions to run lint, unit tests, and DB policy tests; add a minimal test suite covering auth, purchase flow, and RLS.

- Issue: Sparse docs for operational runbooks (Severity: Medium)
  - Explanation: Docs are thorough for UI/HTML but missing runbook for deploy, backup, rollback, secrets.
  - Impact: Operational risk for on-call and SRE.
  - Proposed Fix: Add `DEPLOYMENT_RUNBOOK.md` with steps to migrate DB, rotate keys, rollback migrations, and environment variables.

13. Missing Features
--------------------
- Feature: Audit logging for admin actions (Severity: High)
  - Explanation: No audit trail for critical actions (credits changes, refunds).
  - Impact: Compliance and troubleshooting gaps.
  - Proposed Fix: Add `audit_logs` table and insert triggers or use application-level logging for admin actions.

- Feature: Admin moderation tools (Severity: Medium)
  - Explanation: No UI or API for admin to moderate content, resolve disputes, or inspect user data.
  - Impact: Operational difficulty as user base grows.
  - Proposed Fix: Add admin endpoints protected by RBAC, and an admin UI with audit and moderation workflows.

- Feature: Automated backups and retention policies (Severity: High)
  - Explanation: No repository automation or documented backup plan.
  - Impact: Data loss risk.
  - Proposed Fix: Configure automated DB backups and test restores; document retention and restore procedures.

14. Production Readiness
-----------------------
- Issue: Secrets and environment management (Severity: High)
  - Explanation: Repo uses environment variables but has no sample env or secret rotation guidance.
  - Impact: Onboarding friction and security risk.
  - Proposed Fix: Add `.env.example`, document env vars in `DEPLOYMENT_RUNBOOK.md`, and adopt secret storage (Vault/Azure Key Vault/GCP Secret Manager).

- Issue: No CI/CD workflow or deployment scripts (Severity: High)
  - Explanation: Scripts and manifests for deploying frontend/backend are missing.
  - Impact: Manual deployments, inconsistent environments.
  - Proposed Fix: Add GitHub Actions workflows: build/test/publish for frontend and backend, and automated migrations run on deploy.

Scores
------
- Architecture Score: 72/100
  - Rationale: Clear domain and schema present; API and frontend are simple and coherent. Missing pieces (atomic operations, pagination, observability) lower the score.
- Security Score: 78/100
  - Rationale: RLS is used extensively and reviewed; however, messaging privacy bug and key usage weaken the posture.
- Scalability Score: 65/100
  - Rationale: Good starting schema and indexes, but lack of pagination, rate-limiting, and caching are limiting at scale.
- Production Readiness Score: 58/100
  - Rationale: Missing CI, backups, monitoring, atomic DB transactions, and runbooks reduce readiness.

Top 20 Priorities (ordered by business impact)
---------------------------------------------
1. Fix messages RLS in production and verify immediately (privacy breach) — Critical
2. Make purchase/credits atomic (DB transaction or RPC) to prevent double-spend — Critical
3. Add automated RLS policy tests to CI — Critical
4. Add pagination and limits to all list endpoints (courses, messages, transactions) — High
5. Add rate-limiting and abuse protections (API gateway, middleware) — High
6. Use server-only Supabase Service Role key for backend privileged ops; remove anon key server use — High
7. Implement logging, metrics, and tracing (observability) — High
8. Add DB backups and tested restore procedure — High
9. Add unit/integration tests and CI workflows (lint, tests, migrations) — High
10. Implement caching for public lists (Redis/CDN) — Medium-High
11. Add reconciliation job for credits vs transactions — Medium-High
12. Implement matching service and tests — Medium
13. Add admin audit logs and moderation endpoints — Medium
14. Harden API request validation and consistent error format + OpenAPI spec — Medium
15. Add composite DB indexes for heavy query patterns after profiling — Medium
16. Document and standardize auth token flow and refresh handling — Medium
17. Add message delivery guarantees docs, and implement server-side validation for message insertion — Medium
18. Introduce server components or SSR for public pages where appropriate — Low-Medium
19. Add feature flags and API versioning strategy — Low-Medium
20. Implement CI job to run `api/rls_policy_tests.sql` and fast smoke tests on deploy — Medium

Appendix — Quick Actions
------------------------
- Apply migration: `psql "$DATABASE_URL" -f api/migrations/2026-06-04-fix-messages-rls.sql` or paste into Supabase SQL editor.
- Run policy tests: `psql "$DATABASE_URL" -f api/rls_policy_tests.sql`.
- Add a minimal GitHub Actions workflow to execute the tests and run Node lints/tests on PRs.

References
----------
- API entry: `api/index.js`
- DB schema: `api/schema.sql`
- RLS review: `docs/RLS_SECURITY_REVIEW.md`
- Migration added: `api/migrations/2026-06-04-fix-messages-rls.sql`
- RLS tests: `api/rls_policy_tests.sql`
- Checklist: `docs/RLS_CHECKLIST.md`

If you want I can now:
- Create a GitHub Actions workflow to run `api/rls_policy_tests.sql` on PRs and after merges, and run lint/test/build steps; or
- Implement the atomic purchase RPC and update `api/index.js` to call it and add tests.
