# BUILD_PLAN_V1

Date: 2026-06-04

Role: Lead Engineering Manager

This document is the definitive implementation roadmap for NexoLearn MVP V1. It is based on the approved architecture and product scope defined in:
- `NEXOLEARN_OPERATING_SYSTEM.md`
- `MVP_V1_SCOPE.md`
- `DATABASE_V2_MVP.md`
- `PRISMA_SCHEMA_V1.md`
- `BACKEND_ARCHITECTURE_V1.md`
- `API_SPEC_V1.md`
- `FRONTEND_ARCHITECTURE_V1.md`
- `ECONOMY_ENGINE_V1.md`

The implementation assumes a solo founder with GitHub Copilot support, using Next.js, TypeScript, NestJS, PostgreSQL, Prisma, Supabase Auth, Tailwind, Shadcn/UI, and Vercel.

---

## Executive Summary

NexoLearn MVP V1 will be delivered as a single monorepo with a Next.js frontend and a NestJS backend sharing TypeScript contracts. The first 90 days focus on building the exact approved product scope without introducing new features. We will build incrementally in six sprints:
1. Foundation
2. Profiles, Skills, Goals
3. Matching Engine V1
4. Exchange Sessions
5. Reviews, Reputation, Contribution
6. NEXOS Wallet and Launch Readiness

The goal is to ship a production-grade MVP that validates reciprocal knowledge exchange through user profile discovery, matching, session workflows, feedback loops, reputation, contribution points, and an internal NEXOS wallet. Each sprint is scoped to deliver end-to-end functionality, with testing, security, and deployment readiness baked in.

Key execution priorities:
- establish a stable project scaffold and database schema first
- implement backend services, domain logic, and API endpoints in alignment with architecture
- build the frontend flow screen-by-screen, matching backend behavior
- keep contribution and NEXOS systems separate until final integration
- validate with unit, integration, and E2E tests each sprint
- maintain auditability, RLS alignment, and app security throughout

---

## Sprint Plan

### Sprint 1: Foundation

**Sprint Goal**
Establish the monorepo, core infrastructure, authentication, schema, and basic user/profile flow.

**Features Included**
- Monorepo structure for `web` and `api`
- Prisma and PostgreSQL setup
- Supabase Auth integration
- User registration and login
- Profile model creation and basic profile CRUD
- UI shell, auth pages, and protected route scaffolding

**Database Tasks**
- initialize PostgreSQL database container or Supabase project
- create core schema for `profiles`, `auth.users`, `reputation_scores`, `contribution_balances`, `nexos_wallets` tables
- generate initial Prisma schema and client
- define and test RLS rules for profile ownership and authenticated reads

**Backend Tasks**
- scaffold NestJS app, modules, controllers, services
- implement authentication middleware and Supabase JWT validation
- create `AuthModule`, `ProfileModule`, and core app module
- build `ProfileService`, `ProfileRepository`, and `AuthService`
- implement `GET /profiles/me`, `PATCH /profiles/me`, `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`
- add audit logging skeleton

**API Tasks**
- define API contract for auth and profile endpoints
- wire request validation and response formatting
- document auth headers and common error responses

**Frontend Tasks**
- scaffold Next.js app in `apps/web`
- install Tailwind, Shadcn/UI, Supabase client
- build app shell, navigation, layouts, auth pages, and protected route guard
- implement login/signup flows and profile onboarding entry point
- create `AuthContext` and fetch `GET /profiles/me`

**Testing Tasks**
- unit tests for auth and profile services
- integration tests for auth flow and profile endpoints
- frontend component tests for login/signup forms and route guard

**Acceptance Criteria**
- auth registration/login/logout works end-to-end
- authenticated user can create and update own profile
- unauthenticated user cannot access protected routes
- Prisma migrations can be applied and reverted
- frontend displays profile data and handles auth redirection

**Dependencies**
- GitHub repo and monorepo tooling
- PostgreSQL / Supabase Auth project
- Tailwind / Shadcn/UI install

**Estimated Complexity**
Medium

---

