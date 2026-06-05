# NexoLearn — Closed Beta Plan (30 Users)

**Date:** 2026-06-04  
**Goal:** Run the first closed beta with **30 users** to validate reciprocal knowledge exchange — not to scale revenue or the full economy.  
**Based on:** `docs/BUILD_ORDER_V2.md`, `docs/EXECUTIVE_SUMMARY.md`, `docs/MVP_V1_SCOPE.md`  
**Out of scope for this beta:** Advanced AI, fiat payouts, global wallet, treasury, NEXOS transfers, contribution redemption, open signup.

---

## Beta purpose (one sentence)

Prove that real people can **find a relevant peer, complete at least one exchange session, leave a review, see reputation change, and come back within seven days** — without you manually running every match in a spreadsheet forever.

---

## What we are validating

| Pillar | Question the beta must answer |
|--------|-------------------------------|
| **Matching** | Do users get useful peer suggestions and accept at least one match? |
| **Sessions** | Do scheduled sessions actually happen and get marked complete? |
| **Reviews** | Do users submit honest feedback after sessions? |
| **Reputation** | Does reputation feel fair and motivate better behavior? |
| **Retention** | Do users return after their first session? |

Everything else is supporting cast for these five outcomes.

---

## 1. Minimum functionality required

### Must work in the product (automated path)

These are non-negotiable for a credible beta. Map to `BUILD_ORDER_V2` Features P0, 1–8, and a **simplified** Feature 10.

| # | Capability | Minimum bar |
|---|------------|-------------|
| 0 | **Stable auth** | Signup, login, logout; every user has one profile in the database. |
| 1 | **Onboarding** | Profile + at least one skill to teach or offer + at least one learning goal. |
| 2 | **Dashboard** | Shows profile summary, match status, upcoming/past sessions, reputation snapshot. |
| 3 | **Profiles** | View and edit own profile; view others’ public profile (skills/goals only). |
| 4 | **Matching** | See recommendations **or** a curated list; send request; accept/decline; status visible to both parties. |
| 5 | **Sessions** | Create session from accepted match; set time; statuses: scheduled → completed (cancel/no-show allowed). |
| 6 | **Reviews** | After completed session, both sides can submit 1–5 stars + short comment (one review per person per session). |
| 7 | **Reputation (simple)** | Score updates from completed sessions + reviews (formula can be basic: average rating + completion count). |
| 8 | **Deploy** | Staging URL, HTTPS, basic error logging; founder can see auth/session errors. |

### Explicitly not required for beta-30

| Cut from beta | Why |
|---------------|-----|
| NEXOS wallet, transfers, spend | No treasury/global wallet; avoids financial integrity risk. |
| Contribution points redemption | Reputation is enough for trust signal. |
| Teacher verification workflow in app | Manual whitelist (see §4). |
| AI matching | Rule-based or manual curation only. |
| In-app chat / video | External tools OK (see §3). |
| Email notifications (nice) | Manual reminders acceptable if calendar links exist. |
| Leaderboards, admin audit UI, rate limiting at scale | Add before 100 users if metrics justify. |

### Beta-ready definition of done (engineering)

Before inviting user 1:

- [ ] Golden path works on staging: signup → onboard → see matches → accept match → schedule session → mark complete → submit review → reputation number changes on dashboard.
- [ ] No duplicate signup/profile bug (see `PROJECT_STATUS.md`).
- [ ] Only `apps/web` + `apps/api` deployed; legacy stack not used.
- [ ] Founder can export a simple user/session CSV or query DB for weekly metrics.

**Estimated build before invite window:** ~8–10 weeks from current repo state if scope cuts above are held (per `EXECUTIVE_SUMMARY.md`).

---

## 2. What can be fake or manual

Use manual ops to buy time. Document every manual step in a runbook so you know what to automate before 100 users.

| Area | Manual / fake is OK for 30 users | How |
|------|----------------------------------|-----|
| **Match recommendations** | Yes | Founder seeds 5–10 “good pairs” in DB or approves matches in admin SQL; algorithm can be “same skill tag overlap.” |
| **Teacher/host approval** | Yes | Spreadsheet whitelist of emails allowed to host; set `verified` or role in DB by hand. |
| **Session reminders** | Yes | Founder sends calendar invite or WhatsApp/email 24h before. |
| **Session video** | Yes | Zoom / Google Meet / Jitsi link in session notes field (paste URL). |
| **Dispute resolution** | Yes | DM founder; adjust session status or hide review in DB. |
| **Reputation formula tuning** | Yes | Adjust weights weekly in config or SQL until scores feel fair. |
| **User support** | Yes | Single founder inbox; office hours 2× per week. |
| **Invites** | Yes | No public signup; invite link or email allowlist only. |
| **Analytics** | Yes | Weekly spreadsheet from DB queries beats full product analytics. |
| **Content moderation** | Yes | Read all reviews once per week; delete/flag manually. |
| **Cold start** | Yes | Pre-assign “buddy” pairs for week 1 so nobody waits with zero matches. |

