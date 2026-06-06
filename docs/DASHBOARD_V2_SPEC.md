# NexoLearn — Dashboard V2 Specification

**Date:** 2026-06-04  
**Status:** Product specification (no implementation)  
**Audience:** New users with **0 matches**, **0 sessions**, **0 reviews**  
**Replaces:** Placeholder dashboard (“Tu Dashboard” + hardcoded Nexos) per `UI_AUDIT_V1.md`  
**Aligns with:** `BETA_30_USERS_PLAN.md`, `MVP_V1_SCOPE.md`, NexoLearn OS V1 — **Learn · Teach · Impact · Trust**

---

## 1. Purpose

Dashboard V2 is the **first meaningful home** after onboarding. It must orient cold-start users and drive them toward their **first reciprocal exchange** without requiring prior platform activity.

### The dashboard must answer

| Question | User need |
|----------|-----------|
| **What is happening?** | Honest status: nothing scheduled yet, profile X% ready, reputation not started. |
| **What should I do next?** | One obvious primary action — never a wall of equal buttons. |
| **How do I get my first exchange?** | Short path: match → session → review, explained in plain language. |

### Out of scope for V2 (zero-state dashboard)

- NEXOS wallet balances (no fake numbers — `UI_AUDIT_V1` trust violation)
- Leaderboards, messaging, social feed
- Advanced analytics, contribution redemption
- Teacher verification workflow UI (beta: manual; show “Unverified host” badge only)
- AI-generated recommendations copy

---

## 2. OS V1 principles on the dashboard

| Principle | Dashboard expression |
|-----------|---------------------|
| **Learn** | Learning section: goals, progress toward first session as learner, “what you’re working toward.” |
| **Teach** | Teaching section: skills offered, readiness to host, “what you can offer peers.” |
| **Impact** | Exchange journey: sessions completed (0), reviews given (0), “your first exchange unlocks reputation.” |
| **Trust** | Transparent zeros, profile completion %, “New member” reputation state, no fabricated metrics. |

---

## 3. User states (logic engine)

Dashboard content adapts to **profile completion** and **exchange progress**. For V2 primary audience, default state is **S0: Cold start**.

| State | Conditions | Dashboard mode |
|-------|------------|----------------|
| **S0 — Cold start** | Onboarding done; 0 matches, 0 sessions, 0 reviews | **V2 default** — spec below |
| S1 — Match pending | ≥1 sent/received match, none accepted | Emphasize accept/respond CTAs |
| S2 — Matched | ≥1 accepted match, 0 sessions | Emphasize schedule session |
| S3 — Session scheduled | ≥1 upcoming session | Show next session card |
| S4 — Awaiting review | ≥1 completed session, review pending | Emphasize submit review |
| S5 — First exchange complete | ≥1 session + ≥1 review | Show reputation + “book again” |

**V2 must fully specify S0.** S1–S5 use same layout shell; swap **Recommended next action** and module empty states.

---

## 4. Profile completion logic

### Completion model

Profile completion drives CTAs until user reaches **100%** or **“Ready to match”** gate.

| Step | Field / data | Weight | Source |
|------|--------------|--------|--------|
| 1 | Account created (email verified if required) | 15% | Auth |
| 2 | Display name or first name | 15% | Profile |
| 3 | ≥1 teach skill | 25% | `user_skills` / onboarding teach |
| 4 | ≥1 learning goal or learn skill | 25% | `learning_goals` / onboarding learn |
| 5 | Bio (≥20 chars) or timezone | 10% | Profile |
| 6 | Avatar or location (optional) | 10% | Profile |

**Ready to match:** steps 1–4 complete (≥80%). Optional steps never block matching in beta.

### UI rules

- Show **progress ring or bar** with numeric % (e.g. “Profile 65% complete”).
- List **incomplete steps** as checklist (max 3 visible; “+1 more” if needed).
- Each incomplete step links to **one edit surface** (`/onboarding`, `/settings`, or inline modal).
- Copy: “Complete your profile so peers can find you” (**Trust**).
- Never show 100% if teach or learn data missing.

