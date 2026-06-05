# NexoLearn — Project Status

**Audit date:** 2026-06-04  
**Auditor role:** Lead Software Architect (read-only audit)  
**Repository:** `C:\Users\jitur\Nexolearn`

This document reflects the state of the codebase and documentation as found in the repository. No code was modified during this audit.

---

## Executive summary

NexoLearn is in an **early Sprint 1 / foundation** stage. The **canonical target stack** is a pnpm + Turbo monorepo (`apps/web` + `apps/api`) with NestJS, Prisma, PostgreSQL, and Supabase Auth, aligned to extensive MVP docs (`BUILD_PLAN_V1.md`, `MVP_V1_SCOPE.md`, etc.).

The repo also contains **legacy parallel implementations** (`frontend/`, `api/`) built around a **course marketplace + credits** model (`api/schema.sql`, `api/index.js`) that diverges from the reciprocal-exchange MVP in `apps/*`.

**Overall MVP product completion: ~14%** (see methodology in §1). Architecture and planning docs are far ahead of runnable, integrated product.

---

## 1. Current completion percentage

| Layer | Estimated completion | Notes |
|--------|----------------------|--------|
| Product (MVP V1 scope) | **~14%** | 11 MVP pillars; only auth/profile scaffolding partially works |
| Sprint 1 (Foundation) | **~65%** | Scaffold present; E2E auth→profile path broken |
| Documentation / design | **~85%** | Large doc set; not fully reflected in code |
| Legacy `api/` + `frontend/` | **~25%** | Separate product slice; not wired to monorepo |
| Production readiness | **~20%** | No CI, no tests, no lockfile, no applied Prisma migrations |

**MVP completion methodology**

- **Denominator:** MVP V1 feature list in `docs/MVP_V1_SCOPE.md` (profiles, skills, goals, matching, sessions, reviews, reputation, contribution, NEXOS wallet, dashboard, admin).
- **Numerator:** Working, integrated code paths (not schema-only or placeholder pages).
- Sprint 1 ≈ 1/6 of `BUILD_PLAN_V1.md` (~17%); Sprint 1 is ~65% done with integration gaps → **~11%** from sprint math; feature-weighted average ≈ **14%**.

---

## 2. Existing features

### Canonical monorepo (`apps/web`, `apps/api`)

| Feature | Status |
|---------|--------|
| Monorepo root (`package.json`, `pnpm-workspace.yaml`, `turbo.json`) | Present |
| NestJS API shell | Health, versioning (`/api/v1/...`), CORS, validation pipe, interceptors, filters |
| Auth module (backend) | `POST signup/login/refresh`, `GET me`, `POST logout` via Supabase REST + JWT guard |
| Profile module (backend) | `GET/PATCH profiles/me`, `GET profiles`, `GET profiles/:id` |
| Prisma schema (14 models) | Full MVP-shaped schema declared (not migrated in repo) |
| Next.js App Router UI | Landing, login, signup, dashboard, profile-setup |
| Supabase client auth (frontend) | `AuthContext`, session listener, sign-in/up/out |
| Profile API client | `lib/api/profiles.ts` |
| Placeholder routes | `/matches`, `/sessions`, `/onboarding/skills`, `/onboarding/goals` |
| Documentation | 25+ architecture/product docs under `docs/` |

### Legacy stack (`frontend/`, `api/`)

| Feature | Status |
|---------|--------|
| Express API (`api/index.js`) | Courses, purchases, credits, transactions, profile CRUD via Supabase client |
| Supabase SQL schema (`api/schema.sql`) | Profiles, courses, credits, conversations, messages, matches + RLS |
| RLS migration + tests | `api/migrations/2026-06-04-fix-messages-rls.sql`, `api/rls_policy_tests.sql` |
| Next.js `frontend/` | Login/signup, onboarding with teach/learn skills, dashboard, admin stub |

---

## 3. Missing features (vs `MVP_V1_SCOPE.md` / `BUILD_PLAN_V1.md`)

### Sprint 2 — Profiles, skills, goals
- Skill catalog CRUD API and UI
- User skill management
- Learning goal CRUD
- Profile discovery UX beyond basic list API
- Dashboard summary for skills/goals

### Sprint 3 — Matching
- Matching algorithm and recommendations
- Match request lifecycle (accept/decline/cancel/expiry)
- Match detail UI