### Sprint 2: Profiles + Skills + Learning Goals

**Sprint Goal**
Complete user discovery, skill declaration, and goal management linked to dashboard foundations.

**Features Included**
- profile discovery and search
- skill catalog and user skill management
- learning goal creation and lifecycle
- dashboard summary cards for profile, skills, and goals

**Database Tasks**
- extend schema with `skills`, `user_skills`, and `learning_goals`
- add indexes for skill lookup and goal filtering
- enforce constraints for user skill uniqueness and goal status
- update Prisma schema and run migrations

**Backend Tasks**
- implement `SkillModule` and `LearningGoalModule`
- create `SkillService`, `UserSkillRepository`, `LearningGoalService`
- implement endpoints:
  - `GET /skills`, `GET /skills/:id`
  - `POST /user-skills`, `GET /user-skills/me`, `PATCH /user-skills/:id`, `DELETE /user-skills/:id`
  - `POST /learning-goals`, `GET /learning-goals/me`, `PATCH /learning-goals/:id`, `DELETE /learning-goals/:id`
- add profile discovery API `GET /profiles` and `GET /profiles/:id`
- implement matching visibility filters for skills and goals

**API Tasks**
- define request/response schemas for skills and goals
- ensure validation and permission checks
- add filtering and sorting behavior for `GET /profiles` and `GET /skills`

**Frontend Tasks**
- implement profile discovery screen
- build skill search, tag picker, and skill list UI
- build learning goal creation/editing screens
- add dashboard foundation with summary cards for skills/goals
- integrate `useMatches` and `useGoals` hooks in dashboard

**Testing Tasks**
- unit tests for skill and learning goal services
- integration tests for profile discovery, skill management, and goal management endpoints
- frontend behavior tests for skill selection, goal forms, and dashboard updates

**Acceptance Criteria**
- users can add/edit/delete skills and goals
- matching-relevant profile discovery works with filters
- dashboard surfaces current skills and learning goals
- skill and goal validation prevents invalid data

**Dependencies**
- Sprint 1 completed
- Prisma schema migrated with new tables

**Estimated Complexity**
High

---

### Sprint 3: Matching Engine V1

**Sprint Goal**
Implement the first production-ready matching flow and request lifecycle.

**Features Included**
- match recommendation generation
- match request creation
- match acceptance, decline, cancellation
- match status lifecycle management

**Database Tasks**
- add `matches` table and indexes
- enforce match uniqueness and candidate/requester constraints
- update Prisma schema and migrate

**Backend Tasks**
- implement `MatchModule`, `MatchService`, `MatchRepository`
- create matching algorithm based on skills, goals, reputation, and location
- implement match lifecycle endpoints:
  - `POST /matches`, `GET /matches/me`, `PATCH /matches/:id`
  - `GET /matches/recommendations`
- add async expiry handling for stale pending matches
- integrate match creation with profile/goal validation

**API Tasks**
- document matching endpoints and request validation
- implement rate limits for `/matches/recommendations`
- map match status transitions and permission rules

**Frontend Tasks**
- build `/matches` list and recommendation screens
- build match detail page and action buttons
- implement filters for skill/location/status
- connect match request and accept/decline flows to backend

**Testing Tasks**
- unit tests for matching score algorithm and status transitions
- integration tests for match recommendation and request lifecycle
- frontend interaction tests for match request flow

**Acceptance Criteria**
- match recommendations are returned for authenticated users
- users can create match requests and candidates can accept/decline
- match status updates are enforced correctly
- match API permissions prohibit unauthorized access

**Dependencies**\n- Sprint 2 completed
- profile and goal data available for matching

**Estimated Complexity**
High

---

### Sprint 4: Exchange Sessions

**Sprint Goal**
Deliver end-to-end session workflows from scheduling through verification and completion.

**Features Included**
- session creation from matches or standalone participant lists
- session lifecycle status updates
- participant confirmation flow
- session verification flags and completion handling

**Database Tasks**
- add `exchange_sessions`, `session_participants`, `session_reviews` tables
- include session status and verification fields
- set constraints for participant roles and session ownership
- update Prisma schema and run migrations

