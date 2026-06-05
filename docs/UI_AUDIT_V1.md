# NexoLearn — UI Audit V1

**Date:** 2026-06-04  
**Scope:** Visible routes on the active frontend (`frontend/`, Next.js 16)  
**Routes audited:** `/`, `/login`, `/signup`, `/onboarding`, `/dashboard`  
**Method:** Source and stylesheet review, production build route map, layout/metadata inspection. Live browser capture was unavailable; scores reflect implemented markup and CSS, not runtime screenshots.  
**Reference principles:** NexoLearn OS V1 — **Learn · Teach · Impact · Trust**

---

## How principles apply to this audit

| Principle | What users should feel on every page |
|-----------|--------------------------------------|
| **Learn** | “I know what I can learn here and what my next learning step is.” |
| **Teach** | “I can offer something valuable; hosting/teaching is first-class.” |
| **Impact** | “My time here creates real outcomes — sessions, progress, value.” |
| **Trust** | “This product is legitimate, safe, and honest about what it does.” |

---

## Executive summary

| Route | Visual | Trust | Clarity | Conversion | Overall |
|-------|--------|-------|---------|------------|---------|
| `/` | 6 | 5 | 6 | 5 | **5.5** |
| `/login` | 6 | 5 | 6 | 5 | **5.5** |
| `/signup` | 6 | 4 | 4 | 4 | **4.5** |
| `/onboarding` | 5 | 5 | 6 | 6 | **5.5** |
| `/dashboard` | 6 | 3 | 3 | 2 | **3.5** |

**Weighted average across audited routes: ~4.8 / 10**

The login experience has the strongest visual identity. The dashboard and signup URL undermine **Trust**, **Impact**, and **Conversion**. Onboarding is the best alignment with **Learn** and **Teach**, but lacks polish and progress signaling.

**Critical finding:** `/login` and `/signup` render the **same** combined login+signup screen. `/signup` does not behave like a dedicated signup page, which hurts clarity and conversion for new users arriving on that URL.

**Secondary codebase note:** `apps/web` (monorepo canonical app) uses a separate, minimal gray Tailwind UI. `/` redirects away instantly; login/signup are split pages. If you switch default dev to `apps/web`, re-run this audit — scores would be lower on visual (4–5) and similar on trust/clarity gaps.

---

## Global issues (all pages)

### Problems

- **Metadata still default:** `layout.tsx` title is “Create Next App” — visible in browser tab, hurts **Trust**.
- **Language split:** UI copy is Spanish; docs and product name use “NexoLearn” / English positioning — inconsistent brand.
- **Error handling via `alert()`:** Login, onboarding, and signup flows use browser alerts — feels dated and unprofessional (**Trust**).
- **No footer trust block:** Missing privacy policy, terms, support/contact on auth pages.
- **No loading design system:** “Cargando…” is plain text with inline padding — inconsistent with otherwise styled pages.
- **Accessibility gaps:** Many controls lack visible labels; focus states not defined in CSS; chip removal not available for keyboard users.

### Missing elements (cross-page)

- Global navigation that survives route changes (except dashboard sidebar on desktop only).
- Progress / step indicators across onboarding → dashboard.
- Reputation, verification, or safety copy (**Trust**).
- Clear “what happens next” after signup or save.
- Mobile navigation pattern when sidebar is hidden.

### OS V1 principle gaps (global)

| Principle | Gap |
|-----------|-----|
| **Learn** | No learning goals lifecycle UI beyond onboarding chips; dashboard does not show goals. |
| **Teach** | Teach skills only on onboarding; no host badge or teach credibility on dashboard. |
| **Impact** | Dashboard shows hardcoded “10 Nexos” with no explanation — undermines honest **Impact** signaling. |
| **Trust** | No verification cues, no legal links, broken logo asset, fake wallet balance. |

---

## Page: `/` (home — login screen)

**Implementation:** `frontend/app/page.tsx` — full login + signup on one screen.  
**Note:** Unlike `apps/web`, this route does **not** redirect; it is the primary auth surface.

### Scores

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual quality | **6/10** | Purple/cyan gradient, glass panel, split layout show intent; undermined by missing logo file and no form labels. |
| User trust | **5/10** | Brand panel helps; alerts, no legal links, weak password rules (6 chars), metadata wrong. |
| Clarity | **6/10** | Headline “Conecta. Enseña. Aprende.” maps to OS pillars; dual CTAs on one screen blur login vs signup intent. |
| Conversion potential | **5/10** | Single screen reduces steps but “Crear cuenta” looks like secondary button, not a dedicated signup path. |