### Profile completion → CTA interaction

| Completion | Recommended next action priority |
|------------|----------------------------------|
| &lt; 80% | **Complete profile** (primary) |
| ≥ 80%, 0 matches | **Find your first match** (primary) |
| ≥ 80%, match pending | **Respond to match request** or **Check match status** |
| ≥ 80%, accepted match | **Schedule your first session** |

---

## 5. Layout structure (information architecture)

### Regions (all viewports)

Top-to-bottom **priority order** (mobile). Desktop uses columns but preserves this priority in the **main column**.

```
┌─────────────────────────────────────────────────────────────┐
│ A. Top bar — brand, user menu, sign out                      │
├─────────────────────────────────────────────────────────────┤
│ B. Greeting + status line — “What is happening?”             │
├─────────────────────────────────────────────────────────────┤
│ C. Recommended next action — single hero card (primary CTA)  │
├─────────────────────────────────────────────────────────────┤
│ D. Exchange journey — 3-step progress (Match→Session→Review) │
├─────────────────────────────────────────────────────────────┤
│ E. Two-column body (desktop) / stacked (mobile):             │
│    E1. Teaching section    │    E2. Learning section         │
├─────────────────────────────────────────────────────────────┤
│ F. Profile completion (if &lt; 100%)                           │
├─────────────────────────────────────────────────────────────┤
│ G. Trust snapshot — reputation, member since, verification   │
├─────────────────────────────────────────────────────────────┤
│ H. Secondary links — matches, sessions, settings             │
└─────────────────────────────────────────────────────────────┘
```

### Region copy principles

- **B** must be one sentence, factual: e.g. “You’re set up. No matches or sessions yet.”
- **C** is the only **filled** primary button above the fold on mobile.
- **D** always visible for S0 — educates “first exchange” path (**Impact**).
- **G** shows zeros honestly: “Reputation: New member (—)”.

---

## 6. Mobile layout (primary — mobile-first)

**Viewport:** 320px–768px. Design here first; desktop extends.

### Mobile wireframe (S0 — cold start)

```
┌──────────────────────────┐
│ NexoLearn    [avatar] ▾  │  ← A: sticky top bar
├──────────────────────────┤
│ Hi, {firstName}          │
│ You're ready to start.   │  ← B: status
│ No matches yet.          │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ ➜ Find your first    │ │
│ │   match              │ │  ← C: hero CTA (primary)
│ │ [Browse matches]     │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ Your first exchange      │
│ ○ Match  ○ Session  ○ Review │  ← D: journey stepper
├──────────────────────────┤
│ TEACHING                 │
│ You offer: Guitar, …     │  ← E1
│ [+ Add skill]            │
├──────────────────────────┤
│ LEARNING                 │
│ You want: English, …     │  ← E2
│ [+ Add goal]             │
├──────────────────────────┤
│ Profile 80% complete     │  ← F (if &lt; 100%)
│ ☑ Skills  ☐ Bio          │
│ [Finish profile]         │
├──────────────────────────┤
│ Trust                    │
│ New member · 0 sessions  │  ← G
├──────────────────────────┤
│ Matches · Sessions       │  ← H: text links
└──────────────────────────┘
```

### Mobile rules

- **Sticky top bar** with sign out in menu (fixes `UI_AUDIT_V1` mobile logout gap).
- **No sidebar** on mobile.
- **One primary button** visible without scroll (region C).
- **Bottom safe area** padding for iOS.
- **No dead buttons** — every control navigates or opens action.
- Teaching and Learning sections **always show user data** from onboarding (not empty if data exists).

### Mobile navigation

- Top bar: logo (tap → dashboard), profile menu (settings, sign out).
- Optional bottom nav (beta-30): **Home** | **Matches** | **Sessions** — Home = dashboard. Max 3 items.

---

## 7. Desktop layout (≥769px)

### Desktop wireframe (S0)