### Sprint 4 — Exchange sessions
- Session create/schedule/status APIs
- Participant confirmation tokens
- Session detail and verification UI

### Sprint 5 — Reviews, reputation, contribution
- Review submission and moderation
- Reputation calculation and leaderboard
- Contribution accrual/redemption

### Sprint 6 — NEXOS, admin, launch
- Wallet balances, transfers, spend flows
- Admin audit, moderation, adjustments
- Observability, rate limits, CI/CD, E2E tests

### Cross-cutting (documented but absent)
- Shadcn/UI component library (`apps/web/components/` does not exist)
- OpenAPI / API explorer
- Realtime messaging
- Notifications
- `apps/web/app/auth/callback` (listed in build plan)
- Shared TypeScript contracts package
- GitHub Actions / deployment automation

---

## 4. Broken dependencies

Issues that block `pnpm install` / `pnpm run dev` / `pnpm run build` without fixes:

| Issue | Location | Impact |
|-------|----------|--------|
| **`@nestjs/config` imported but not declared** | `app.module.ts`, `main.ts`, `auth.module.ts`, guards | API will not compile/run |
| **`jsonwebtoken` imported but not declared** | `supabase-auth.guard.ts` | Auth guard will not compile |
| **No `dev` script on `@nexolearn/api`** | `apps/api/package.json` has `start:dev` only | Root `pnpm run dev` (Turbo `dev`) skips API |
| **No `pnpm-lock.yaml`** | Repository root | Non-reproducible installs; deps not verified in CI |
| **Prisma schema invalid relation** | `NexosTransaction.wallet` → self-reference `NexosTransaction` (line ~244) | `prisma generate` / migrate likely fails |
| **Unused / conflicting ORM** | `@nestjs/typeorm` in dependencies; app uses Prisma | Dead weight; confuses architecture |
| **Deprecated Supabase helpers** | `@supabase/auth-helpers-nextjs`, `@supabase/auth-helpers-react` in `apps/web` | Maintenance risk; should migrate to `@supabase/ssr` |
| **Jest e2e config referenced, missing** | `test:e2e` → `./test/jest-e2e.json` | Script fails if invoked |
| **Dual frontends/backends** | `frontend/` + `apps/web`, `api/` + `apps/api` | Wrong package may be run; docs disagree on entrypoint |

---

## 5. Missing environment variables

### `apps/api` (from `.env.example` + code)

| Variable | Required by | In `.env.example` |
|----------|-------------|-------------------|
| `NODE_ENV` | Bootstrap | Yes |
| `LOG_LEVEL` | Logger | Yes |
| `PORT` | `main.ts` | Yes |
| `DATABASE_URL` | Prisma | Yes |
| `SUPABASE_URL` | Auth service | Yes |
| `SUPABASE_ANON_KEY` | Auth service | Yes |
| `SUPABASE_JWT_SECRET` | JWT guard / strategy | Yes |
| `CORS_ORIGINS` | CORS (comma-separated string; parsed as array in code may need config transform) | Yes |
| `API_URL` | Docs | Yes |

**Not in `.env.example` but recommended by audits / production practice:**

| Variable | Why |
|----------|-----|
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side privileged Supabase operations (legacy `api/` pattern); not used in Nest app today |
| `JWT` / signing secrets beyond Supabase | Only if issuing app-owned tokens (JwtModule registered but secondary to Supabase) |

### `apps/web` (from `.env.example`)

| Variable | Required by |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `auth-context.tsx` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `auth-context.tsx` |
| `NEXT_PUBLIC_API_URL` | `lib/api/client.ts` |

### Legacy `api/` + `frontend/` (implicit, no root `.env.example`)