**Backend Tasks**
- implement `ExchangeSessionModule`, `SessionParticipantModule`, `SessionReviewModule`
- build `ExchangeSessionService` and `SessionParticipantRepository`
- implement session endpoints:
  - `POST /sessions`, `GET /sessions/me`, `PATCH /sessions/:id`
  - `POST /sessions/:id/participants`
  - `GET /sessions/:id/reviews`
- generate confirmation tokens and verify participant status
- enforce session ownership and participant permissions
- add session completion triggers for settlement wiring

**API Tasks**
- define session payloads, status transitions, and error states
- document participant confirmation and session status semantics
- include `scheduled_at`, `duration_minutes`, and `verification_status`

**Frontend Tasks**
- build sessions overview page and session cards
- build session detail page with participant list, timeline, and confirmation controls
- integrate session creation form and status update UI
- add UX for verification state, no-show, and completed sessions

**Testing Tasks**
- unit tests for session lifecycle state transitions and token generation
- integration tests for session creation, participant confirmation, and completion
- frontend flow tests for scheduling and session detail behavior

**Acceptance Criteria**
- users can schedule sessions and add participants
- session owners and participants can update status appropriately
- verification status changes persist and trigger subsequent settlement logic
- sessions enforce at least one host and one learner

**Dependencies**
- Sprint 3 completed
- match request acceptance flows available

**Estimated Complexity**
High

---

### Sprint 5: Reviews + Reputation + Contribution

**Sprint Goal**
Implement feedback, trust modeling, contribution accounting, and dashboard reputation surfaces.

**Features Included**
- session reviews and moderation state
- reputation score calculation and leaderboard
- contribution point accrual and redemption foundations
- integrated dashboard metrics for reputation and contribution

**Database Tasks**
- add `reputation_scores`, `contribution_transactions`, `contribution_balances` tables
- add reputation and contribution indexes for user lookup
- update Prisma schema and migrate

**Backend Tasks**
- implement `SessionReviewService`, `ReputationService`, `ContributionService`
- create review endpoints:
  - `POST /sessions/:id/reviews`, `GET /sessions/:id/reviews`, `PATCH /reviews/:id`
- create reputation endpoints:
  - `GET /reputation/me`, `GET /reputation/:userId`, `GET /reputation/leaderboard`
- create contribution endpoints:
  - `GET /contribution/me`, `GET /contribution/me/transactions`, `POST /contribution/redeem`
- wire session completion to contribution/reputation settlement events
- add audit logging for reviews and reputation updates

**API Tasks**
- define review validation, uniqueness, and moderation states
- document reputation scoring and leaderboard filters
- define contribution transaction filtering and redemption rules

**Frontend Tasks**
- build review submission and session review list screens
- display reputation badge and leaderboard screens
- build contribution balance and transaction UI
- integrate review-driven reputation and contribution updates into dashboard

**Testing Tasks**
- unit tests for reputation calculation and contribution accounting
- integration tests for review submission, reputation refresh, and contribution posting
- frontend tests for review forms, reputation pages, and transaction listings

**Acceptance Criteria**
- review submissions create review records and trigger reputation recalculation
- reputation endpoints return current scores and leaderboard results
- contribution balances update after completed sessions and review bonuses
- redemption endpoint enforces balance and redemption rules

**Dependencies**
- Sprint 4 completed
- session completion flows operational

**Estimated Complexity**
High

---

### Sprint 6: NEXOS Wallet + MVP Launch Readiness

**Sprint Goal**
Complete the NEXOS wallet economy, admin tools, monitoring, security review, and production launch readiness.

**Features Included**
- NEXOS wallet balances and transactions
- internal transfers and spend flows
- admin audit, review moderation, and session verification tools
- performance, monitoring, security, and deployment readiness

**Database Tasks**
- add `nexos_wallets`, `nexos_transactions`, and `audit_logs` tables
- define wallet transaction types and status fields
- add support for platform wallet or reserve accounting
- update Prisma schema and migrate

