# FRONTEND_ARCHITECTURE_V1

Date: 2026-06-04

Role: Frontend Architect

This document defines the complete frontend architecture for NexoLearn MVP V1. It is aligned to the product scope, backend architecture, database model, Prisma schema, and REST API specification.

## Overview

The frontend is a mobile-first, responsive React application built with Next.js 16. It uses Supabase Auth for authentication, Prisma-backed backend APIs, and a modular feature architecture to support onboarding, matching, sessions, reputation, contribution, NEXOS wallet, and admin moderation.

Key design principles:
- mobile-first UX with responsive breakpoints
- clear feature module boundaries
- lightweight client-side state management with server-driven data
- accessibility-first components and interactions
- robust loading/empty/error states
- performance by minimizing bundle size and API calls

## App Structure

### High-level architecture
- Framework: Next.js 16 with App Router
- Pages: routed via URL segments and nested layouts
- UI: shared design system with accessible primitives
- Data fetching: server-side rendering (SSR) for public discovery and client-side fetching for authenticated flows
- State: local component state, React Context for session/auth, and SWR/React Query for remote data
- Authentication: Supabase Auth session integrated with frontend route guards
- API layer: typed request/response shapes matching API_SPEC_V1

### Folder layout
```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/page.tsx
│   ├── onboarding/
│   │   ├── page.tsx
│   │   ├── profile-setup/page.tsx
│   │   ├── skills/page.tsx
│   │   └── goals/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── matches/page.tsx
│   │   ├── sessions/page.tsx
│   │   ├── reputation/page.tsx
│   │   └── wallet/page.tsx
│   ├── profiles/
│   │   └── [id]/page.tsx
│   ├── matches/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── sessions/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── reviews/
│   │   └── [sessionId]/page.tsx
│   ├── reputation/
│   │   └── leaderboard/page.tsx
│   ├── contribution/
│   │   └── page.tsx
│   ├── nexos/
│   │   ├── page.tsx
│   │   └── transfer/page.tsx
│   ├── admin/
│   │   ├── audit-logs/page.tsx
│   │   ├── review-moderation/page.tsx
│   │   └── session-verification/page.tsx
│   └── settings/page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── loader.tsx
│   │   ├── card.tsx
│   │   ├── modal.tsx
│   │   ├── toast.tsx
│   │   ├── accessible-table.tsx
│   │   └── responsive-grid.tsx
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── footer.tsx
│   ├── forms/
│   │   ├── profile-form.tsx
│   │   ├── skill-form.tsx
│   │   ├── goal-form.tsx
│   │   ├── session-form.tsx
│   │   ├── review-form.tsx
│   │   ├── transfer-form.tsx
│   │   └── redemption-form.tsx
│   ├── cards/
│   │   ├── profile-card.tsx
│   │   ├── match-card.tsx
│   │   ├── session-card.tsx
│   │   ├── review-card.tsx
│   │   ├── reputation-card.tsx
│   │   └── wallet-card.tsx
│   └── widgets/
│       ├── loading-state.tsx
│       ├── empty-state.tsx
│       ├── error-state.tsx
│       ├── filter-panel.tsx
│       ├── sort-control.tsx
│       └── pagination-control.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── profiles.ts
│   │   ├── skills.ts
│   │   ├── goals.ts
│   │   ├── matches.ts
│   │   ├── sessions.ts
│   │   ├── reviews.ts
│   │   ├── reputation.ts
│   │   ├── contribution.ts
│   │   ├── nexos.ts
│   │   └── admin.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useFetch.ts
│   │   ├── useUserProfile.ts
│   │   ├── useMatches.ts
│   │   ├── useSessions.ts
│   │   └── useWallet.ts
│   ├── state/
│   │   ├── auth-context.tsx
│   │   │   ├── AuthProvider
│   │   │   ├── useAuthContext
│   │   ├── ui-context.tsx
│   │   └── notification-context.tsx
│   ├── validations/
│   │   ├── auth-schema.ts
│   │   ├── profile-schema.ts
│   │   ├── skill-schema.ts
│   │   ├── goal-schema.ts
│   │   ├── session-schema.ts
│   │   ├── review-schema.ts
│   │   ├── transfer-schema.ts
│   │   └── redemption-schema.ts
│   └── utils/
│       ├── format-date.ts
│       ├── currency.ts
│       ├── accessibility.ts
│       ├── responsive.ts
│       └── analytics.ts
├── styles/
│   ├── globals.css
│   ├── variables.css
│   ├── layout.css
│   └── utilities.css
├── public/
│   └── icons/
├── types/
│   ├── api.ts
│   ├── models.ts
│   ├── ui.ts
│   ├── events.ts
│   └── errors.ts
├── middleware.ts
└── next.config.ts
```