| Variable | Used in |
|----------|---------|
| `SUPABASE_URL` | `api/index.js` |
| `SUPABASE_ANON_KEY` | `api/index.js` |
| `PORT` | Express |
| `NEXT_PUBLIC_SUPABASE_URL` | `frontend/lib/supabase.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `frontend/lib/supabase.ts` |

**No committed `.env` / `.env.local` files** (correct for git); operators must create them manually.

---

## 6. Frontend status

**Primary app:** `apps/web` (Next.js 16, React 19, Tailwind 3)

| Area | Status |
|------|--------|
| Auth pages | Login/signup via **Supabase client only** (not Nest `POST /auth/signup`) |
| Dashboard | Loads profile via Nest API when session exists |
| Onboarding | `profile-setup` wired to API; skills/goals are **placeholders** |
| Component library | Radix deps present; **no** `components/ui` or Shadcn setup per build plan |
| API integration | Only `profiles.ts`; no skills/matches/sessions clients |
| Route protection | Per-page `useEffect` redirects; no middleware-based guard |
| Auth callback | Missing |
| Tests | Jest configured; **zero** test files |

**Legacy app:** `frontend/` (Next.js 16.2.3)

- Direct Supabase for auth and `profiles` upsert with `skills` / `interests` arrays
- **Not** in pnpm workspace (`pnpm-workspace.yaml` only lists `apps/*`)
- Aligns with `api/schema.sql`, **not** with Prisma `apps/api` schema

**Critical integration defects (`apps/web`)**

1. **Signup does not create Prisma profile** — `signup/page.tsx` calls `signUp()` (Supabase only). Backend creates profile only on `POST /api/v1/auth/signup`. Users who sign up via UI will hit **“User profile not found”** on login/API profile fetch unless profile is created elsewhere.
2. **API response shape mismatch** — `ResponseInterceptor` wraps payloads as `{ success, statusCode, data, timestamp, path }`, but `profiles.ts` expects `{ profile }` at the top level → dashboard/profile-setup likely fail even with a valid token.
3. **Documented Shadcn/UI and shared hooks** (`useMatches`, `useSessions`, etc.) are not implemented.

---

## 7. Backend status

**Primary app:** `apps/api` (NestJS 10, Prisma 5)

| Module | Status |
|--------|--------|
| `AuthModule` | Implemented (Supabase HTTP + Prisma profile on signup) |
| `ProfileModule` | Implemented (repository pattern) |
| `PrismaModule` | Implemented |
| Skills, goals, match, session, review, reputation, contribution, nexos, admin | **Not present** |
| Tests | Scripts exist; **no** `*.spec.ts` / e2e tests |

**API surface (implemented)**

- `GET /health`
- `POST /api/v1/auth/signup|login|refresh|logout`
- `GET /api/v1/auth/me`
- `GET|PATCH /api/v1/profiles/me`
- `GET /api/v1/profiles`, `GET /api/v1/profiles/:id`

**Legacy app:** `api/index.js` (Express)

- Different routes (`/profile`, `/courses`, `/purchase`, etc.)
- Uses Supabase **anon** key server-side
- Non-atomic credit purchase flow (documented in `ARCHITECTURE_AUDIT.md`)

**Operational gaps**

- No Prisma `migrations/` directory (only `schema.prisma`, empty seed)
- `AuthService` constructor throws if Supabase env missing (fail-fast at boot)
- Public `GET /profiles` and `GET /profiles/:id` **without auth guard** (intentional for discovery; privacy policy must be explicit)

---

## 8. Database status

### Prisma (`apps/api/prisma/schema.prisma`)

| Aspect | Status |
|--------|--------|
| Models | 14 models covering MVP domain |
| Migrations | **None committed** — `prisma migrate dev` not run in repo |
| Seed | Stub only (`TODO` in `seed.ts`) |
| Auth linkage | `Profile.id` set to Supabase user UUID on signup; no FK to `auth.users` in Prisma |
| Schema bug | `NexosTransaction` relation targets wrong model (blocks client generation) |
| RLS | Documented as future; **not** defined in Prisma (expects Supabase/Postgres policies separately) |

### Supabase SQL (`api/schema.sql` + migrations)

| Aspect | Status |
|--------|--------|
| Domain | Course marketplace, credits, messaging, matches |
| RLS | Extensive policies; messages fix migration available |
| Alignment with Prisma | **Poor** — different tables, column names (`full_name` vs `firstName`), features (`skills` array vs `user_skills` table) |
| Tests | `api/rls_policy_tests.sql` for policy presence |

**Risk:** Running both schemas against one Supabase project without a migration strategy will cause **schema drift and data model conflict**.

---

## 9. Security issues

| Severity | Issue | Details |
|----------|--------|---------|
| **Critical** | Messages RLS over-permissive (legacy) | Documented in `ARCHITECTURE_AUDIT.md`; fix in `api/migrations/2026-06-04-fix-messages-rls.sql` — **must be applied** in any env using `api/schema.sql` |
| **High** | Non-atomic credit purchases | `api/index.js` read-then-update credits without transaction |
| **High** | Server uses Supabase anon key | Both legacy API and Nest `AuthService` use `SUPABASE_ANON_KEY` for server calls |
| **High** | Auth/profile split brain | Frontend signup bypasses Nest profile creation → authorization/data integrity failure |
| **Medium** | Public profile enumeration | `GET /api/v1/profiles` unauthenticated |
| **Medium** | No rate limiting | Auth and list endpoints open to abuse |
| **Medium** | No CI running RLS tests | `api/rls_policy_tests.sql` not automated |
| **Medium** | JWT in memory/session only | Supabase session storage (acceptable); ensure no tokens in `localStorage` custom code |
| **Low** | Logout endpoint | Nest logout does not revoke Supabase session server-side (client must sign out) |
| **Low** | Missing CSP, CSRF, audit logging usage | `AuditLog` model exists; no writes |

---

## 10. Scalability issues

| Area | Issue |
|------|--------|
| API design | No pagination enforcement defaults on all future list endpoints (profile list has pagination in service) |
| Caching | None (Redis/CDN) |
| Database | Legacy schema lacks composite indexes for some chat/transaction patterns (`DATABASE_AUDIT.md`) |
| Matching / sessions | No background jobs, queues, or workers |
| Realtime | Not implemented; Supabase Realtime strategy undocumented for monorepo path |
| Observability | Winston logger local only; no metrics/tracing |
| Monorepo | Turbo cache configured but no production deploy pipeline |
| Dual codepaths | Two APIs and two DB models prevent clean horizontal scaling assumptions |

---

## 11. UX issues

| Issue | Impact |
|-------|--------|
| Placeholder pages linked from dashboard | Users reach dead-end “Sprint N” messages |
| Signup → email verify message → login | Friction; no guided profile creation after signup |
| Profile load failures | Silent/error toast when API wrapper mismatch or missing profile |
| No global app shell / sidebar | Each page implements its own nav |
| No loading/error empty-state components | Build plan components missing |
| Legacy `frontend/` onboarding vs `apps/web` onboarding | Inconsistent skill capture UX |
| Accessibility / mobile | Not validated; basic Tailwind only |
| i18n | Legacy Spanish strings in `frontend/`; English in `apps/web` |

---

## 12. Technical debt

| Category | Debt |
|----------|------|
| **Architecture** | Two products in one repo (marketplace vs reciprocal exchange) |
| **Data model** | Prisma schema vs `api/schema.sql` divergence |
| **Integration** | Frontend auth path ≠ backend profile provisioning |
| **API contract** | Response interceptor vs client types; docs specify `{ data, meta }` — three shapes |
| **Dependencies** | Missing packages, unused TypeORM, deprecated auth-helpers |
| **Testing** | Zero automated tests; Jest wired but empty |
| **CI/CD** | No `.github/workflows` |
| **Migrations** | No Prisma migration history; SQL migrations only for legacy |
| **Documentation** | Sprint 1 marked “complete” while E2E gaps remain |
| **Code quality** | `profile.service.ts` uses `any` in `sanitizeProfile` despite strict TS policy |
| **Workspace** | `frontend/` and `api/` orphaned from pnpm workspace |

---

## 13. Exact next development steps

Ordered for maximum unblock value. Assumes **canonical stack** = `apps/web` + `apps/api` + Prisma; legacy code archived or isolated later.

### Phase A — Make the foundation runnable (1–3 days)

1. **Fix `apps/api/package.json` dependencies:** add `@nestjs/config`, `jsonwebtoken`, `@types/jsonwebtoken`; remove unused `@nestjs/typeorm` (or justify use).
2. **Fix Prisma schema:** correct `NexosTransaction` → `NexosWallet` relation; run `prisma validate` and `prisma generate`.
3. **Add `dev` script** to `apps/api` (`nest start --watch`) so `pnpm run dev` starts API + web.
4. **Run `pnpm install`** and commit `pnpm-lock.yaml`.
5. **Create `.env.local`** files from `.env.example` for both apps; provision Supabase + Postgres `DATABASE_URL`.
6. **Run initial migration:** `cd apps/api && pnpm exec prisma migrate dev --name init`.
7. **Align API responses with clients:** either unwrap `data` in clients (`profiles.ts`) or change interceptor to match `API_SPEC_V1.md`.

### Phase B — Fix auth ↔ profile E2E (2–4 days)

8. **Choose single signup path:**
   - **Option A (recommended):** Signup page calls `POST /api/v1/auth/signup` (creates Supabase user + Prisma profile), then stores session from response.
   - **Option B:** Keep Supabase signup; add `POST /api/v1/profiles/bootstrap` (auth required) to create profile on first login.
9. **Add Supabase trigger or webhook** (optional) to sync `auth.users` → `profiles` for redundancy.
10. **Verify flow:** signup → login → `GET profiles/me` → dashboard → `PATCH profiles/me` → profile-setup.
11. **Add Next.js middleware** for protected routes (`/dashboard`, `/onboarding/*`).

### Phase C — Sprint 2 backlog (1–2 weeks)

12. Implement `SkillModule` + `LearningGoalModule` per `BUILD_PLAN_V1.md`.
13. Replace placeholder pages `onboarding/skills`, `onboarding/goals` with real forms and API clients.
14. Seed skill catalog in `prisma/seed.ts`.
15. Add unit tests for profile/skill/goal services.

### Phase D — Security & ops (parallel, 3–5 days)

16. If legacy Supabase schema is still deployed: **apply** `api/migrations/2026-06-04-fix-messages-rls.sql` and run `api/rls_policy_tests.sql`.
17. Add GitHub Actions: install, lint, type-check, `prisma validate`, RLS SQL checks (against staging DB).
18. Document **single database strategy** in `docs/DEPLOYMENT_GUIDE.md` (Prisma-only vs migrate off `api/schema.sql`).
19. Add rate limiting on auth routes; require auth or scoped tokens for profile search if needed.
20. Introduce `SUPABASE_SERVICE_ROLE_KEY` only where server must bypass RLS (document never expose to client).

### Phase E — Deprecate or quarantine legacy (1 week)

21. Move `frontend/` and `api/` to `legacy/` or delete after porting any needed RLS/migration assets.
22. Update root `README.md` to state **only** `apps/web` + `apps/api` are supported.
23. Port valuable RLS patterns from `api/schema_rls_corrected.sql` into Supabase policies matching Prisma table names.

### Phase F — Sprint 3+ (per `BUILD_PLAN_V1.md`)

24. Matching module + `/matches` UI.
25. Sessions module + `/sessions` UI.
26. Reviews, reputation, contribution (Sprint 5).
27. NEXOS wallet + admin (Sprint 6).
28. E2E tests (Playwright) for onboarding → match → session → review.

---

## Repository map (audit reference)

```
nexolearn/
├── apps/
│   ├── api/          ← Canonical NestJS + Prisma backend
│   └── web/          ← Canonical Next.js frontend
├── api/              ← Legacy Express + Supabase SQL schema
├── frontend/         ← Legacy Next.js (not in pnpm workspace)
├── docs/             ← Architecture, MVP, audits, build plan
└── package.json      ← Turbo monorepo root (apps/* only)
```

---

## Related documents

| Document | Relevance |
|----------|-----------|
| `docs/BUILD_PLAN_V1.md` | 6-sprint roadmap and file order |
| `docs/MVP_V1_SCOPE.md` | Feature denominator for completion % |
| `docs/SPRINT_1_IMPLEMENTATION_SUMMARY.md` | Claimed Sprint 1 deliverables |
| `docs/ARCHITECTURE_AUDIT.md` | Legacy API security/scalability findings |
| `docs/DATABASE_AUDIT.md` | Legacy schema capability matrix |
| `docs/API_SPEC_V1.md` | Target API contract (mostly unimplemented) |
| `docs/RLS_CHECKLIST.md` | Legacy messages RLS remediation |

---

**Audit conclusion:** NexoLearn has a strong **documentation and schema blueprint** and a **partial Sprint 1 implementation**, but it is **not yet a coherent, runnable MVP**. The highest-leverage work is dependency/schema fixes, a single auth-profile pipeline, API response alignment, first Prisma migration, and resolution of the **dual-stack** (`apps/*` vs `api/`/`frontend/`) conflict before building Sprint 2 features.