**Backend Tasks**
- implement `NexosWalletService`, `AuditService`, and admin modules
- create NEXOS endpoints:
  - `GET /nexos/me`, `GET /nexos/me/transactions`, `POST /nexos/transfer`, `POST /nexos/spend`
- create admin endpoints:
  - `GET /admin/audit-logs`, `PATCH /admin/reviews/:id`, `PATCH /admin/sessions/:id/verify`, `POST /admin/adjustments/contribution`, `POST /admin/adjustments/nexos`
- implement referral reward wiring and NEXOS mint controls per economy design
- add fee sink handling and audit trails for wallet transactions
- integrate monitoring and logging

**API Tasks**
- document wallet and admin endpoints, permissions, and error semantics
- expose NEXOS transaction filters, pagination, and spend validation
- define admin-only route guards and audit log filters

**Frontend Tasks**
- build wallet overview, transaction history, transfer, and spend screens
- build admin screens for audit logs, review moderation, session verification, and adjustments
- build final launch dashboard with metrics and readiness banners
- finalize responsive/mobile-first UI polish and accessibility checks

**Testing Tasks**
- unit tests for wallet settlement, transfer, and admin actions
- integration tests for NEXOS flows, admin restrictions, and audit logs
- end-to-end tests covering user onboarding, matching, session, review, wallet, and admin scenarios
- load tests for critical API endpoints and rate limiting

**Acceptance Criteria**
- NEXOS wallets reflect balances and transaction history accurately
- internal transfers and spend flows work with balance enforcement
- admin tools are accessible only to authorized roles and perform moderation actions
- security review passes and deployment pipeline is configured
- production build deploys to Vercel with working environment variables

**Dependencies**
- Sprint 5 completed
- economy rules from `ECONOMY_ENGINE_V1.md` validated

**Estimated Complexity**
High

---

## File Creation Order

This order ensures a sequential implementation from infrastructure to feature completion.