### Problems

- References `/logo.png` but `frontend/public/` has no `logo.png` — broken image hurts first impression (**Trust**).
- Sign up and sign in share one form; no separate value proposition for new vs returning users.
- Password minimum 6 characters — below common expectations (8+).
- No “Forgot password” path.
- No email confirmation messaging after signup (only alert + redirect).
- `signUp` may fail silently on profile insert (`console.error` only).

### Missing elements

- Visible `<label>` for email and password.
- Password strength hint.
- Link to `/signup` as distinct journey (even if stylistically similar).
- Social proof (beta cohort, testimonial, or “how it works” 3-step).
- Trust footer (privacy, terms, contact).
- Favicon and page title “NexoLearn — Sign in”.

### UX issues

- Primary and secondary actions both use `login-btn` — equal visual weight; signup should be clearer for new users (**Conversion**).
- Loading state is unstyled plain text.
- Enter key does not submit form (buttons use `onClick`, not `<form onSubmit>`).
- Mixed Spanish UI with English placeholders (“Email”, “Password”).

### Mobile issues

- `@media (max-width: 768px)` stacks brand + panel — acceptable.
- Brand block may dominate vertical scroll before form.
- Logo 140×140 may be large on small screens.
- No sticky CTA; long scroll on small devices.

### Desktop issues

- Fixed `login-panel` width 480px while wrapper is flex — panel not truly centered in right half; layout can feel unbalanced on ultrawide.
- Left brand column strong; right panel floats — good for marketing, less like enterprise SaaS (**Trust** for B2B users).

### Recommended redesign (principles-led)

- **Learn / Teach:** Hero copy with one line each: “Declare what you teach” and “Set what you want to learn” — preview the reciprocal loop before signup.
- **Impact:** Replace vague “Crea valor real” with concrete outcome: “Book peer sessions; earn reputation.”
- **Trust:** Fix logo; add terms/privacy; replace alerts with inline errors; 8+ char password; proper page title.
- Split `/` to a short marketing landing with two paths: “I want to learn” / “I want to teach” → login or signup (can share auth backend).

---

## Page: `/login`

**Implementation:** `frontend/app/login/page.tsx` re-exports `page.tsx` — **identical to `/`.**

### Scores

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual quality | **6/10** | Same as `/`. |
| User trust | **5/10** | Same as `/`. |
| Clarity | **6/10** | URL says login; screen still shows “Crear cuenta” prominently — acceptable but not URL-optimal. |
| Conversion potential | **5/10** | Returning users may be distracted by signup block. |

### Problems

- No differentiation from `/` — SEO and analytics cannot distinguish entry points.
- User expecting login-only UI still sees signup button with equal styling.
- Redirect target after auth is correct (`/dashboard`); unauthenticated dashboard correctly sends users here.

### Missing elements

- Login-only headline (“Welcome back”).
- Forgot password.
- “New here? Create account” as text link to `/signup` instead of second full button.
- Remember-me (optional).

### UX issues

- Cognitive load: two primary actions on a page whose URL implies one task.
- No feedback distinction between wrong password vs network error (raw Supabase message in alert).

### Mobile issues

Same as `/`.

### Desktop issues

Same as `/`.

### Recommended redesign

- Dedicated login layout: smaller card, single CTA, link to signup.
- Preserve brand panel from `/` for visual continuity.
- **Trust:** Inline error under fields; no alerts.

---

## Page: `/signup`

**Implementation:** Re-exports `page.tsx` — **same UI as `/` and `/login`, not a signup-focused page.**

### Scores

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual quality | **6/10** | Same shell; visual quality does not drop, but context is wrong for URL. |
| User trust | **4/10** | URL promises signup; user sees “Iniciar sesión” as main heading — feels like a mistake or phishing pattern. |
| Clarity | **4/10** | Worst clarity score: path and content disagree. |
| Conversion potential | **4/10** | New users lack name fields, goal teaser, or expectation-setting; signup is one click on shared form. |

### Problems

- **URL–content mismatch** is the highest UX defect in the audited set.
- No first/last name, timezone, or role selection (learner/host/both).
- Signup uses same 6-character password rule as login flow.
- Success = `alert('Cuenta creada 🚀')` — low **Trust** for a serious platform.
- Profile row insert can fail without user-facing explanation.

### Missing elements

- Signup-specific headline and subcopy.
- Fields: name, confirm password, accept terms checkbox.
- Explanation of email verification if Supabase requires it.
- Clear CTA: “Create account” as primary; login as secondary link.
- Onboarding preview (“Next: add skills you teach and want to learn”).