**Rule:** If more than **50%** of matches or sessions require founder intervention after week 2, the beta is telling you matching or UX is not ready — not that manual ops “work.”

---

## 3. What must be automated

Manual ops do not scale and create false positives (“we had 30 sessions” that were founder-scheduled). These **must** happen in the app without founder clicking each time:

| Must be automated | Reason |
|-------------------|--------|
| Account creation tied to profile | Integrity of all metrics. |
| Onboarding gate (cannot match until profile + skills + goals done) | Clean activation metric. |
| Match request → accept/decline state machine | Core validation of matching. |
| Session record linked to match participants | Audit trail for sessions metric. |
| Session status transitions (at least scheduled → completed/cancelled) | Completion rate must be real. |
| Review creation tied to completed session + reviewer id | One review per user per session enforced in API/DB. |
| Reputation recalculation after review (idempotent) | Users must see cause and effect. |
| Auth protection on private routes | Security baseline. |
| Unique constraints (one match pair, one review per reviewer per session) | Prevents gaming with duplicate rows. |

**Optional but strongly recommended before day 1:**

- Email on match accepted and session scheduled (reduces no-shows).
- Basic rate limit on signup/review endpoints (prevents script abuse even in closed beta).

---

## 4. User onboarding process (learners + hosts)

**Audience:** All 30 users play both roles over time (“reciprocal”), but each person should complete onboarding as both someone who **teaches something** and **learns something**.

### Before day 0 (founder)

1. Recruit 30 people with **known skill diversity** (aim for ≥15 distinct teach topics).
2. Send invite: staging link, code of conduct, time commitment (≈2 hours/week for 4 weeks).
3. Pre-create allowlist in Supabase or closed registration flag.

### Day 0 — Account (10–15 minutes)

| Step | User action | System requirement |
|------|-------------|-------------------|
| 1 | Open invite link, sign up (email + password) | Signup creates auth + profile |
| 2 | Confirm email if enabled | Clear error if not confirmed |
| 3 | Land on onboarding wizard | Cannot skip to dashboard empty |

### Day 0–1 — Profile wizard (15–20 minutes)

| Step | User action | System requirement |
|------|-------------|-------------------|
| 4 | Name, short bio, timezone, optional location | Saved to profile |
| 5 | Add 1–3 **skills I can help with** | `user_skills` |
| 6 | Add 1–2 **learning goals** | `learning_goals` |
| 7 | See “You’re ready to match” | `onboardingCompleted` flag set |

### Day 1–2 — First match (founder nudge)

| Step | User action | System requirement |
|------|-------------|-------------------|
| 8 | Open Matches; see ≥3 suggestions or curated list | Matching UI live |
| 9 | Send one match request | Request visible to candidate |
| 10 | Accept incoming request OR wait for founder-paired buddy | Accept flow works |

**Founder playbook week 1:** If user has zero pending matches after 48h, assign a buddy pair manually and message both users.

### Day 2–7 — First session

| Step | User action | System requirement |
|------|-------------|-------------------|
| 11 | Schedule session (date/time + meeting link in notes) | Session row created |
| 12 | Attend externally (Zoom etc.) | — |
| 13 | Host or learner marks session **completed** | Status update in app |
| 14 | Both submit review within 72 hours | Review form; reputation updates |

### Ongoing (weeks 2–4)

- Target: **≥2 completed sessions** per active user over beta.
- Second match should be user-initiated, not founder-paired, by week 3 for ≥50% of cohort.

### Onboarding success (per user)

User is “activated” when: onboarding complete + ≥1 accepted match + ≥1 completed session.

---

## 5. Teacher onboarding process (hosts)

For beta-30, **“teacher” = user who hosts a session** (teaches their declared skill). No separate product surface required if profile includes teach skills.

### Minimum host requirements