```
┌──────────┬────────────────────────────────────┬─────────────┐
│          │ B. Greeting + status                 │             │
│  Nav     ├────────────────────────────────────┤  G. Trust   │
│  rail    │ C. Recommended next action (wide)    │  snapshot   │
│          ├────────────────────────────────────┤             │
│  · Home  │ D. Exchange journey stepper          │  Profile %  │
│  · Match │├──────────────────┬─────────────────┤  ring       │
│  · Sess  │ E1. Teaching      │ E2. Learning    │             │
│  · Set   │                  │                  │             │
│          ├──────────────────┴─────────────────┤             │
│  Sign    │ F. Profile completion (if needed)    │             │
│  out     ├────────────────────────────────────┤             │
│          │ H. Activity preview (empty states)   │             │
└──────────┴────────────────────────────────────┴─────────────┘
```

### Desktop rules

- **Left nav rail** (240–260px): real routes only — Home, Matches, Sessions, Settings, Sign out.
- **Main column** (flex 1): regions B–F, H.
- **Right rail** (280–320px): Trust snapshot, profile completion ring, “How it works” mini FAQ (collapsible).
- **No fake wallet card.** Right rail may show “Impact preview” text: “After your first session, reputation updates here.”
- Max content width ~1200px; center on ultrawide.

---

## 8. Section specifications

### A. Top bar

| Element | Behavior |
|---------|----------|
| Product name | NexoLearn |
| User | First name or email prefix |
| Menu | Settings, Sign out |

### B. Greeting + status (“What is happening?”)

**Template (S0):**

> Hi, {firstName}.  
> You’re on NexoLearn — **no matches, sessions, or reviews yet.** That’s normal for new members.

**Variants:**

| State | Status line |
|-------|-------------|
| Profile &lt; 80% | “Your profile is {n}% complete. Finish setup to get matched.” |
| Match sent | “You have {n} pending match request(s).” |
| Match received | “Someone wants to exchange with you.” |

Tone: factual, calm (**Trust**). No fake urgency.

### C. Recommended next action (hero)

**Single card.** One headline, one sentence, one primary button, optional secondary text link.

#### S0 decision table

| Condition | Headline | Body | Primary CTA | Secondary |
|-----------|----------|------|-------------|-----------|
| Profile &lt; 80% | Finish your profile | Peers need your skills and goals to find you. | **Complete profile** → `/onboarding` or settings | Learn how matching works |
| Profile ≥ 80%, 0 matches | Find your first match | Browse peers who teach what you want to learn. | **Browse matches** → `/matches` | Edit teaching & learning |
| 0 teach skills | Add something you can teach | NexoLearn is reciprocal — share a skill you can help with. | **Add teach skill** → teaching section / onboarding | — |
| 0 learn goals | Add what you want to learn | Tell us what you’re working toward. | **Add learning goal** → learning section | — |

**Default for documented audience (onboarding complete, 0/0/0):**

- Headline: **Find your first match**
- Body: “You’ve declared what you teach and want to learn. Next, connect with a peer for a short exchange session.”
- Primary CTA: **Browse matches**
- Secondary: “How your first exchange works” (scroll to region D or open modal)

### D. Exchange journey (“How do I get my first exchange?”)

Horizontal stepper (mobile: compact; desktop: full).

| Step | Label | S0 state | Microcopy |
|------|-------|----------|-----------|
| 1 | **Match** | Not started (empty) | “Find someone with complementary skills.” |
| 2 | **Session** | Locked | “Schedule a 30–60 min exchange.” |
| 3 | **Review** | Locked | “Leave feedback and build reputation.” |

**Visual:** Step 1 active; 2–3 grayed with lock icon. No checkmarks until real data.

**Expandable “How it works” (3 bullets):**

1. **Match** with a peer who complements your teach/learn profile.  
2. **Meet** for a focused session (video link you provide).  
3. **Review** each other — your reputation grows with verified exchanges.

Maps to **Learn**, **Teach**, **Impact**, **Trust**.

### E1. Teaching section

**Header:** “Teaching” or “What you offer”  
**OS:** **Teach**