1. `apps/api/package.json`
2. `apps/web/package.json`
3. `package.json` (monorepo root)
4. `pnpm-workspace.yaml` or `turbo.json`
5. `apps/api/tsconfig.json`
6. `apps/web/tsconfig.json`
7. `apps/api/nest-cli.json`
8. `apps/web/next.config.ts`
9. `apps/web/postcss.config.js`
10. `apps/web/tailwind.config.js`
11. `apps/api/src/main.ts`
12. `apps/api/src/app.module.ts`
13. `apps/api/src/app.controller.ts`
14. `apps/api/src/app.service.ts`
15. `apps/api/src/common/auth/supabase-auth.guard.ts`
16. `apps/api/src/common/auth/jwt.strategy.ts`
17. `apps/api/src/common/interceptors/response.interceptor.ts`
18. `apps/api/src/common/filters/http-exception.filter.ts`
19. `apps/api/src/common/logger/logger.service.ts`
20. `apps/api/src/prisma/prisma.module.ts`
21. `apps/api/src/prisma/prisma.service.ts`
22. `apps/api/src/modules/auth/auth.module.ts`
23. `apps/api/src/modules/auth/auth.controller.ts`
24. `apps/api/src/modules/auth/auth.service.ts`
25. `apps/api/src/modules/profile/profile.module.ts`
26. `apps/api/src/modules/profile/profile.controller.ts`
27. `apps/api/src/modules/profile/profile.service.ts`
28. `apps/api/src/modules/profile/profile.repository.ts`
29. `apps/api/src/modules/skill/skill.module.ts`
30. `apps/api/src/modules/skill/skill.controller.ts`
31. `apps/api/src/modules/skill/skill.service.ts`
32. `apps/api/src/modules/skill/skill.repository.ts`
33. `apps/api/src/modules/goal/goal.module.ts`
34. `apps/api/src/modules/goal/goal.controller.ts`
35. `apps/api/src/modules/goal/goal.service.ts`
36. `apps/api/src/modules/goal/goal.repository.ts`
37. `apps/api/src/modules/match/match.module.ts`
38. `apps/api/src/modules/match/match.controller.ts`
39. `apps/api/src/modules/match/match.service.ts`
40. `apps/api/src/modules/match/match.repository.ts`
41. `apps/api/src/modules/session/session.module.ts`
42. `apps/api/src/modules/session/session.controller.ts`
43. `apps/api/src/modules/session/session.service.ts`
44. `apps/api/src/modules/session/session.repository.ts`
45. `apps/api/src/modules/session-participant/session-participant.repository.ts`
46. `apps/api/src/modules/review/review.module.ts`
47. `apps/api/src/modules/review/review.controller.ts`
48. `apps/api/src/modules/review/review.service.ts`
49. `apps/api/src/modules/review/review.repository.ts`
50. `apps/api/src/modules/reputation/reputation.module.ts`
51. `apps/api/src/modules/reputation/reputation.service.ts`
52. `apps/api/src/modules/contribution/contribution.module.ts`
53. `apps/api/src/modules/contribution/contribution.service.ts`
54. `apps/api/src/modules/nexos/nexos.module.ts`
55. `apps/api/src/modules/nexos/nexos.service.ts`
56. `apps/api/src/modules/admin/admin.module.ts`
57. `apps/api/src/modules/admin/admin.controller.ts`
58. `apps/api/src/modules/admin/admin.service.ts`
59. `apps/api/src/modules/audit/audit.service.ts`
60. `apps/api/src/modules/audit/audit.repository.ts`
61. `apps/api/prisma/schema.prisma`
62. `apps/api/.env.example`
63. `apps/web/app/layout.tsx`
64. `apps/web/app/page.tsx`
65. `apps/web/app/auth/login/page.tsx`
66. `apps/web/app/auth/signup/page.tsx`
67. `apps/web/app/auth/callback/page.tsx`
68. `apps/web/app/onboarding/page.tsx`
69. `apps/web/app/onboarding/profile-setup/page.tsx`
70. `apps/web/app/onboarding/skills/page.tsx`
71. `apps/web/app/onboarding/goals/page.tsx`
72. `apps/web/app/dashboard/page.tsx`
73. `apps/web/app/matches/page.tsx`
74. `apps/web/app/matches/[id]/page.tsx`
75. `apps/web/app/sessions/page.tsx`
76. `apps/web/app/sessions/[id]/page.tsx`
77. `apps/web/app/reviews/[sessionId]/page.tsx`
78. `apps/web/app/reputation/page.tsx`
79. `apps/web/app/reputation/leaderboard/page.tsx`
80. `apps/web/app/contribution/page.tsx`
81. `apps/web/app/nexos/page.tsx`
82. `apps/web/app/nexos/transfer/page.tsx`
83. `apps/web/app/profiles/[id]/page.tsx`
84. `apps/web/app/settings/page.tsx`
85. `apps/web/app/admin/audit-logs/page.tsx`
86. `apps/web/app/admin/review-moderation/page.tsx`
87. `apps/web/app/admin/session-verification/page.tsx`
88. `apps/web/app/admin/adjustments/page.tsx`
89. `apps/web/components/ui/button.tsx`
90. `apps/web/components/ui/input.tsx`
91. `apps/web/components/ui/select.tsx`
92. `apps/web/components/ui/loader.tsx`
93. `apps/web/components/ui/card.tsx`
94. `apps/web/components/layout/app-shell.tsx`
95. `apps/web/components/layout/sidebar.tsx`
96. `apps/web/components/layout/topbar.tsx`
97. `apps/web/components/forms/profile-form.tsx`
98. `apps/web/components/forms/skill-form.tsx`
99. `apps/web/components/forms/goal-form.tsx`
100. `apps/web/components/forms/session-form.tsx`
101. `apps/web/components/forms/review-form.tsx`
102. `apps/web/components/forms/transfer-form.tsx`
103. `apps/web/components/forms/redemption-form.tsx`
104. `apps/web/components/cards/profile-card.tsx`
105. `apps/web/components/cards/match-card.tsx`
106. `apps/web/components/cards/session-card.tsx`
107. `apps/web/components/cards/reputation-card.tsx`
108. `apps/web/components/cards/wallet-card.tsx`
109. `apps/web/components/widgets/loading-state.tsx`
110. `apps/web/components/widgets/empty-state.tsx`
111. `apps/web/components/widgets/error-state.tsx`
112. `apps/web/components/widgets/filter-panel.tsx`
113. `apps/web/hooks/useAuth.ts`
114. `apps/web/hooks/useFetch.ts`
115. `apps/web/hooks/useUserProfile.ts`
116. `apps/web/hooks/useMatches.ts`
117. `apps/web/hooks/useSessions.ts`
118. `apps/web/hooks/useWallet.ts`
119. `apps/web/lib/api/client.ts`
120. `apps/web/lib/api/auth.ts`
121. `apps/web/lib/api/profiles.ts`
122. `apps/web/lib/api/skills.ts`
123. `apps/web/lib/api/goals.ts`
124. `apps/web/lib/api/matches.ts`
125. `apps/web/lib/api/sessions.ts`
126. `apps/web/lib/api/reviews.ts`
127. `apps/web/lib/api/reputation.ts`
128. `apps/web/lib/api/contribution.ts`
129. `apps/web/lib/api/nexos.ts`
130. `apps/web/lib/api/admin.ts`
131. `apps/web/lib/state/auth-context.tsx`
132. `apps/web/lib/state/ui-context.tsx`
133. `apps/web/lib/state/notification-context.tsx`
134. `apps/web/lib/validations/auth-schema.ts`
135. `apps/web/lib/validations/profile-schema.ts`
136. `apps/web/lib/validations/skill-schema.ts`
137. `apps/web/lib/validations/goal-schema.ts`
138. `apps/web/lib/validations/session-schema.ts`
139. `apps/web/lib/validations/review-schema.ts`
140. `apps/web/lib/validations/transfer-schema.ts`
141. `apps/web/lib/validations/redemption-schema.ts`
142. `apps/web/styles/globals.css`
143. `apps/web/styles/variables.css`
144. `apps/web/styles/layout.css`
145. `apps/web/styles/utilities.css`
146. `apps/web/types/api.ts`
147. `apps/web/types/models.ts`
148. `apps/web/types/ui.ts`
149. `apps/web/types/errors.ts`
150. `apps/api/src/modules/economy/economy.service.ts`
151. `apps/api/src/modules/economy/economy.module.ts`