| Requirement | Automated | Manual |
|-------------|-----------|--------|
| Declared ≥1 teach skill in onboarding | Yes | — |
| Completed own profile (bio, timezone) | Yes | — |
| Agreed to host norms (PDF/Notion link) | — | Checkbox in invite email |
| Allowed to host sessions | Optional flag in DB | Whitelist first 10 hosts if needed |
| “Verified teacher” badge | No | Founder sets `verified=true` after 1 good session |

### Host onboarding flow (parallel to §4)

1. Same signup and profile wizard as all users.
2. Invite email includes **Host one-pager**: session length (30–60 min), show up policy, how to mark complete, review peer fairly.
3. Week 1: each host should host **at least 1** session (can be with assigned buddy).
4. Week 2+: hosts should accept **≥1** inbound match request from a non-buddy user.

### Host quality gate (manual, 30 users)

After first hosted session, founder checks:

- Showed up? (Y/N)
- Peer would book again? (Y/N from review or DM)

If N/N on show-up → pause hosting; fix ops, not reputation formula.

### What hosts do not need for beta

- KYC, payouts, tax forms, certificate upload, in-app verification queue (unless you want 2–3 design partners testing that UI).

---

## 6. Success metrics

Track weekly in a single spreadsheet. Denominator = **activated users** unless noted.

### Primary success metrics (beta passes if most are green by week 4)

| Metric | Target (30-user cohort) | How to measure |
|--------|-------------------------|----------------|
| **Activation rate** | ≥ **80%** (24/30) complete onboarding | `onboardingCompleted` + skills + goals |
| **Match within 7 days** | ≥ **70%** of activated users receive ≥1 accepted match | DB: `matches.status = accepted` |
| **Session scheduled** | ≥ **60%** of activated users have ≥1 scheduled session | `exchange_sessions` |
| **Session completion rate** | ≥ **50%** of scheduled sessions → `completed` | completed / (completed + cancelled + no_show) |
| **Review submission rate** | ≥ **70%** of completed sessions have **both** reviews | count reviews per session_id |
| **Reputation visibility** | ≥ **80%** of users who completed a session see score change within 24h | spot-check + user survey |
| **7-day retention** | ≥ **40%** of activated users active in app days 8–14 | login or meaningful action |
| **Second session intent** | ≥ **30%** of activated users complete **2+** sessions | session count per user |
| **Qualitative NPS proxy** | ≥ **60%** “would recommend to a friend learning X” | end-beta survey (5 questions) |

### Secondary metrics (inform iteration)

| Metric | Target | Notes |
|--------|--------|-------|
| Median time to first accepted match | &lt; **5 days** | Friction indicator |
| Median time from match → completed session | &lt; **10 days** | Scheduling friction |
| Average review rating | **3.5–4.5** / 5 | Too high = grade inflation; too low = matching quality |
| Host no-show rate | &lt; **15%** of scheduled sessions | Ops/process issue |
| Learner no-show rate | &lt; **20%** | Reminders |
| Founder manual interventions per week | Trend **down** week 2 → 4 | Should fall, not rise |

---

## 7. Failure metrics

Stop, fix, or **do not expand** to 100 users if these appear. Some are hard stops; some are “pause invites.”

### Hard stop (pause beta invites)

| Failure signal | Threshold | Meaning |
|----------------|-----------|---------|
| Signup/profile failure rate | **>10%** of invitees cannot complete signup | Broken foundation |
| Activation rate after 2 weeks | **&lt;50%** | Onboarding too hard or wrong audience |
| Session completion rate | **&lt;30%** for 2 consecutive weeks | Product or ops failure; matching wrong |
| Both-sided review rate | **&lt;40%** of completed sessions | Reviews not valued or too hard |
| 7-day retention | **&lt;20%** | Core loop not sticky |
| Safety incident | **Any** harassment, doxxing, unresolved dispute | Trust breakdown |
| Data integrity bug | Duplicate reviews, wrong reputation, lost sessions | Engineering trust |

### Soft stop (continue with 30 but do not add users)

| Failure signal | Threshold | Meaning |
|----------------|-----------|---------|
| Founder manual match rate | **>50%** of matches in week 3 | Matching not product-ready |
| Average rating &lt; 2.5 | With ≥10 sessions | Bad pairings or bad hosts |
| Average rating &gt; 4.9 | With ≥10 sessions | Reviews meaningless |
| &lt;15 distinct teach skills in cohort | At recruit stage | Network too thin to test matching |
| Users report confusion on “what to do next” | **>40%** in weekly survey | UX/dashboard failure |