| Element | S0 content |
|---------|------------|
| Skill chips | From profile; min 1 from onboarding |
| Empty state | “You haven’t added teach skills yet.” + **Add skill** |
| Subcopy | “Hosts share knowledge in reciprocal sessions.” |
| Meta | “0 sessions hosted” (honest zero) |
| Action | **Add skill** / **Edit skills** → onboarding or settings |

**Do not show** “Verified teacher” unless `verified=true`.

### E2. Learning section

**Header:** “Learning” or “What you’re pursuing”  
**OS:** **Learn**

| Element | S0 content |
|---------|------------|
| Goal chips | From profile / learning goals |
| Empty state | “Add a topic you want to learn.” + **Add goal** |
| Subcopy | “Learners set goals so matches stay relevant.” |
| Meta | “0 sessions as learner” |
| Action | **Add goal** / **Edit goals** |

### F. Profile completion module

Shown when completion &lt; 100% **or** &lt; 80% (ready-to-match gate).

- Progress bar + percentage
- Checklist of incomplete steps (linked)
- Primary: **Finish profile**
- Dismiss not allowed until ≥ 80% (beta)

### G. Trust snapshot

**OS:** **Trust**

| Field | S0 display |
|-------|------------|
| Reputation | “New member” (no numeric score or “—”) |
| Reviews received | 0 |
| Sessions completed | 0 |
| Member since | `{signupDate}` |
| Verification | “Not verified” (neutral badge) |

**Never** show NEXOS, contribution points, or fabricated balances in V2.

### H. Secondary / activity preview

Two compact cards side by side (mobile: stacked):

| Card | S0 empty state | CTA |
|------|----------------|-----|
| **Matches** | “No matches yet” | View matches → `/matches` |
| **Sessions** | “No sessions scheduled” | View sessions → `/sessions` |

Tertiary links: Edit profile, Help / beta guide (Notion or doc link).

---

## 9. Empty states (detailed)

### Global rule

Every empty state includes: **what**, **why it matters**, **one action**. No dead ends.

| Surface | Empty message | CTA |
|---------|---------------|-----|
| Matches card | “No matches yet. Browse peers who fit your teach/learn profile.” | Browse matches |
| Sessions card | “No sessions yet. Accept a match, then schedule your first exchange.” | View matches |
| Reviews / trust | “No reviews yet. Complete a session to build reputation.” | Learn how it works |
| Teaching chips | “Add at least one skill you can teach.” | Add skill |
| Learning chips | “Add what you want to learn.” | Add goal |
| Upcoming (future) | “Nothing scheduled. Your calendar is clear.” | Find a match |

### Anti-patterns (forbidden)

- Hardcoded wallet balances
- Nav buttons with no `href`
- “Welcome 🚀” with no next step
- Hiding onboarding teach/learn data after user saved it

---

## 10. CTA hierarchy

### Priority levels

| Level | Style | Count on screen | Examples |
|-------|-------|-----------------|----------|
| **Primary** | Filled, high contrast | **1** per viewport | Browse matches, Complete profile, Schedule session |
| **Secondary** | Outline or text link | ≤2 near primary | How it works, Edit skills |
| **Tertiary** | Text / ghost | Nav + footer links | Matches, Sessions, Settings |

### S0 default hierarchy

1. **Primary:** Browse matches (if profile ≥ 80%)  
2. **Secondary:** Finish profile (if &lt; 80%) OR How your first exchange works  
3. **Tertiary:** Section-level Add skill / Add goal, nav links  

### CTA → route map

| CTA | Route |
|-----|-------|
| Browse matches | `/matches` |
| Complete / Finish profile | `/onboarding` or `/settings` |
| Add skill | `/onboarding` (teach) or skills editor |
| Add goal | `/onboarding` (learn) or goals editor |
| View matches | `/matches` |
| View sessions | `/sessions` |
| Schedule session | `/sessions/new` or match detail (S2+) |
| Sign out | `/login` after `signOut()` |

---

## 11. Recommended next action (algorithm)

Single function determines hero card (region C). Pseudologic for spec:

```
IF profile_completion < 80%:
  RETURN "Complete profile"
ELSE IF teach_skills.count == 0:
  RETURN "Add teach skill"
ELSE IF learn_goals.count == 0:
  RETURN "Add learning goal"
ELSE IF matches.accepted.count == 0 AND matches.pending.count == 0:
  RETURN "Browse matches"                    // S0 default
ELSE IF matches.pending_incoming.count > 0:
  RETURN "Respond to match request"
ELSE IF matches.accepted.count > 0 AND sessions.upcoming.count == 0:
  RETURN "Schedule your first session"
ELSE IF sessions.awaiting_review.count > 0:
  RETURN "Submit session review"
ELSE IF sessions.completed.count > 0:
  RETURN "Find another match"
```

**Copy block for S0 (documented audience):** always **“Browse matches”** when onboarding complete and teach/learn present.

---

## 12. Content & tone

| Attribute | Guideline |
|-----------|-----------|
| Language | English (align with signup V2) |
| Voice | Direct, encouraging, honest |
| Numbers | Real counts only; zeros allowed |
| Reciprocal framing | Always mention both teach and learn over time |
| Beta | Optional subtle banner: “You’re in the NexoLearn beta” |

### Example greeting (S0, complete profile)

> **Hi, Alex.**  
> You’re set up on NexoLearn. **No matches, sessions, or reviews yet** — here’s how to start your first exchange.

---

## 13. Accessibility & responsive notes

- Touch targets ≥ 44px on mobile
- Stepper readable by screen readers (aria-current on active step)
- Status changes announced via live region when match/session updates
- Color not sole indicator for journey step state
- Contrast meets WCAG AA on primary CTA

---

## 14. Data dependencies (implementation reference)

Dashboard V2 read-only needs:

| Data | Used in |
|------|---------|
| `profile.firstName`, `bio`, `timezone`, `avatarUrl` | Greeting, completion |
| `user_skills[]` | Teaching section, completion |
| `learning_goals[]` or learn skills | Learning section, completion |
| `matches` counts by status | Status line, hero CTA, matches card |
| `sessions` counts by status | Sessions card, journey stepper |
| `reputation_score` or default | Trust snapshot |
| `profile.createdAt` | Member since |
| `profile.verified` | Trust badge |

Graceful loading: skeleton for hero + sections; never flash fake data.

---

## 15. Success criteria (V2 done)

| # | Criterion |
|---|-----------|
| 1 | New user with 0/0/0 sees **non-empty** teach/learn data if provided in onboarding |
| 2 | User can answer “what’s happening” in &lt;5 seconds without scrolling (mobile) |
| 3 | Exactly **one** primary CTA above the fold |
| 4 | “First exchange” path visible without leaving dashboard |
| 5 | No fabricated wallet or reputation numbers |
| 6 | Mobile user can sign out without hidden sidebar |
| 7 | Every button and link navigates to a real route |
| 8 | Profile &lt; 80% surfaces completion before “Browse matches” |

---

## 16. Phased delivery

| Phase | Scope |
|-------|-------|
| **V2.0** | S0 layout, profile completion, teach/learn sections, hero CTA, journey stepper, trust snapshot |
| **V2.1** | S1–S2 hero variants, matches/sessions live data cards |
| **V2.2** | S3–S5 review prompts, reputation number after first review |

---

## 17. References

- `docs/UI_AUDIT_V1.md` — current dashboard failures  
- `docs/BETA_30_USERS_PLAN.md` — first exchange validation  
- `docs/AUTH_REDIRECT_AUDIT.md` — post-login landing  
- `docs/BUILD_ORDER_V2.md` — Feature 4 Dashboard  
- `docs/NEXOLEARN_OPERATING_SYSTEM.md` — lifecycle and trust model  

---

**Summary:** Dashboard V2 is a **mobile-first, honest cold-start home** that surfaces teach/learn identity, profile completion, a three-step exchange journey, and **one** recommended action — default **Browse matches** — while mapping every region to **Learn, Teach, Impact, and Trust**.