### App Shell
- Primary navigation: Home, Matches, Sessions, Reputation, Wallet, Admin (if authorized)
- Secondary navigation: Profile, Settings, Logout
- Mobile bottom sheet navigation on small screens
- Global notification/toast component
- Global loading indicator for route transitions

## Routing Structure

### Public Routes
- `/auth/login`
- `/auth/signup`
- `/auth/callback`

### Onboarding Routes
- `/onboarding`
- `/onboarding/profile-setup`
- `/onboarding/skills`
- `/onboarding/goals`

### Core User Routes
- `/dashboard`
- `/matches`
- `/matches/[id]`
- `/sessions`
- `/sessions/[id]`
- `/reviews/[sessionId]`
- `/reputation`
- `/reputation/leaderboard`
- `/contribution`
- `/nexos`
- `/nexos/transfer`
- `/profiles/[id]`
- `/settings`

### Admin Routes
- `/admin/audit-logs`
- `/admin/review-moderation`
- `/admin/session-verification`
- `/admin/adjustments`

### Route guards
- Public routes are open
- Authenticated routes require `AuthProvider`
- Onboarding routes are accessible only if profile incomplete
- Admin routes require admin role from auth session

## Feature Modules

### Auth Module
Purpose: handle login/signup, token renewal, session persistence.
Components:
- `LoginForm`
- `SignupForm`
- `AuthCallback`
- `AuthGuard`
- `SessionTimeoutBanner`

API Endpoints consumed:
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

State:
- Auth tokens stored in secure HTTP-only cookies or Supabase session
- AuthContext holds `user`, `isAuthenticated`, and `token`

Loading states:
- login/signup submit spinner
- token refresh indicator

Error states:
- invalid credentials
- signup validation errors
- network failure
- auth token expired

Permissions:
- open to unauthenticated users for login/signup
- auth routes redirect if already signed in

### Profiles Module
Purpose: manage user profiles and discovery.
Components:
- `ProfileView`
- `ProfileEditForm`
- `ProfileCard`
- `ProfileList`
- `SearchBar`
- `FilterChips`

API Endpoints consumed:
- `GET /profiles/me`
- `PATCH /profiles/me`
- `GET /profiles`
- `GET /profiles/:id`

Loading states:
- profile fetch skeleton
- search/filter loading indicator

Empty states:
- no matching profiles found
- profile incomplete prompt for onboarding

Error states:
- profile not found
- network error
- unauthorized access

Permissions:
- profile editing only for own profile
- discovery accessible to authenticated users

### Skills Module
Purpose: enable users to declare teaching/learning skills and discover a skill catalog.
Components:
- `SkillSearch`
- `SkillTagPicker`
- `UserSkillList`
- `SkillChip`
- `SkillProficiencySlider`

API Endpoints consumed:
- `GET /skills`
- `POST /user-skills`
- `GET /user-skills/me`
- `PATCH /user-skills/:id`
- `DELETE /user-skills/:id`

Loading states:
- catalog loading skeleton
- save button spinner

Empty states:
- no declared skills yet
- empty catalog search result

Error states:
- duplicate skill declaration
- invalid proficiency value
- network error

Permissions:
- user can manage only own skills

### Learning Goals Module
Purpose: collect and manage learning objectives for matching.
Components:
- `GoalForm`
- `GoalCard`
- `GoalList`
- `GoalStatusBadge`

