# NexoLearn MVP V1 Scope

Date: 2026-06-04

Role: Product Architect

This document defines the absolute minimum product required to validate NexoLearn with the first 1,000 users.

Assumptions
-----------
- No treasury.
- No fiat withdrawals.
- No AML.
- No global payouts.
- No advanced AI.
- Focus only on core reciprocal knowledge exchange validation.

Keep only
---------
- User Profiles
- Skills
- Learning Goals
- Matching
- Exchange Sessions
- Reviews
- Reputation
- Basic Contribution
- Basic NEXOS Wallet

## Feature Summary

The MVP is designed to validate whether users can:
- create profiles and declare skills,
- define learning goals,
- find relevant peers/hosts,
- run exchange sessions,
- capture feedback,
- earn reputation,
- earn basic contribution value,
- hold and spend NEXOS internally.

## Feature Details

### 1. User Profiles
Reason it exists
- Users must present identity, interests, and teaching/learning intent.
Dependencies
- Authentication
- Profile data storage
- Skill tags
Complexity
- Low
MVP priority
- Critical

### 2. Skills
Reason it exists
- Skills drive matching and session relevance.
Dependencies
- Profile service
- Matching service
Complexity
- Low-Medium
MVP priority
- Critical

### 3. Learning Goals
Reason it exists
- Goals clarify what learners want and help the platform recommend partners.
Dependencies
- Profile service
- Matching service
Complexity
- Medium
MVP priority
- High

### 4. Matching
Reason it exists
- Matching connects learners with hosts and validates exchange demand.
Dependencies
- Profiles, skills, goals, reputation
Complexity
- Medium
MVP priority
- Critical

### 5. Exchange Sessions
Reason it exists
- Sessions are the core product event where teaching and learning happen.
Dependencies
- Matching, profiles, session scheduling, basic verification
Complexity
- Medium
MVP priority
- Critical

### 6. Reviews
Reason it exists
- Reviews capture session quality and enable reputation.
Dependencies
- Sessions, users, reputation engine
Complexity
- Low-Medium
MVP priority
- Critical

### 7. Reputation
Reason it exists
- Reputation builds trust, improves matching, and rewards quality behavior.
Dependencies
- Reviews, sessions, profile state
Complexity
- Medium
MVP priority
- High

### 8. Basic Contribution
Reason it exists
- Contribution value distinguishes reciprocal engagement from pure payment.
Dependencies
- Sessions, reviews, reputation
Complexity
- Medium
MVP priority
- High

### 9. Basic NEXOS Wallet
Reason it exists
- NEXOS enables internal value exchange and helps test the economy model.
Dependencies
- User balance storage, transactions, session settlement
Complexity
- Medium
MVP priority
- High

## 1. MVP Feature List

1. User registration and profile creation
2. Skill declaration and skill tagging
3. Learning goal creation and management
4. Candidate matching based on skills, goals, and reputation
5. Session scheduling, status tracking, and simple verification
6. Post-session reviews and ratings
7. Reputation scoring based on reviews and session completion
8. Contribution points earned from verified sessions
9. Basic internal NEXOS wallet with minting for session rewards and spending within the platform
10. Core activity feed / dashboard showing matches, sessions, balance, and progress
11. Minimal admin/review tooling for dispute and quality monitoring

## 2. MVP Database Schema

Minimal required entities:
- `users`
- `profiles`
- `skills`
- `user_skills`
- `learning_goals`
- `matches`
- `exchange_sessions`
- `session_participants`
- `session_reviews`
- `reputation_scores`
- `contribution_balances`
- `contribution_transactions`
- `nexos_wallets`
- `nexos_transactions`
- `audit_logs`

Notes
- Profiles contain interests, availability, and role metadata.
- Skills are normalized to support matching.
- Sessions are explicit entities with state and participant records.
- Reputation is derived from reviews and completion rates.
- Contribution and NEXOS are separate ledgers for points and internal currency.