### Narrative failure (qualitative)

- Users say: “I couldn’t find anyone relevant.”
- Users say: “Scheduling was harder than the session.”
- Users say: “Reputation didn’t change” or “I don’t trust the score.”
- Hosts say: “Not worth my time without clearer learners.”

If three or more of these appear in week 3 interviews, treat as product-market fit risk on **matching quality**, not marketing.

---

## 8. Weekly review process

**Cadence:** 60–90 minutes every **Monday** (metrics) + optional **Friday** 30 min (qualitative only).

### Attendees

- Founder / product owner (required)
- Engineer (required if any hard-stop metric red)
- Optional: 1–2 power users from beta (weeks 3–4 only, not week 1)

### Agenda (same order every week)

| Block | Time | Activity |
|-------|------|----------|
| 1. Numbers | 20 min | Update spreadsheet: §6 primary metrics + §7 failure checks |
| 2. Cohort health | 15 min | List users: activated / stuck / churned; who needs buddy match |
| 3. Session post-mortems | 15 min | Every no-show and cancelled session: why? |
| 4. Review sample | 10 min | Read 5 random reviews; note quality and abuse |
| 5. Reputation sanity | 10 min | Top 3 and bottom 3 scores — do they match founder intuition? |
| 6. Decisions | 15 min | Max 3 changes for the week (product, ops, or comms) |
| 7. Actions | 5 min | Assign owner + due date for each decision |

### Weekly decision log (template)

| Week | Decision | Expected impact | Revisit date |
|------|----------|-----------------|--------------|
| 1 | e.g. Add buddy pairing for all | ↑ match rate | Week 2 |
| 2 | e.g. Simplify review to 3 questions | ↑ review rate | Week 3 |

### Outputs each week

- Updated metrics tab (week-over-week)
- List of users to nudge (max 10 DMs, personalized)
- Go / caution / stop signal for continuing beta

---

## 9. Feedback collection process

Use **three channels** so you get both numbers and stories.

### A. In-product (lightweight)

| When | What | Format |
|------|------|--------|
| After first completed session | 2 questions: “Session useful?” (Y/N), “Match again?” (Y/N) | In-app modal or link to 1-min form |
| After first review submitted | 1 question: “Was reputation update clear?” (Y/N + optional text) | Same |
| End of beta (week 4) | 5-question survey | See §9C |

Keep surveys short; completion rate matters more than detail in weeks 1–3.

### B. Founder-led (high signal)

| When | What | Who |
|------|------|-----|
| Week 1 | 15-min onboarding call with **6** users (stratified: 3 hosts, 3 learners) | Volunteer subset |
| Week 2 | 15-min call with **4** users who have **zero** completed sessions | Stuck users |
| Week 3 | 15-min call with **4** users with **2+** completed sessions | Success pattern |
| Week 4 | 30-min group retro (optional, max 12 attendees) | Whole cohort optional |

**Interview script (same every time):**

1. What were you trying to learn or teach?
2. How did you pick your match?
3. What happened in the session?
4. Did reputation feel fair after the review?
5. What would stop you from coming back next week?

Record notes in one doc per user; tag themes (matching, scheduling, trust, UX).

### C. End-of-beta survey (all 30)

Send in week 4; close before expansion decision.

| # | Question | Type |
|---|----------|------|
| 1 | I found at least one relevant peer to exchange with. | 1–5 agree |
| 2 | I completed at least one session that felt worthwhile. | 1–5 agree |
| 3 | I trust the reputation score on profiles. | 1–5 agree |
| 4 | I would use NexoLearn again next month. | 1–5 agree |
| 5 | I would recommend NexoLearn to a friend with similar goals. | 0–10 NPS |
| 6 | Biggest friction (one sentence) | Open text |
| 7 | Best moment (one sentence) | Open text |

---

## 10. Exit criteria before expanding to 100 users

Do **not** open to 100 users until **all** gates below pass. Expanding means: open waitlist, ~70 new users, less founder-per-user handholding.

### Gate A — Engineering (non-negotiable)

| Criterion | Status required |
|-----------|-----------------|
| Golden path works without founder fixing data | 10 consecutive real user journeys without DB patch |
| Signup/profile bug | Zero open critical bugs |
| Automated match → session → review → reputation | No manual DB inserts for core loop |
| Staging + production deploy documented | Rollback tested once |
| Basic monitoring | Error alert within 1 hour of auth/API 5xx spike |
| Security | RLS or API auth reviewed; no public admin endpoints |

