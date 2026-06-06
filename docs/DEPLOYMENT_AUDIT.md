# NexoLearn — Deployment Audit

**Date:** 2026-06-04  
**Scope:** Signup/login changes vs deployment target (`frontend/` vs `apps/web`)  
**Method:** Repository file inspection, build config analysis, documentation cross-check. No Vercel dashboard or production URL was accessible from this environment.

---

## Executive summary

| Question | Answer |
|----------|--------|
| Where were the **recent signup/login UX changes** made? | **`frontend/` only** |
| Were those changes made in `apps/web`? | **No** — `apps/web` has older Sprint 1 auth UI (gray Tailwind forms) |
| What does documentation say Vercel should deploy? | **`apps/web`** (root README, `BUILD_PLAN_V1.md`) |
| What does local ops documentation use? | **`frontend/`** (`DEPLOYMENT_GUIDE.md`, dev server on port 3000) |
| Can this audit confirm live Vercel Root Directory? | **No** — no `vercel.json`, no `.vercel/project.json`, no CI deploy logs in repo |
| Does production **automatically** include the new signup page? | **Only if** Vercel Root Directory = `frontend` **and** those files are committed and deployed |

**Risk:** Two Next.js apps exist. The redesigned signup/login lives in the app that is **not** in the pnpm workspace and **not** named in the canonical README deploy path. Production may still show the old experience—or a third variant from `apps/web`.

---

## 1. Where signup/login changes were made

### `frontend/` — **YES (full redesign)**

This is where the dedicated signup experience was implemented (OS V1 copy, mobile-first layout, distinct visual state).

| File | Path | What changed |
|------|------|--------------|
| Signup page (new implementation) | `frontend/app/signup/page.tsx` | Dedicated page; heading **“Create your NexoLearn account.”**; pillars **Learn / Teach / Build your reputation**; `signup-wrapper` layout; Supabase signup + profile insert |
| Login page (new implementation) | `frontend/app/login/page.tsx` | Dedicated login-only page; **“Sign in to your account”**; **“Welcome back.”**; link to `/signup` (no longer re-exports combined auth) |
| Home redirect | `frontend/app/page.tsx` | Redirects to `/dashboard` or `/login` (no longer combined login/signup UI) |
| Auth styles | `frontend/app/globals.css` | `.signup-wrapper`, `.signup-pillars`, `.signup-btn`, mobile-first `.login-wrapper`, shared `.auth-error`, `.field-label`, etc. |
| Onboarding redirect | `frontend/app/onboarding/page.tsx` | Unauthenticated users sent to `/login` (was `/`) |

**Build verification (local):** `npm run build` in `frontend/` emits routes `/`, `/login`, `/signup`, `/onboarding`, `/dashboard`.

### `apps/web/` — **NO (not the redesign)**

`apps/web` has **route aliases** and Sprint 1 auth pages from an earlier session. It does **not** contain the OS V1 signup messaging or teal pillar layout.

| File | Path | What it is |
|------|------|------------|
| Login route alias | `apps/web/app/login/page.tsx` | `export { default } from '../auth/login/page'` |
| Signup route alias | `apps/web/app/signup/page.tsx` | `export { default } from '../auth/signup/page'` |
| Login implementation | `apps/web/app/auth/login/page.tsx` | Gray Tailwind form; **“Sign in to your account”**; link to `/signup` |
| Signup implementation | `apps/web/app/auth/signup/page.tsx` | Gray Tailwind form; heading **“Create your account”** (not “Create your NexoLearn account.”); first/last name fields; **no** Learn/Teach/Reputation pillars |
| Home redirect | `apps/web/app/page.tsx` | Redirect splash to `/login` or `/dashboard` |
| Onboarding hub | `apps/web/app/onboarding/page.tsx` | Link hub only (not part of signup/login redesign) |
| Auth redirects | `apps/web/next.config.ts` | `/auth/login` → `/login`, `/auth/signup` → `/signup` |