---

## Database Migration Order

1. Initial authentication/profile schema.
2. Skills and user skills tables.
3. Learning goals table.
4. Matches table.
5. Exchange sessions and participants tables.
6. Session reviews table.
7. Reputation scores table.
8. Contribution balances and transactions tables.
9. NEXOS wallets and transactions tables.
10. Audit logs and admin support tables.

---

## API Implementation Order

1. Auth endpoints
2. Profile endpoints
3. Skill and user-skill endpoints
4. Learning goal endpoints
5. Profile discovery endpoints
6. Match recommendation and request endpoints
7. Session creation and lifecycle endpoints
8. Session participant confirmation endpoint
9. Review endpoints
10. Reputation endpoints
11. Contribution endpoints
12. NEXOS wallet and transfer endpoints
13. Admin audit and moderation endpoints

---

## Frontend Implementation Order

1. Auth pages and route guard
2. Profile onboarding pages
3. Dashboard foundation
4. Profile discovery and browse pages
5. Skill management screens
6. Goal management screens
7. Match recommendation and detail screens
8. Session list and detail screens
9. Review submission and review list screens
10. Reputation pages and leaderboard
11. Contribution balance and transactions screens
12. NEXOS wallet, transfer, and spend screens
13. Admin tools and audit dashboards

---

## Testing Strategy

### Unit tests
- backend: services, repositories, business rule validation, reward formulas
- frontend: form validation, hooks, component logic, utility functions
- use Jest for api and web packages

### Integration tests
- backend: controller-to-service workflows, Prisma persistence, auth/authorization rules
- use in-memory or dedicated test database with Prisma migrations
- frontend: component interactions with mocked API adapters for auth and data flows