### UX issues

- Users landing from marketing `/signup` links hit a login-first screen — drop-off risk.
- No differentiation between sign-in and sign-up analytics.
- Emoji in success alert may not fit all audiences (**Trust** for professional learners).

### Mobile issues

Same as `/`; signup intent even less clear on small screens where heading dominates.

### Desktop issues

Same as `/`.

### Recommended redesign

- **Teach / Learn:** Signup wizard step 0: “I want to teach”, “I want to learn”, or “Both” — sets reciprocal expectation immediately.
- **Trust:** Terms acceptance, stronger password, professional success state (full-page “Check your email” or auto-continue to onboarding).
- **Impact:** One sentence on what they unlock: “Match with peers in ~48 hours.”
- Do not re-export login page; `/signup` must be its own surface.

---

## Page: `/onboarding`

**Implementation:** `frontend/app/onboarding/page.tsx` — teach skills + learn interests, save to Supabase `profiles`.

### Scores

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual quality | **5/10** | Functional but plain vs login; chips and gradient buttons help; no step indicator or illustration. |
| User trust | **5/10** | Asks for skills honestly; errors via alert; no explanation of how data is used or stored. |
| Clarity | **6/10** | Best OS alignment: explicit “Qué puedes enseñar” / “Qué quieres aprender” (**Teach** + **Learn**). |
| Conversion potential | **6/10** | Short path to dashboard; could complete in &lt;2 min if user knows skills. |

### Problems

- No progress indicator (step 1 of ?) — users don’t know how much is left.
- Chips cannot be removed — typos require refresh or awkward workarounds.
- `addTeach` / `addLearn` only on button click — Enter key doesn’t add chip.
- Unauthenticated redirect goes to `/` not `/login` (inconsistent with dashboard).
- No validation copy until alert on empty save.
- Redirect to `/` on missing user uses `router.push` without `replace`.

### Missing elements

- Progress bar or steps: Profile → Teach → Learn → Done.
- Skill suggestions / autocomplete (even static list of 20 popular skills).
- Character limit and normalization hint (“Use one skill per chip”).
- Remove (×) on chips.
- Privacy note: “Shown to matches only.”
- Loading state on “Guardar y continuar”.
- Empty-state examples beyond placeholders “Guitarra” / “Inglés”.

### UX issues

- Single long page — no micro-commitments; abandonment risk if user unsure of skills.
- No save draft — all-or-nothing on submit.
- Success path jumps straight to dashboard without confirmation (“Profile saved”).
- **Impact** not previewed — user doesn’t know matching happens next.

### Mobile issues

- `max-width: 600px` centered — readable.
- Input + button row may squeeze on very narrow screens (&lt;320px).
- No bottom safe-area padding for iOS home indicator on primary button.
- Onboarding uses light inputs on dark global body — contrast OK but section spacing tight on mobile.

### Desktop issues

- Page feels narrow and empty on large monitors — wasted space; no supporting illustration or sidebar tips.
- No keyboard shortcuts or focus management after adding chip.

### Recommended redesign

- **Learn / Teach:** Two-step wizard with icons; teach step first for reciprocal positioning.
- **Impact:** End screen: “You’re ready to match” + CTA “See recommended peers” (even if manual beta).
- **Trust:** Explain data use; inline validation; remove alerts.
- Optional: import from LinkedIn/text — post-beta; not required for beta-30.

---

## Page: `/dashboard`

**Implementation:** `frontend/app/dashboard/page.tsx` — 3-column grid: sidebar, main, right rail.

### Scores

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Visual quality | **6/10** | Desktop glass/grid aesthetic matches login; hollow content; avatar CSS unused. |
| User trust | **3/10** | Hardcoded “10 Nexos”; dead nav buttons; email-only identity — feels like prototype. |
| Clarity | **3/10** | User lands after onboarding with no skills, matches, or next steps visible. |
| Conversion potential | **2/10** | No actions drive second session, match, or teach — dead end for core loop. |

### Problems

- **Hardcoded “10 Nexos”** without wallet context — deceptive **Impact** signal, severe **Trust** hit.
- Nav buttons (Sesiones, Mensajes, Red) have no `href` or handlers — obvious broken UI.
- Main content is two lines: “Tu Dashboard” and “Bienvenido” — no personalized data from onboarding (skills/interests not shown).
- `.avatar` class defined in CSS but not used in JSX — incomplete design.
- `user` typed as `any` — reflects throwaway implementation quality.
- Sign out works; other actions do not.

### Missing elements

