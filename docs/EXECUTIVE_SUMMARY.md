# NexoLearn — Executive Summary

**Date:** 2026-06-04  
**Audience:** Founders, stakeholders, and anyone who needs the big picture without reading the codebase  
**Based on:** `docs/PROJECT_STATUS.md`, `docs/BUILD_ORDER_V2.md`, `docs/MVP_V1_SCOPE.md`

---

## 1. Current repository health

**Overall: fragile but promising.**

The project has a clear plan and a modern stack (Next.js + NestJS + Prisma + Supabase), but the product is not yet a single, working application end to end.

| Area | Health | Plain English |
|------|--------|----------------|
| **Documentation** | Strong | What to build is well written; most of it is not built yet. |
| **Canonical app (`apps/web` + `apps/api`)** | Weak | Login screens exist, but signup and the API do not fully agree on how users are created. |
| **Database** | Weak | The data model is designed in code, but migrations are not in the repo and one wallet relation is broken. |
| **Legacy code (`frontend/` + `api/`)** | Confusing | An older course-and-credits version lives beside the new app and uses a different database design. |
| **Tests & CI** | Missing | No automated tests or deployment pipeline in the repo. |
| **Production readiness** | Low | Not safe to invite real users at scale today. |

**Bottom line:** Good blueprint, early construction. Fix the foundation before adding more features.

---

## 2. Current completion percentage

| What | Approx. complete |
|------|------------------|
| **Full MVP** (matching, sessions, reviews, trust, wallet, etc.) | **~14%** |
| **Sprint 1 foundation** (auth, basic profile, UI shell) | **~65%** (scaffolding done; full user journey still broken) |
| **Architecture & product docs** | **~85%** |

So: most of the **thinking** is done; most of the **product behavior** is not.

---

## 3. Highest risks

1. **Signup does not always create a user profile in the app database** — Users can register in Supabase but fail when the dashboard loads profile data.

2. **Two apps in one repo** — The old `frontend/` + `api/` stack and the new `apps/` stack tell different stories. Wrong code or schema can be deployed by mistake.

3. **Wallet / money logic not built yet** — When NEXOS is added, bugs could allow double-spending or wrong balances if transfers are not atomic.

4. **No automated tests or CI** — Regressions will slip through as features are added.

5. **Matching and sessions are hard** — Core value (find a peer, run a session) is the largest build and the easiest place to ship something that “works in demo” but fails in real use.

6. **Legacy database security** — If the old Supabase schema is still live, a known messages privacy issue must be fixed before any real chat use.

7. **Missing npm packages on the API** — The backend may not compile until dependencies like `@nestjs/config` and `jsonwebtoken` are added.

---

## 4. What blocks MVP launch

You cannot honestly launch the **full MVP** defined in `BUILD_ORDER_V2` until all of the following are true:

| Blocker | Why it matters |
|---------|----------------|
| **P0 foundation** | App installs, runs locally, database migrates, API responses match the frontend. |
| **Working login + signup + profile** | Every new user has one account in Supabase and one profile in Postgres. |
| **Onboarding** | Skills and goals captured (not placeholder pages). |
| **Matching** | Users can discover and accept matches. |
| **Sessions** | Users can schedule and complete an exchange session. |
| **Reviews** | Feedback after sessions exists. |
| **Trust (at least a simple version)** | Reputation/contribution visible and used in matching. |
| **NEXOS wallet (safe version)** | Balances and transfers work without race conditions. |
| **Teacher verification (MVP)** | Host trust path exists (even if manual admin approval). |
| **Staging environment + smoke test** | One path tested: signup → onboard → match → session → review → wallet. |
| **Single stack only** | `apps/web` + `apps/api`; legacy folders archived or ignored. |

**Today’s blockers for *any* launch:** P0, signup/profile fix, and a decision to stop maintaining two parallel codebases.

---

## 5. What can be ignored until after launch

Safe to defer after the first real users are on the **canonical** MVP:

| Defer | Reason |
|-------|--------|
| **Legacy `frontend/` and `api/`** | Not part of MVP path; archive after P0. |
| **Shadcn/UI polish and full design system** | Tailwind pages are enough for first cohort. |
| **Advanced trust formulas** (decay, sybil detection, full anti-fraud) | Start with simple reputation from ratings + completion rate. |
| **Treasury, fiat, AML, global payouts** | Explicitly out of MVP scope. |
| **Realtime chat / notifications** | Not required to validate reciprocal sessions first. |
| **OpenAPI portal, shared types package** | Nice for team scale; not for day-one users. |
| **OAuth providers beyond email/password** | Add when core loop works. |
| **Avatar upload / Supabase Storage** | URL-only avatars or none at first. |
| **Leaderboards and gamification extras** | After core loop metrics look healthy. |
| **Load testing and multi-region** | After ~100+ active users. |
| **Full admin suite** | Manual DB/admin for first 30–50 users is acceptable. |
| **Migrating off deprecated Supabase auth helpers** | Plan post-launch unless blocking upgrade. |

---

## 6. Top 10 actions required this week