API Endpoints consumed:
- `POST /learning-goals`
- `GET /learning-goals/me`
- `PATCH /learning-goals/:id`
- `DELETE /learning-goals/:id`

Loading states:
- goal list skeleton
- save/update spinner

Empty states:
- prompt to create first goal
- no active goals yet

Error states:
- invalid goal data
- skill association missing
- network error

Permissions:
- user can manage only own goals

### Matches Module
Purpose: discover, request, and manage candidate matches.
Components:
- `MatchRecommendationList`
- `MatchCard`
- `MatchFilterPanel`
- `MatchActionButton`
- `MatchDetailPanel`

API Endpoints consumed:
- `GET /matches/me`
- `POST /matches`
- `PATCH /matches/:id`
- `GET /matches/recommendations`

Loading states:
- recommendations loading spinner
- match list skeleton
- action button busy state

Empty states:
- no recommendations available
- no active matches yet
- filter yields no matches

Error states:
- failed match creation
- permission denied
- rate limit exceeded for recommendations

Permissions:
- only authenticated user may request matches
- only requester/candidate may update match status

### Sessions Module
Purpose: schedule sessions, track status, and support participant confirmation.
Components:
- `SessionForm`
- `SessionCard`
- `SessionTimeline`
- `ParticipantList`
- `SessionStatusBadge`
- `ConfirmationPanel`

API Endpoints consumed:
- `POST /sessions`
- `GET /sessions/me`
- `PATCH /sessions/:id`
- `POST /sessions/:id/participants`
- `GET /sessions/:id/reviews`

Loading states:
- session creation loading
- session list skeleton
- participant confirmation spinner

Empty states:
- no scheduled sessions
- no confirmed attendance yet

Error states:
- invalid session data
- unauthorized session update
- session not found

Permissions:
- session owner can edit status
- participants can confirm attendance

### Reviews Module
Purpose: capture session feedback and support moderation.
Components:
- `ReviewForm`
- `ReviewList`
- `ReviewCard`
- `FlagButton`

API Endpoints consumed:
- `POST /sessions/:id/reviews`
- `GET /sessions/:id/reviews`
- `PATCH /reviews/:id`

Loading states:
- review submission spinner
- review list skeleton

Empty states:
- no reviews submitted
- no published reviews yet

Error states:
- duplicate review
- invalid rating/comments
- network error

Permissions:
- session participants can submit reviews
- reviewer can edit own review
- admin can moderate reviews

### Reputation Module
Purpose: show reputation score, evolution, and leaderboard.
Components:
- `ReputationBadge`
- `ReputationStatsCard`
- `LeaderboardTable`
- `ReputationTrendChart`

API Endpoints consumed:
- `GET /reputation/me`
- `GET /reputation/:userId`
- `GET /reputation/leaderboard`

Loading states:
- reputation card skeleton
- leaderboard loading spinner

Empty states:
- no reputation data yet

Error states:
- reputation not found
- network error

Permissions:
- authenticated user can read all reputation data

### Contribution Module
Purpose: display contribution balance, transaction history, and redemption.
Components:
- `BalanceCard`
- `ContributionTransactionList`
- `RedemptionForm`
- `ContributionInfoPanel`

API Endpoints consumed:
- `GET /contribution/me`
- `GET /contribution/me/transactions`
- `POST /contribution/redeem`

Loading states:
- balance loading indicator
- transaction list skeleton
- redemption submit spinner

Empty states:
- no transaction history
- zero contribution balance

Error states:
- insufficient balance
- invalid redemption amount
- network error

Permissions:
- user reads and redeems own contribution only

### NEXOS Wallet Module
Purpose: manage internal currency, wallet balance, and transfers.
Components:
- `WalletBalanceCard`
- `NexosTransactionList`
- `TransferForm`
- `SpendCard`

API Endpoints consumed:
- `GET /nexos/me`
- `GET /nexos/me/transactions`
- `POST /nexos/transfer`
- `POST /nexos/spend`

Loading states:
- wallet balance skeleton
- transaction list loading
- transfer submit spinner