**Fingerprint:** If production shows `signup-wrapper` or **“Create your NexoLearn account.”** with pillar cards, it is **`frontend/`**. If production shows gray `bg-gray-50` and **“Create your account”** with name fields, it is **`apps/web`**.

---

## 2. Exact modified file paths (signup/login work)

### Redesign batch (`frontend/` only)

```
frontend/app/signup/page.tsx
frontend/app/login/page.tsx
frontend/app/page.tsx
frontend/app/globals.css
frontend/app/onboarding/page.tsx
```

### Earlier route-fix batch (`apps/web/` — separate, not redesign)

```
apps/web/app/login/page.tsx
apps/web/app/signup/page.tsx
apps/web/app/onboarding/page.tsx
```

### Unchanged auth source for `apps/web`

```
apps/web/app/auth/login/page.tsx
apps/web/app/auth/signup/page.tsx
```

---

## 3. Which application Vercel currently deploys

### What the repository proves

| Signal | Points to |
|--------|-----------|
| `pnpm-workspace.yaml` | `apps/*` only — **`frontend/` is excluded** |
| Root `package.json` `workspaces` | `apps/*` only |
| Root `pnpm run build` (Turbo) | Builds **`@nexolearn/web`** in `apps/web`, not `frontend/` |
| Root `README.md` Deployment section | **“Frontend (Vercel)”** via `pnpm run build` / `vercel deploy` — implies monorepo **`apps/web`** |
| `docs/BUILD_PLAN_V1.md` | “Vercel deployment configured for **apps/web**” |
| `docs/DEPLOYMENT_GUIDE.md` | Describes **`frontend/`** on `localhost:3000`, Express `api/`, legacy stack |
| `vercel.json` | **Not present** |
| `.vercel/project.json` | **Not present** (not committed) |
| GitHub Actions deploy workflow | **Not present** |

### Conclusion on Vercel target

**Documented / monorepo-intended deploy target:** `apps/web`  
**Operationally active local app (per project docs and dev usage):** `frontend/`  
**Confirmed live Vercel Root Directory:** **Unknown from repo alone**

Vercel chooses the app via **Project Settings → Root Directory**. Common configurations for this repo:

| Root Directory setting | Deployed app | New signup UI? | New login UI (frontend redesign)? |
|------------------------|--------------|----------------|-----------------------------------|
| `frontend` | `frontend/` | Yes (after deploy) | Yes (after deploy) |
| `apps/web` | `apps/web` | No (old gray signup) | Partial (dedicated route, old UI) |
| `.` (repo root) | Likely **fails** or wrong package | Unreliable | Unreliable |
| Not connected / not deployed | — | No | No |