### Gate B — Beta-30 metrics (non-negotiable)

| Criterion | Threshold |
|-----------|-----------|
| Activation rate | ≥ **80%** |
| Match within 7 days (activated users) | ≥ **70%** |
| Session completion rate | ≥ **50%** |
| Both-sided review rate (completed sessions) | ≥ **70%** |
| 7-day retention (activated) | ≥ **40%** |
| Users with 2+ completed sessions | ≥ **30%** of activated (~9+ users) |
| No hard-stop failure metrics (§7) for **2 consecutive weeks** | — |

### Gate C — Qualitative (non-negotiable)

| Criterion | Evidence |
|-----------|----------|
| Matching relevance | ≥ **60%** agree (4+) on survey Q1 |
| Session value | ≥ **60%** agree (4+) on Q2 |
| Reputation trust | ≥ **50%** agree (4+) on Q3 |
| Would return | ≥ **50%** agree (4+) on Q4 |
| NPS | **≥ +20** (promoters − detractors) |
| Founder manual match rate | **&lt;25%** of matches in final beta week |
| No unresolved safety incidents | — |

### Gate D — Ops readiness for 100 (required)

| Criterion | Minimum |
|-----------|---------|
| Support playbook | Documented responses for no-show, dispute, bad review |
| Invite + waitlist process | Email templates, allowlist workflow |
| Weekly metrics | Automated or semi-automated export (not 2h of SQL) |
| Teacher/host policy | Written; verification path defined (even if still partly manual) |
| Decision on economy | NEXOS still off **or** limited mint with audit — document explicitly |

### Expansion recommendation

| Outcome | Action |
|---------|--------|
| **All gates A–D pass** | Expand to 100 over 4–6 weeks (batch invites of 15–20/week) |
| **B or C fail, A passes** | Run **second 30-user cohort** with fixes; do not scale |
| **A fails** | Stop invites; fix engineering until golden path stable |

---

## Beta timeline (suggested 4-week run)

| Week | Focus | Founder effort |
|------|--------|----------------|
| **0** (pre-beta) | Build minimum §1; recruit 30; allowlist | High — build + recruit |
| **1** | Onboarding + buddy matches + first sessions | High — pairing + reminders |
| **2** | User-initiated matches; reduce manual pairs | Medium |
| **3** | Second sessions; reputation tuning | Medium |
| **4** | Survey + exit criteria review | High — analysis, go/no-go |

Add **2 buffer weeks** before week 1 if engineering minimum is not ready.

---

## Cohort design (30 users)

| Segment | Count | Why |
|---------|-------|-----|
| Committed hosts (will teach weekly) | **10** | Supply for sessions |
| Active learners | **12** | Demand |
| Dual-role enthusiasts | **8** | Test reciprocal story |
| **Total** | **30** | |

Aim for **≥2 users per timezone band** you care about (e.g. Americas / Europe / APAC) to reduce scheduling pain.

---

## Communication norms (beta)

- Single channel (Slack / Discord / WhatsApp group) — optional, max 30 members.
- Code of conduct: be kind, show up or cancel 24h ahead, honest reviews.
- Founder office hours: **2× 30 min / week** posted in channel.
- No marketing promises about money, crypto, or global payouts during beta.

---

## Related documents

- `docs/EXECUTIVE_SUMMARY.md` — timelines and overall health  
- `docs/BUILD_ORDER_V2.md` — full feature build order (trim wallet/NEXOS for this beta)  
- `docs/MVP_V1_SCOPE.md` — long-term success metrics (use subset §6 here)  
- `docs/TRUST_AND_REPUTATION_ENGINE.md` — simplify formulas for beta reputation only  

---

## Summary

| Topic | Beta-30 stance |
|-------|----------------|
| **Build** | Auth → onboard → match → session → review → simple reputation |
| **Skip** | NEXOS, treasury, fiat, AI matching, full teacher verification UI |
| **Manual OK** | Buddy matching, host whitelist, reminders, disputes, analytics sheet |
| **Must automate** | State machines, reviews, reputation update, profile integrity |
| **Success** | Activation, matches, completions, reviews, retention, positive survey |
| **Failure** | Low completion, low retention, broken data, safety, >50% manual matches late |
| **Expand to 100** | Only if Gates A–D pass after 4-week beta |