Empty states:
- no transaction history
- zero NEXOS balance

Error states:
- insufficient balance
- invalid recipient
- network error

Permissions:
- user manages own wallet

### Admin Module
Purpose: support moderation, audit review, and session verification.
Components:
- `AuditLogTable`
- `ReviewModerationPanel`
- `SessionVerificationList`
- `AdjustmentForm`

API Endpoints consumed:
- `GET /admin/audit-logs`
- `PATCH /admin/reviews/:id`
- `PATCH /admin/sessions/:id/verify`
- `POST /admin/adjustments/contribution`
- `POST /admin/adjustments/nexos`

Loading states:
- admin table skeletons
- moderation action spinner
- audit search loading

Empty states:
- no audit records for filters
- no reviews needing moderation

Error states:
- insufficient permissions
- invalid admin action
- network error

Permissions:
- admin role only

## State Management

### Authentication State
- `AuthContext` stores current user, auth status, and session metadata
- persisted via secure cookies or Supabase session
- `useAuth` hook exposes `user`, `isAuthenticated`, `signIn`, `signOut`, `refreshToken`

### Remote Data Fetching
- Use `SWR` or `React Query` for API data with caching, revalidation, and stale-while-revalidate behavior
- Query keys use resource and filter parameters
- Mutations for create/update/delete operations with optimistic UI where appropriate

### Local UI State
- `useState` for form input, modals, and filters
- `useReducer` for complex form flows (onboarding stepper, multi-step session creation)
- `UIContext` for global message/toast and theme settings

### Global State Considerations
- Minimal global state beyond auth and notifications
- Avoid storing large list data globally; rely on cached API hooks
- `profile`, `dashboard metrics`, and `wallet balance` may have shared context for cross-screen consistency

## Authentication Flow

### Flow summary
1. User visits public route
2. User signs in via `/auth/login` or signs up via `/auth/signup`
3. Supabase Auth returns JWT and user session
4. `AuthProvider` stores session and user metadata
5. On success, user is redirected to `/onboarding` or `/dashboard`
6. AuthGuard protects private routes; unauthenticated users redirected to `/auth/login`
7. Token refresh runs in background or on app load

### Token storage
- Use secure, HTTP-only cookies if backend is same domain
- Otherwise use Supabase auth client with session persistence
- Avoid localStorage for JWT when possible

### Route protection
- `middleware.ts` checks if route requires auth
- Client-side `AuthGuard` ensures session exists before rendering
- Admin routes verify `user.role === 'admin'` or similar claim

### Onboarding gating
- After login, check `GET /profiles/me`
- If profile incomplete, route to `/onboarding`
- Onboarding flow ensures skills and goals exist before allowing discovery

## Onboarding Flow

### Objectives
- collect profile metadata
- capture teaching/learning skills
- define initial learning goals
- prepare user for matching and sessions

### Screens
1. `/onboarding/profile-setup`
   - purpose: collect display name, headline, bio, role intent, availability, location
   - components: `ProfileForm`, progress step indicator
   - API: `PATCH /profiles/me`, `GET /profiles/me`
   - loading: form submission spinner
   - empty: first-time onboarding prompt
   - error: validation feedback, network retry
   - permissions: authenticated user

2. `/onboarding/skills`
   - purpose: declare teaching/learning skills
   - components: `SkillSearch`, `SkillTagPicker`, `UserSkillList`, `SaveButton`
   - API: `GET /skills`, `POST /user-skills`, `GET /user-skills/me`
   - loading: skill catalog skeleton
   - empty: no skills selected yet
   - error: duplicate skill error, invalid proficiency
   - permissions: authenticated user

3. `/onboarding/goals`
   - purpose: create learning goals
   - components: `GoalForm`, `GoalList`, `SkillSelect`
   - API: `POST /learning-goals`, `GET /learning-goals/me`
   - loading: goal list skeleton
   - empty: prompt to add first goal
   - error: invalid goal data
   - permissions: authenticated user