**Action required:** Open [Vercel Dashboard](https://vercel.com) → Project → **Settings → General → Root Directory** and record the value. That single setting determines production.

---

## 4. Does the deployed frontend contain the new signup page?

### If Vercel deploys `frontend/`

| Check | Expected on production |
|-------|----------------------|
| Route `/signup` exists | Yes |
| Page title area | **“Create your NexoLearn account.”** |
| OS pillars visible | **Learn.** / **Teach.** / **Build your reputation.** |
| Distinct styling | Teal/cyan gradient background, `.signup-wrapper`, cyan CTA button |
| Not present | Combined login+signup on same screen; Spanish “Iniciar sesión” / “Crear cuenta” on signup URL |

**Caveat:** Only true after git push + successful Vercel deployment. Local changes not pushed are **not** on production.

### If Vercel deploys `apps/web`

| Check | Production behavior |
|-------|---------------------|
| Route `/signup` exists | Yes (alias to `auth/signup`) |
| Signup heading | **“Create your account”** (generic) |
| OS pillars | **Absent** |
| Visual | Gray Tailwind (`bg-gray-50`), blue buttons |
| Extra fields | First name, last name |
| **Contains new signup experience?** | **No** |

### If production has not been redeployed since redesign

**No** — production still serves whatever was last built (possibly old combined `frontend/app/page.tsx` login+signup, or `apps/web` Sprint 1 UI).

---

## 5. Does the deployed frontend contain the new login page?

### If Vercel deploys `frontend/`

| Check | Expected on production |
|-------|----------------------|
| Route `/login` exists | Yes |
| Login-only UI | Yes — no “Crear cuenta” primary on same panel |
| Copy | **“Sign in to your account”**, **“Welcome back.”**, **“Continue your exchange journey.”** |
| Link to signup | **“Create your account”** → `/signup` |
| Visual | Purple-gradient `.login-wrapper` (distinct from signup teal) |
| `/` behavior | Redirect to `/login` or `/dashboard` |

### If Vercel deploys `apps/web`

| Check | Production behavior |
|-------|---------------------|
| Route `/login` exists | Yes |
| Copy | **“Sign in to your account”** (similar headline only) |
| Visual | Gray Tailwind card, blue submit button |
| Brand story | Minimal — no “Welcome back” / journey copy |
| **Contains new login experience?** | **No** (functional login, not the `frontend/` redesign) |

### Legacy production fingerprint (pre-redesign)

If production still shows on `/`, `/login`, or `/signup`:

- Spanish copy: **“Iniciar sesión”**, **“Crear cuenta”**, **“Conecta. Enseña. Aprende.”**
- Signup and login on **one screen**
- `Image` reference to `/logo.png`

→ Old `frontend` bundle; redesign **not** deployed.

---

## 6. Deployment topology (repository)

```
nexolearn/
├── frontend/          ← Signup/login REDESIGN lives here
│   ├── package.json   (standalone; not in pnpm workspace)
│   └── app/
│       ├── page.tsx
│       ├── login/page.tsx
│       └── signup/page.tsx
│
├── apps/web/          ← Documented Vercel target; OLD auth UI
│   ├── package.json   (@nexolearn/web; in pnpm workspace)
│   └── app/
│       ├── login/page.tsx      (re-export)
│       ├── signup/page.tsx     (re-export)
│       └── auth/
│           ├── login/page.tsx
│           └── signup/page.tsx
│
├── pnpm-workspace.yaml   → apps/* only
└── turbo.json            → build apps/web (+ apps/api)
```

---

## 7. How to verify production in 2 minutes

1. **Vercel:** Settings → General → **Root Directory** → note `frontend` vs `apps/web`.
2. **Live URL:** Open `https://<your-domain>/signup`.
3. **View source / inspect:** Search for `signup-wrapper` or `Create your NexoLearn account.`
   - **Found** → `frontend/` redesign is deployed.
   - **Not found**; see `bg-gray-50` and “Create your account” → `apps/web` is deployed.
4. **Vercel:** Deployments tab → latest deployment → commit hash matches local git with redesign files.

---

## 8. Recommendations (audit only — no code changes)

| Priority | Action |
|----------|--------|
| P0 | Record Vercel **Root Directory** in team docs; align with one canonical app |
| P0 | If product intent is new signup UX → set Root Directory to **`frontend`** OR port redesign into **`apps/web`** |
| P1 | Commit and push `frontend/` changes; trigger redeploy |
| P1 | Add `vercel.json` or document Root Directory in `README.md` to remove ambiguity |
| P2 | Deprecate dual-frontends per `EXECUTIVE_SUMMARY.md` |
| P2 | Add CI that builds the same package Vercel deploys |

---

## 9. Audit limitations

- Vercel project settings and production URL were **not** queried (no `vercel` CLI output, no `.vercel` metadata, no `gh` access).
- Git commit/push state could not be correlated to a live deployment from this environment.
- Conclusions about **live** production are **conditional** on Root Directory and last successful deploy.

---

## References

- `docs/UI_AUDIT_V1.md` — pre-redesign issues on `frontend/`
- `docs/EXECUTIVE_SUMMARY.md` — dual-stack warning
- `docs/PROJECT_STATUS.md` — canonical vs legacy apps
- `README.md` — Vercel deploy instructions (monorepo / `apps/web`)
- `docs/DEPLOYMENT_GUIDE.md` — local `frontend/` operations