From `BUILD_ORDER_V2` Phase P0 and Features 1–2. Do these before building matching or wallet.

1. **Add missing API dependencies** (`@nestjs/config`, `jsonwebtoken`) and a `dev` script so `pnpm run dev` starts both web and API.

2. **Fix the Prisma wallet relation** and run the first migration; commit `pnpm-lock.yaml`.

3. **Set up `.env.local`** for `apps/api` and `apps/web` (Supabase + database URL).

4. **Align API responses with the frontend** — Today the API wraps data; the profile client expects a different shape.

5. **Pick one signup path** — Either signup goes through the Nest API (creates profile) or Supabase signup plus a “create profile” bootstrap call. Document it.

6. **Prove the golden path manually** — Signup → login → `GET profile/me` → dashboard shows name.

7. **Add route protection** — Middleware so `/dashboard` and onboarding require login.

8. **Move or label legacy folders** — `frontend/` and `api/` as `legacy/` so nobody ships the wrong app.

9. **Add minimal CI** — Install, type-check, `prisma validate` on every push.

10. **Write down “MVP launch checklist”** — 10–15 checkboxes from `BUILD_ORDER_V2` acceptance criteria; use it weekly.

---

## 7. Estimated timeline to MVP

**Assumption:** One full-time developer who knows the stack, following `BUILD_ORDER_V2` in order.

| Scenario | Calendar time |
|----------|----------------|
| **Sequential build** (one feature at a time) | **~13–18 weeks** (~62–88 working days) |
| **With overlap** (API + UI in parallel where possible) | **~10–14 weeks** |

**MVP complete means:** P0 + all 11 features pass acceptance tests in staging, with the smoke path signup → onboard → match → session → review → trust visible → NEXOS transfer.

This is **engineering-complete MVP**, not marketing launch. Add 2–4 weeks for bug fixes, staging deploy, and legal/ops basics if needed.

---

## 8. Estimated timeline to first 30–50 users

**Assumption:** Friends-and-family or closed beta; manual support; MVP core loop works but trust/wallet may be simplified.

| Phase | When (from today) | What you need |
|-------|-------------------|---------------|
| Foundation + auth + onboarding | Weeks 1–3 | Users can sign up and finish profile/skills/goals |
| Profiles + basic dashboard | Weeks 3–4 | Usable home screen |
| Matching (simple) | Weeks 5–7 | Users can find and accept at least one match |
| Sessions (minimal) | Weeks 8–10 | At least one session can be scheduled and marked complete |
| Reviews (minimal) | Weeks 10–11 | Post-session rating |
| **Closed beta invite** | **~11–13 weeks** | 30–50 users if you cut scope (see below) |

**Faster beta (30–50 users) at ~8–10 weeks** if you **temporarily skip or stub:**

- Full teacher verification (manual whitelist hosts)
- Full NEXOS (points display only, no transfers)
- Full trust engine (show average rating only)

You still need matching + sessions + reviews in some form, or the product does not prove its value.

**After invite:** Plan 2–4 weeks of fixes from real user feedback before widening the cohort.

---

## 9. Estimated timeline to first 1,000 users

**Assumption:** Public or open beta; basic monitoring; abuse limits; stable hosting.

| Milestone | When (from today) | Notes |
|-----------|-------------------|--------|
| **Full BUILD_ORDER_V2 MVP** | ~10–14 weeks | See section 7 |
| **Hardening** (tests, rate limits, monitoring, backups) | +3–4 weeks | Required before scale |
| **Soft launch** (100–200 users) | **~14–18 weeks** | Learn ops, support load, matching quality |
| **Iterate** (onboarding friction, matching, session completion) | +4–8 weeks | Driven by metrics in `MVP_V1_SCOPE.md` |
| **1,000 users** | **~5–9 months** from today | Marketing, retention, and reliability matter as much as code |

**What 1,000 users requires beyond code:**

- Reliable deploys and database backups  
- Support process for no-shows, disputes, and bad actors  
- Matching that works with a thin network (cold start)  
- Cost control (Supabase, hosting, email)  
- Clear terms, privacy policy, and basic moderation  

**Do not aim for 1,000 users on the broken signup/profile path or dual codebase.** Fix foundation first; scale follows.

---

## One-page decision summary

| Question | Answer |
|----------|--------|
| Are we ready to launch? | **No** — ~14% of MVP product; integration gaps on signup/profile. |
| What should we build on? | **`apps/web` + `apps/api` only.** |
| What is the critical path? | Foundation → auth → onboarding → matching → sessions → reviews → trust → wallet. |
| How long to MVP? | **~3–4 months** solo, full scope. |
| How long to 30–50 testers? | **~3 months** full scope; **~2 months** with deliberate scope cuts. |
| How long to 1,000 users? | **~5–9 months** with product iteration and ops, not code alone. |

---

## Related documents

- **`docs/BUILD_ORDER_V2.md`** — Detailed build order, files, and acceptance criteria per feature  
- **`docs/PROJECT_STATUS.md`** — Technical audit and gap list  
- **`docs/MVP_V1_SCOPE.md`** — What the MVP is meant to prove  