### Completion Criteria
- profile exists and is active
- at least one skill declared
- at least one learning goal created
- user redirected to `/dashboard`

## Dashboard Flow

### Purpose
- provide a central home screen for core activity
- surface matches, sessions, wallet summary, and reputation

### Screen: `/dashboard`
Components:
- `DashboardHero`: welcome, progress status
- `MatchSummaryCard`
- `NextSessionCard`
- `WalletSummaryCard`
- `ReputationSummaryCard`
- `RecentActivityFeed`
- `QuickActionsGrid`

API Endpoints consumed:
- `GET /profiles/me`
- `GET /matches/me?status=pending,accepted`
- `GET /sessions/me?status=scheduled,confirmed`
- `GET /reputation/me`
- `GET /contribution/me`
- `GET /nexos/me`

Loading states:
- dashboard skeleton placeholders
- card-level loaders

Empty states:
- no upcoming sessions
- no matches yet
- prompt to complete onboarding

Error states:
- partial card failures with fallback messages
- full dashboard reload option

Permissions:
- authenticated user

## Matching Flow

### Purpose
- help users discover complementary peers
- make match requests and manage responses

### Primary screens
1. `/matches`
   - purpose: browsing and filtering match candidates
   - components: `MatchFilterPanel`, `MatchRecommendationList`, `MatchCard`, `SortControl`, `PaginationControl`
   - API: `GET /matches/recommendations`, `GET /matches/me`
   - loading: recommendation skeleton, filter loading
   - empty: no candidates, suggestions to broaden filters
   - error: rate limit, network failure, offer retry
   - permissions: authenticated user

2. `/matches/[id]`
   - purpose: view match details and accept/decline
   - components: `MatchDetailPanel`, `UserProfileSummary`, `ActionButtons`, `ReasonSection`
   - API: `GET /matches/me`, `PATCH /matches/:id`
   - loading: detail fetch spinner
   - empty: not applicable; 404 if not found
   - error: unauthorized or invalid action
   - permissions: requester/candidate only

### Matching UX
- support filters by skill, location, availability
- display reputation and completed session counts
- highlight complementary skills and goals
- provide quick accept/decline actions
- rate-limit match generation with UI feedback

## Session Flow

### Purpose
- create, confirm, track, and complete sessions

### Primary screens
1. `/sessions`
   - purpose: list sessions by status
   - components: `SessionList`, `SessionCard`, `StatusTabs`, `CreateSessionButton`
   - API: `GET /sessions/me`
   - loading: session list skeleton
   - empty: no sessions scheduled prompt
   - error: retrieve failure fallback
   - permissions: authenticated user

2. `/sessions/[id]`
   - purpose: view session detail, update status, confirm participation
   - components: `SessionDetailCard`, `ParticipantList`, `StatusTimeline`, `ConfirmButton`, `ReviewPrompt`
   - API: `GET /sessions/me`, `PATCH /sessions/:id`, `POST /sessions/:id/participants`, `GET /sessions/:id/reviews`
   - loading: detail skeleton
   - empty: no participants or no reviews message
   - error: not found or forbidden
   - permissions: owner/participant only

### Session creation
- use `SessionForm` to build session with match or participants
- validate scheduled time, participant roles, and duration
- show availability conflicts if overlap exists
- create session by posting to `/sessions`

### Status flow UI
- show visual timeline: scheduled → confirmed → in progress → completed
- lock status buttons based on transitions
- show verification badge and dispute action

### Confirmation flow
- participants confirm attendance via `/sessions/:id/participants`
- show confirmation status in participant list
- prompt action if not all confirmed

## Reputation Flow

### Purpose
- display reputation and trust signals throughout the app

### Primary screens
1. `/reputation`
   - purpose: show current user reputation and growth metrics
   - components: `ReputationCard`, `ReviewSummary`, `CompletedSessionsCard`
   - API: `GET /reputation/me`
   - loading: reputation card skeleton
   - empty: no reputation history prompt
   - error: retrieval failure
   - permissions: authenticated user