- User display name (not just email).
- Skills taught / learning interests from onboarding.
- Next action card: “Find a match”, “Schedule session”, “Complete profile”.
- Reputation or trust indicator (even “New member”).
- Real wallet/contribution OR remove Nexos card entirely until Feature 11.
- Session list empty state.
- Link back to onboarding to edit skills.
- Mobile nav alternative when sidebar hidden.

### UX issues

- **Learn:** No goals, progress, or recommended peers.
- **Teach:** No host status, no “offer a session”.
- **Impact:** Fake currency display worse than showing nothing.
- **Trust:** Product feels unfinished immediately after polished onboarding/login.
- Onboarding → dashboard transition drops all context user just entered.

### Mobile issues

- `@media (max-width: 768px)` **hides entire sidebar** — no hamburger, no bottom nav; user loses nav and logout unless they scroll (logout was in sidebar — **critical**: on mobile, **sign out may be unreachable** if sidebar is `display: none` and no alternative logout in main).
- Right rail also hidden — only main column with welcome text.
- No responsive reintroduction of logout button in main header.

### Desktop issues

- Three-column layout with sparse main — feels like template awaiting content.
- Sidebar buttons look interactive but do nothing — frustrates power users.
- No density balance: large empty main vs small sidebar.

### Recommended redesign

- **Impact:** Replace Nexos card with “Sessions completed: 0” and “Your next step: request a match” — honest metrics only.
- **Learn / Teach:** Two dashboard columns: “You teach” (chips) and “You’re learning” (chips) + match CTA.
- **Trust:** Show verification status “Unverified host” / “Member since …”.
- Add top bar on mobile with menu + logout.
- Empty states with single primary CTA per OS pillar.

---

## Comparative note: `apps/web` (if used instead)

| Route | Behavior | UI character |
|-------|----------|--------------|
| `/` | Redirect splash only | Gray, generic Tailwind |
| `/login` | Dedicated login form | Functional, no brand story |
| `/signup` | Dedicated signup with names | Better than `frontend` signup URL |
| `/onboarding` | Link hub to sub-pages | Placeholder skills/goals still Sprint 2 |
| `/dashboard` | Profile API integration | More honest data; still basic |

If product standardizes on `apps/web`, prioritize bringing `frontend/` visual identity into monorepo, not the reverse.

---

## Priority matrix (redesign order)

| Priority | Page | Why |
|----------|------|-----|
| P0 | `/dashboard` | Trust-breaking Nexos; mobile logout; dead nav |
| P0 | `/signup` | URL lies to user; blocks conversion |
| P1 | `/` + `/login` | Fix logo, metadata, forms, trust footer |
| P1 | `/onboarding` | Add progress, chip remove, next-step preview |
| P2 | Global | Design system, i18n strategy, a11y |

---

## OS V1 scorecard by principle

| Principle | Current strongest page | Current weakest | Target for beta-30 |
|-----------|------------------------|-----------------|---------------------|
| **Learn** | Onboarding | Dashboard | Dashboard shows goals + next learning action |
| **Teach** | Onboarding | Dashboard | Teach chips + host CTA on dashboard |
| **Impact** | Login tagline only | Dashboard (fake Nexos) | Real session count or honest empty state |
| **Trust** | Login visual shell | Dashboard | Remove fake data; legal links; fix logo/metadata |

---

## Definition of “UI ready for 30-user beta”

Minimum bar before inviting testers (from UI perspective only):

- [ ] No broken images or placeholder wallet balances
- [ ] `/signup` is a real signup page
- [ ] Dashboard shows onboarding data and one clear next action
- [ ] Mobile users can log out and navigate
- [ ] No `alert()` for primary flows
- [ ] Browser tab says NexoLearn, not Create Next App
- [ ] Dead buttons removed or wired to coming-soon states

---

## References

- `frontend/app/page.tsx`, `login/page.tsx`, `signup/page.tsx`, `onboarding/page.tsx`, `dashboard/page.tsx`
- `frontend/app/globals.css`, `frontend/app/layout.tsx`
- `docs/NEXOLEARN_OPERATING_SYSTEM.md` — lifecycle and trust model
- `docs/BETA_30_USERS_PLAN.md` — beta validation goals
- `docs/EXECUTIVE_SUMMARY.md` — dual frontend warning

---

**Audit conclusion:** The `frontend/` app has a recognizable visual direction on auth pages but **fails Trust and Conversion on dashboard and signup URL**. Onboarding best expresses **Learn** and **Teach** but needs structure and honesty about next steps. For a 30-user beta, fix dashboard integrity and signup clarity before investing in visual polish elsewhere.