### End-to-end tests
- use Cypress or Playwright against deployed staging build
- cover signup/login, onboarding, match request, session lifecycle, review submission, wallet transfer, and admin moderation
- include authorized and unauthorized path checks

### Continuous testing
- run unit and integration tests on every branch push
- run E2E smoke tests on staging deploys
- enforce coverage for core business paths

---

## Launch Checklist

### Security checklist
- Supabase Auth integration verified
- route guards and admin permissions enforced
- no auth tokens stored in localStorage
- input validation on all backend endpoints
- RLS policies reviewed and tested
- dependency audit completed

### Database checklist
- migrations applied cleanly on staging
- referential integrity validated
- Prisma client generated successfully
- transaction and rollback behavior tested
- migration plan documented for production

### API checklist
- all MVP endpoints implemented and documented
- validation and error responses consistent
- rate limiting applied to critical endpoints
- API explorer or OpenAPI spec available
- endpoints covered by tests

### Frontend checklist
- auth flows complete and protected routes working
- mobile-first responsive UI verified
- loading/empty/error states implemented
- accessibility checks passed (keyboard, screen reader, contrast)
- final navigation and user journeys validated

### Deployment checklist
- Vercel deployment configured for apps/web
- backend deployment target configured (Vercel Functions or dedicated Node service)
- environment variables managed securely
- production build and static optimization validated
- monitoring/logging enabled for staging and production

---

## Technical Risks

### High risk areas
- matching algorithm correctness and performance
- session lifecycle and settlement consistency
- NEXOS wallet atomicity and double-spend risk
- Supabase Auth / RLS integration with NestJS backend
- admin/moderation permissions and audit integrity

### Medium risk areas
- reputation and contribution calculation edge cases
- rate limiting and request throttling behavior
- frontend state management across auth and onboarding
- breakpoints and responsive UI polish for mobile

### Low risk areas
- initial project scaffold and Tailwind/Shadcn setup
- profile CRUD and skill catalog basics
- Prisma schema generation and migration tooling

---

## Final Output

### 1. 90-day roadmap
- Weeks 1-2: Sprint 1 foundation
- Weeks 3-4: Sprint 2 profiles/skills/goals
- Weeks 5-6: Sprint 3 matching engine
- Weeks 7-8: Sprint 4 sessions
- Weeks 9-10: Sprint 5 reviews/reputation/contribution
- Weeks 11-12: Sprint 6 wallet/launch readiness
- Weeks 13-14: polish, QA, and launch stabilization

### 2. Weekly milestones
- Week 1: project scaffolding, auth, profile backend/frontend
- Week 2: Prisma schema, profile discovery, onboarding shell
- Week 3: skill and goal pipelines, dashboard foundation
- Week 4: match recommendation and request flows
- Week 5: session scheduling and status updates
- Week 6: session verification and completion workflows
- Week 7: reviews and reputation surface
- Week 8: contribution accounting and dashboard
- Week 9: NEXOS wallet and transaction history
- Week 10: admin tools and audit flows
- Week 11: security hardening and testing
- Week 12: deployment and launch readiness

### 3. Critical path
- establish auth/profile and schema foundation
- implement matching and session workflows
- wire review/reputation/contribution settlement
- complete wallet economy and admin controls
- validate with integration and E2E tests

### 4. Development priority matrix
- Must have: auth, profile, matching, sessions, reviews, reputation, wallet, launch readiness
- Should have: dashboard summaries, admin moderation, contribution redemption UX, NEXOS transfer polish
- Could have: leaderboard filters, mobile drawer polish, additional contribution sinks
- Won't have: fiat withdrawal, full treasury, AML, global payouts

### 5. Definition of MVP Complete
MVP is complete when:
- all approved backend modules and API endpoints are implemented
- all approved frontend flows are live and user-testable
- auth, profile, matching, sessions, reviews, reputation, contribution, and wallet functions work end-to-end
- system is secured, tested, and deployable to production
- the product supports first 1,000 users with audit logging and admin controls
- no new feature requests are added beyond the approved architecture