2. `/reputation/leaderboard`
   - purpose: show top users by reputation
   - components: `LeaderboardTable`, `LeaderboardRow`, `SearchBar`
   - API: `GET /reputation/leaderboard`
   - loading: leaderboard skeleton
   - empty: no data
   - error: network failure
   - permissions: authenticated user

3. `/profiles/[id]`
   - purpose: show another user's profile and reputation
   - components: `ProfileOverview`, `ReputationBadge`, `GoalList`, `SkillTags`
   - API: `GET /profiles/:id`, `GET /reputation/:userId`
   - loading: profile skeleton
   - empty: not applicable
   - error: profile not found
   - permissions: authenticated user

### Reputation UX
- surface reputation on profile cards and match cards
- include review count and completed session count
- display contextual tooltips explaining score
- ensure reputation is visible but not overemphasized

## Contribution Flow

### Purpose
- show contribution balance and let users redeem points

### Screen: `/contribution`
Components:
- `ContributionBalanceCard`
- `ContributionTransactionList`
- `RedemptionForm`
- `ContributionTips`

API Endpoints consumed:
- `GET /contribution/me`
- `GET /contribution/me/transactions`
- `POST /contribution/redeem`

Loading states:
- balance loading skeleton
- transactions loading
- redeem button spinner

Empty states:
- no transactions yet
- zero balance call-to-action

Error states:
- insufficient balance
- invalid redemption amount
- network error

Permissions:
- user can only view and redeem own contribution

### UX notes
- explain what contribution points are and how they differ from NEXOS
- surface earned points from sessions and reviews
- provide redemption use cases as placeholders for MVP

## NEXOS Wallet Flow

### Purpose
- manage internal currency and support transfers/spending

### Screen: `/nexos`
Components:
- `WalletSummaryCard`
- `NexosTransactionList`
- `TransferButton`
- `SpendActions`

API Endpoints consumed:
- `GET /nexos/me`
- `GET /nexos/me/transactions`
- `POST /nexos/transfer`
- `POST /nexos/spend`

Loading states:
- wallet skeleton
- transaction list skeleton
- action submit spinner

Empty states:
- no NEXOS activity yet
- zero wallet balance prompt

Error states:
- insufficient balance
- invalid recipient
- network error

Permissions:
- user can only view and operate own wallet

### Transfer flow
- recipient search or paste UUID
- amount input with live balance validation
- confirm details screen before submitting
- success toast with new balance

### Spending flow
- item selector for MVP spend options
- amount validation against balance
- in-app purchase style summary

## Admin Flow

### Purpose
- support moderation, audit, and verification in MVP

### Screens
1. `/admin/audit-logs`
   - components: `AuditLogTable`, `FilterPanel`, `SearchBar`
   - API: `GET /admin/audit-logs`
   - loading: table skeleton
   - empty: no records for filters
   - permissions: admin only

2. `/admin/review-moderation`
   - components: `ReviewModerationList`, `FlagModal`, `ActionSheet`
   - API: `GET /sessions/:id/reviews` (via session view) and `PATCH /admin/reviews/:id`
   - loading: moderation list skeleton
   - empty: no flagged reviews
   - permissions: admin only

3. `/admin/session-verification`
   - components: `SessionVerificationList`, `VerificationPanel`
   - API: `GET /sessions/me` (or admin session query) and `PATCH /admin/sessions/:id/verify`
   - loading: list skeleton
   - empty: no sessions needing verification
   - permissions: admin only

4. `/admin/adjustments`
   - components: `AdjustmentForm`, `AdjustmentHistory`
   - API: `POST /admin/adjustments/contribution`, `POST /admin/adjustments/nexos`
   - loading: form submission loader
   - empty: no adjustment history
   - permissions: admin only

### Admin UX
- admin-only navigation entry
- clear permission boundaries
- confirmation dialogs for destructive actions
- audit trail links from moderation events

## Mobile-first UX

### Breakpoints
- small: < 640px (mobile)
- medium: 641px - 1024px (tablet)
- large: >1024px (desktop)