## 3. MVP API List

Core REST/HTTP endpoints:
- `POST /auth/signup`
- `POST /auth/login`
- `GET /profile/me`
- `PATCH /profile/me`
- `GET /skills`
- `POST /skills`
- `GET /users?skill=...&goal=...`
- `POST /goals`
- `GET /goals/me`
- `POST /matches`
- `GET /matches/me`
- `POST /sessions`
- `PATCH /sessions/:id/status`
- `GET /sessions/me`
- `POST /sessions/:id/review`
- `GET /sessions/:id/reviews`
- `GET /reputation/me`
- `GET /contribution/me`
- `GET /nexos/me`
- `POST /nexos/transfer` (internal only)
- `GET /dashboard/me`

## 4. MVP UI Pages

- Sign up / login
- Profile setup / edit
- Skill selection and tag management
- Learning goal creation
- Discover / match feed
- Match request / confirmation
- Session calendar / status
- Session details and check-in
- Review submission screen
- Reputation and contribution dashboard
- NEXOS wallet / transaction history
- Basic admin moderation panel

## 5. MVP User Journeys

### Journey 1: New learner onboarding
1. Sign up
2. Complete profile and declare skills
3. Create a learning goal
4. Receive match recommendations
5. Request a session with a host
6. Attend session
7. Submit review
8. See reputation, contribution, and NEXOS updates

### Journey 2: New host onboarding
1. Sign up
2. Complete profile and declare teaching skills
3. Opt into matching as a host
4. Receive session requests
5. Confirm and host session
6. Complete session and receive review
7. Earn reputation, contribution, and NEXOS

### Journey 3: Reciprocal exchange validation
1. Two users with complementary goals/skills match
2. They schedule a session
3. The session is completed and verified
4. Both users submit reviews
5. Both earn reputation/contribution, one earns NEXOS
6. The platform records the experience and improves matching

### Journey 4: Basic economy interaction
1. User views NEXOS balance
2. User spends NEXOS internally to book a premium match or pay for a session upgrade
3. Wallet updates and transaction ledger records the flow

## 6. MVP Success Metrics

Validation metrics for first 1,000 users:
- Activation: % of users who complete profile and declare skills
- Matching: % of active users who receive at least one match within 7 days
- Session completion: % of scheduled sessions that reach `Completed`
- Review submission: % of completed sessions with reviews
- Reputation growth: average reputation increase among active users
- Contribution adoption: % of users earning and redeeming contribution points
- NEXOS activity: % of users with non-zero NEXOS wallet activity
- Retention: 7-day and 30-day active user retention
- Quality signal: average review rating and support for net promoter-like feedback
- Referral/virality proxy: user invites or organic sign-ups driven by experience feedback

## Development Plan (3 months)

### Month 1: Core platform and onboarding
- Build user registration, authentication, and profile flows
- Add skills and learning goal creation
- Implement basic matching and recommendation feed
- Create exchange session model and scheduling workflows
- Build session status flows and simple verification

### Month 2: Feedback, trust, and economy
- Add review submission and reputation scoring
- Implement contribution point earning and validation logic
- Add basic NEXOS wallet and internal transaction ledger
- Build dashboard showing reputation, contribution, and wallet balance
- Add lightweight admin moderation and audit logging

### Month 3: Validation, polish, and launch readiness
- Harden matching and session flows with edge case handling
- Add pagination, API validation, and error handling
- Run first pilot with early testers, capture feedback
- Instrument metrics and dashboard for core success indicators
- Iterate on UX and reduce friction in onboarding and session completion
- Prepare launch plan for first 1,000 users

## MVP Scope Notes

This scope is intentionally minimal and validation-focused. It does not include treasury, fiat payouts, AML/KYC workflows beyond basic identity, global payouts, or advanced AI capabilities.

The goal is to validate the reciprocal knowledge exchange model, the internal NEXOS economy, and the trust/reputation loop with a small early user base.