### Mobile behavior
- stacked layouts with single-column cards
- bottom navigation for primary routes
- touch-friendly inputs and buttons
- autofocus and keyboard behavior optimized for mobile forms
- use collapsible filters and accordions to conserve vertical space

### Responsive design
- `ResponsiveGrid` utility for cards and lists
- sidebars become drawers on mobile
- modals transform into full-screen panels on small devices
- typography scales for readability
- action buttons are full-width on mobile

### Layout consistency
- use shared `Container` component with max width
- consistent spacing and visual hierarchy
- responsive nav and breadcrumb support

## Accessibility Requirements

### Core accessibility standards
- WCAG 2.1 AA compliance as MVP baseline
- keyboard navigation for all interactive elements
- focus-visible outlines and logical tab order
- semantic HTML elements for page structure
- accessible labels for inputs, buttons, toggles, and icons
- ARIA roles where appropriate
- contrast ratios meeting 4.5:1 for body text and 3:1 for large text

### Forms and controls
- use `label` elements linked to inputs
- support error messages with `aria-describedby`
- use accessible custom select and slider components
- provide clear success and error states

### Modals and dialogs
- trap focus inside modal
- close on Escape
- restore focus to trigger element
- announce modal titles with `aria-modal`

### Live regions and feedback
- announce toast messages via ARIA live regions
- update load/error states with accessible text
- ensure dynamic content changes are perceivable

### Data tables and lists
- use accessible table markup for audit logs and leaderboards
- allow row focus and keyboard selection
- present summaries for screen readers

### Testing
- manual keyboard walkthroughs for critical flows
- screen reader validation for onboarding, sessions, and wallet flows
- automated axe or Lighthouse accessibility checks in CI

## Performance Strategy

### Data fetching strategy
- use SSR for initial public pages where appropriate (e.g., `/auth`, `/profiles/[id]`)
- fetch authenticated data client-side after auth is established
- use SWR/React Query cache and revalidate on focus
- batch related requests where possible

### Rendering strategy
- minimize large page bundles by code-splitting routes
- lazy-load non-critical components (admin panels, charts)
- use pure functional components and memoization for lists
- avoid unnecessary re-renders with stable props and keys

### Asset optimization
- serve optimized SVG icons and compressed images
- use CSS variables for theming instead of heavy CSS-in-JS
- minimize third-party libraries and avoid polyfill bloat

### Network optimization
- use HTTP/2 and keep-alive for API calls
- use gzip/ Brotli compression on assets
- cache static assets and public data aggressively
- use request debouncing on live search/filter fields

### Caching and stale data
- cache profile and skill catalog data with longer TTL
- revalidate match and session data frequently
- use optimistic updates for create/patch actions where safe

### Metrics
- measure Time to Interactive (TTI) and First Contentful Paint (FCP)
- monitor bundle size and largest contentful paint (LCP)
- track API latency and error rates

## Error Handling and UX

### Global error handling
- top-level error boundary for rendering failures
- friendly error pages for route failures
- toast notifications for recoverable API errors

### Endpoint-specific errors
- display field-level validation messages in forms
- show inline errors in cards and lists
- provide retry actions in empty/error states

### Loading states
- skeleton loaders for list screens
- inline spinners on buttons and forms
- progressive disclosure for long pages

### Offline and connectivity
- show offline banner when network unavailable
- retry API operations automatically after reconnect
- preserve draft form state in local component state

## Security and Permissions

### Session security
- authenticate users before loading protected routes
- protect admin routes with role check
- avoid storing auth tokens in localStorage when possible

### RLS alignment
- frontend builds UI around backend RLS policies
- do not expose controls for unauthorized actions
- hide admin navigation for non-admin users

### Input sanitization
- validate client-side and rely on backend validation
- escape arbitrary text in UI to prevent injection

## Summary

The frontend architecture for NexoLearn MVP V1 is a mobile-first, modular React application that maps directly to the backend service boundaries and API specification. It separates authentication, onboarding, matching, sessions, reputation, contribution, wallet, and admin workflows into distinct feature modules, supports responsive UI and accessibility, and uses data-driven loading/empty/error states for a consistent user experience.
