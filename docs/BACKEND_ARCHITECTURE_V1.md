# BACKEND_ARCHITECTURE_V1

Date: 2026-06-04

Role: Backend Architect

This document defines the complete backend architecture for NexoLearn MVP V1. It covers services, repositories, domain logic, event flows, settlement, and operational boundaries.

## Overview

The backend is organized into a service layer built on Prisma ORM, with a repository pattern for data access, domain services for business logic, and event-driven settlement and audit flows.

Architecture style: layered hexagonal (ports and adapters), with clear boundaries between API, domain, data, and external services.

Framework: Next.js API Routes or NestJS (both supported by this architecture). Database: PostgreSQL via Supabase. Authentication: Supabase Auth with RLS enforcement.

## Architectural Layers

### 1. API Layer (Request Handlers / Controllers)
Next.js: `/api/` route handlers
NestJS: Controllers with route decorators

Responsibilities:
- Parse and validate HTTP requests
- Invoke domain services
- Format and return responses
- Handle HTTP-level error mapping
- Log request/response traces

Security:
- Enforce Supabase auth middleware
- Extract `user_id` from JWT or session
- Validate scope and permissions
- Prevent direct database queries

### 2. Domain Service Layer
Stateless services encapsulating business logic.

Responsibilities:
- Orchestrate workflows across repositories
- Enforce business rules and invariants
- Emit events for side effects (reputation updates, wallet settlement)
- Validate input and compute derived state

Transactions:
- Service methods should be transaction-safe
- Use Prisma `$transaction()` for multi-step operations
- Rollback on validation failure

### 3. Repository Layer
Data access objects wrapping Prisma models.

Responsibilities:
- Abstract Prisma queries into semantic methods
- Enforce RLS and row-level access control
- Support querying, creating, updating, deleting records
- Provide bulk operations where needed

### 4. Domain Models and Events
In-memory representations of business entities and event records.

Responsibilities:
- Represent domain state clearly
- Emit events for side effects
- Encapsulate invariants

### 5. Background Job / Event Handler Layer
Async processing for settlement, reputation, and audit operations.

Responsibilities:
- Process settlement events
- Recompute reputation scores
- Log audit events
- Retry failed operations
- Ensure exactly-once semantics

## Service Definitions

### AuthenticationService
Manages user identity and Supabase session.

Responsibilities:
- Validate Supabase JWT token
- Extract user claims
- Manage session state
- Verify user existence and profile completeness

Inputs:
- Supabase JWT token (from request header)
- User context (Supabase user ID)

Outputs:
- Authenticated user object (id, email, metadata)
- Error if token invalid or user not found

Dependencies:
- Supabase client
- ProfileRepository

Security:
- All API endpoints must call this service to establish user context
- Enforce user_id matching in RLS checks

---

### ProfileService
Manages user profile creation, updates, and discovery.

Responsibilities:
- Create profile on user registration
- Update profile metadata and role intent
- List discoverable profiles for matching
- Manage profile active/inactive status
- Support public profile reads for peer discovery

Inputs:
- User ID (from auth context)
- Profile data (display name, headline, bio, role intent, availability, location)

Outputs:
- Profile record
- List of profiles matching filter criteria
- Error if validation fails

Dependencies:
- ProfileRepository
- AuthenticationService

Domain Logic:
- One profile per user_id (enforced by database unique constraint)
- Profile must exist before user can participate in skills, goals, or sessions
- Only profile owner may update their own profile (except for admin role)
- Availability is stored as JSONB; can be queried for scheduling compatibility

---

### SkillService
Manages the skill taxonomy and user skill declarations.

Responsibilities:
- Maintain normalized skill catalog
- Support skill search by name, category, slug
- Allow users to declare skills with proficiency and role (teach, learn, both)
- Support skill deletion and re-assignment during profile evolution

Inputs:
- Skill name, category, slug (for skill creation by admin/system)
- User ID, skill ID, proficiency level, role (for user skill assignment)

Outputs:
- Skill records
- User skill assignments
- Error if skill not found or user cannot declare

Dependencies:
- SkillRepository
- UserSkillRepository
- ProfileRepository

Domain Logic:
- Skill slug must be unique and URL-safe
- User proficiency is 1-5 scale
- User role determines intent: teach, learn, or both
- Unique constraint on (user_id, skill_id, role) prevents duplicates
- Skill deletion cascades to user_skill and learning_goal references

---

### LearningGoalService
Manages user learning objectives.

Responsibilities:
- Create and manage learning goals
- Link goals to optional skill focus
- Support goal status lifecycle (active, paused, completed)
- Retrieve goals for matching engine input

Inputs:
- User ID
- Goal title, description, skill ID (optional), priority, status

Outputs:
- Goal record
- List of user's goals
- Error if validation fails

Dependencies:
- LearningGoalRepository
- SkillRepository
- ProfileRepository

Domain Logic:
- Goal must belong to an active profile
- Goal status drives eligibility for matching recommendations
- Priority is 1-5 scale for sorting preferences
- Only goal owner may update; others may read for discovery

---

### MatchService
Generates and manages candidate matches.

Responsibilities:
- Compute match recommendations based on complementary skills/goals
- Store match records with status and scoring
- Allow match acceptance, decline, cancellation
- Retrieve matches for user dashboard

Inputs:
- User ID (requester)
- Optional goal context for scope
- Matching filter criteria (skill, location, availability)

Outputs:
- Match records
- Match score (0-100 scale)
- Error if validation fails

Dependencies:
- MatchRepository
- ProfileRepository
- UserSkillRepository
- LearningGoalRepository
- ReputationScoreRepository

Matching Algorithm:
- Score based on skill complementarity (user A's teach matches user B's learn)
- Factor in reputation and review count for quality signal
- Apply location proximity if applicable
- Rank by recency of skill updates and goal creation
- Penalize expired or recently declined matches

Match Status:
- pending: awaiting response
- accepted: match accepted, ready for session creation
- declined: user declined match
- cancelled: initiator cancelled
- expired: match older than 30 days and still pending (async job)

Domain Logic:
- Matches are directional: requester -> candidate
- Requester is the user seeking a match; candidate receives notification
- Unique constraint on (requester_id, candidate_id, goal_id) prevents duplicate match requests
- Match score is optional and can be recomputed as profiles evolve

---

### ExchangeSessionService
Manages session lifecycle: creation, confirmation, status updates, verification.

Responsibilities:
- Create session from match or standalone
- Confirm session and notify participants
- Update session status (scheduled, confirmed, in_progress, completed, cancelled, no_show)
- Manage session verification state
- Generate confirmation tokens for verification
- Support session history and discovery

Inputs:
- Match ID or user IDs (for standalone session)
- Session metadata (title, description, scheduled time, duration)
- Participant role mapping
- Status updates

Outputs:
- ExchangeSession record
- SessionParticipant records
- Confirmation token
- Error if validation fails

Dependencies:
- ExchangeSessionRepository
- SessionParticipantRepository
- MatchRepository
- ProfileRepository
- AuditService

Domain Logic:
- Session owner is the initiator
- At least one host and one learner must be enrolled (enforced in application)
- Session status flow: scheduled -> confirmed -> in_progress -> completed (or cancelled/no_show at any point)
- Verification status: unverified -> verified (or disputed if flagged)
- Confirmation token is generated on creation and used for email verification
- Session scheduled time drives calendar and availability conflict detection
- Only participants and owner may read session details
- Session completion is prerequisite for review and settlement

---

### SessionReviewService
Manages post-session feedback and rating capture.

Responsibilities:
- Allow participants to submit reviews
- Validate review data and uniqueness
- Support review status (draft, published, flagged, removed)
- Retrieve reviews for profile reputation and session history
- Flag inappropriate reviews for moderation

Inputs:
- Session ID
- Reviewer ID and Reviewee ID (both must be session participants)
- Rating (1-5)
- Comments

Outputs:
- SessionReview record
- Flagged review notifications
- Error if validation fails

Dependencies:
- SessionReviewRepository
- ExchangeSessionRepository
- SessionParticipantRepository
- ReputationUpdateEventBus

Domain Logic:
- One review per reviewer/reviewee pair per session
- Rating is 1-5 numeric scale
- Comments optional but recommended
- Review uniqueness enforced on (session_id, reviewer_id, reviewee_id)
- Review status defaults to published
- Admin/moderation role may flag or remove reviews
- Review submission triggers reputation recalculation event

---

### ReputationService
Computes and updates user reputation scores.

Responsibilities:
- Calculate aggregate reputation from reviews and session history
- Update ReputationScore records
- Support reputation lookup for matching and display
- Handle reputation recalculation on new reviews or session completions

Inputs:
- User ID
- Triggering event (new review, completed session, moderation flag)

Outputs:
- ReputationScore record
- Numeric reputation score
- Error if computation fails

Dependencies:
- ReputationScoreRepository
- SessionReviewRepository
- ExchangeSessionRepository
- ProfileRepository

Reputation Formula:
- Base score: average of all published reviews (1-5 scale) * 20 (resulting in 0-100 scale)
- Modifier: +5 for each completed session (capped at +50)
- Penalty: -10 for each removed/flagged review
- Minimum score: 0
- ReputationScore.reviewCount = count of published reviews
- ReputationScore.completedSessions = count of sessions with status = completed

Update Triggers:
- New review published
- Review flagged or removed by moderator
- Session status changes to completed
- Admin override

---

### ContributionService
Manages contribution point accounting.

Responsibilities:
- Maintain current contribution balance per user
- Record contribution transactions (earned, redeemed, adjustment)
- Calculate contribution awards for completed sessions and reviews
- Support balance lookup and transaction history
- Ensure balance never goes negative

Inputs:
- User ID
- Transaction type (earned, redeemed, adjustment)
- Amount
- Session or reference context
- Actor (for audit trail)

Outputs:
- Updated ContributionBalance
- ContributionTransaction record
- Error if balance would go negative or amount invalid

Dependencies:
- ContributionBalanceRepository
- ContributionTransactionRepository
- ExchangeSessionRepository
- SessionReviewRepository
- AuditService

Domain Logic:
- Contribution balance is a 1-to-1 with Profile; created on profile creation
- Initial balance is 0
- Earned contributions: +10 points for completed session (both host and learner)
- Redeemed contributions: -N points if user spends or bookmarks content
- Adjustments: admin override for corrections or bonuses
- Transaction status: posted (confirmed), pending (waiting for settlement), reversed (correction)
- ACID transaction ensures balance updates and transaction log are atomic

---

### NexosWalletService
Manages internal NEXOS currency holdings and transactions.

Responsibilities:
- Maintain NEXOS wallet balance per user
- Record NEXOS transactions (session reward, internal transfer, spend, adjustment)
- Calculate NEXOS rewards for session completion
- Support wallet balance lookup and transaction history
- Ensure balance never goes negative
- Support internal NEXOS transfers between users

Inputs:
- User ID
- Transaction type (session_reward, internal_transfer, spend, adjustment)
- Amount
- Session or recipient context
- Actor (for audit trail)

Outputs:
- Updated NexosWallet
- NexosTransaction record
- Error if balance insufficient, recipient invalid, or amount invalid

Dependencies:
- NexosWalletRepository
- NexosTransactionRepository
- ExchangeSessionRepository
- AuditService

Domain Logic:
- NEXOS wallet is 1-to-1 with Profile; created on profile creation
- Initial balance is 0
- Session rewards: one participant (host or learner, logic TBD) receives +5 NEXOS per completed session
- Internal transfers: user A sends N NEXOS to user B (both wallets updated atomically)
- Spend: user reduces balance for in-platform upgrades or features (transaction cost debited)
- Adjustments: admin override for corrections or incentives
- Transaction status: posted (confirmed), pending (waiting for settlement), reversed (correction)
- ACID transaction ensures atomicity across sender and receiver wallets

---

### MatchingEngineService
Orchestrates the matching algorithm and match generation.

Responsibilities:
- Implement matching algorithm based on skill complementarity, reputation, and goals
- Generate match candidates for a user
- Rank candidates by score
- Store match records
- Support on-demand and batch matching

Inputs:
- User ID (requester)
- Filter criteria (skill focus, location, availability window, reputation minimum)
- Batch size or single-match mode

Outputs:
- List of Match records with scores
- Error if no candidates found or computation fails

Dependencies:
- MatchRepository
- UserSkillRepository
- LearningGoalRepository
- ProfileRepository
- ReputationScoreRepository

Matching Algorithm:
1. Find profiles with complementary skills:
   - User A teaches skill S1 with proficiency >= 3
   - User B learns skill S1
   - Score: proficiency * 10
2. Cross-check user B's teaching skills against user A's learning goals:
   - Bidirectional scoring
3. Apply reputation signal:
   - Multiply by (reputation_score / 100) as quality weight
4. Apply location proximity (if location data available):
   - Nearby users boosted by +10
5. Apply availability overlap:
   - Shared time slots boosted by +5
6. Sort by total score descending
7. Filter out recent matches, declined matches, and expired matches
8. Limit to top N candidates (default 10)

---

### AuditService
Logs all significant system events and administrative actions.

Responsibilities:
- Record create, update, delete, flag, and resolve actions
- Capture actor, entity, and structured details
- Support audit log query and export
- Enable compliance and debugging

Inputs:
- Actor ID (user or system service)
- Entity type and ID
- Action type
- Structured details (JSONB)

Outputs:
- AuditLog record
- Error if validation fails

Dependencies:
- AuditLogRepository
- ProfileRepository

Domain Logic:
- AuditLog is append-only; no updates or deletes
- Details field is JSONB for flexible schema
- Actor may be null for system-initiated actions
- Audit logs are written asynchronously to avoid blocking main request
- Admin role has read access to all audit logs
- Non-admin users may read audit logs for their own records only

Audit Events:
- Profile created, updated, deleted, flagged
- Session created, status updated, cancelled, completed
- Review published, flagged, removed
- Match created, updated, expired
- Wallet transaction, balance adjustment
- Reputation recalculated
- Administrative actions (ban, restore, override)

---

## Repository Definitions

Each repository wraps Prisma queries and enforces RLS and access control.

### ProfileRepository
Query patterns:
- `getByUserId(userId)`: single profile lookup
- `getById(id)`: public profile lookup
- `listActive(filter)`: discover active profiles with optional skill/location filter
- `create(userData, profileData)`: transactional profile + auth creation
- `update(userId, data)`: update own profile
- `setActive(userId, isActive)`: deactivate profile

RLS checks:
- SELECT: all authenticated users (public discovery)
- UPDATE: only if user_id = auth.uid()
- INSERT: if user_id = auth.uid() and no existing profile
- DELETE: never (soft delete via is_active flag)

### SkillRepository
Query patterns:
- `getById(id)`: skill lookup
- `getBySlug(slug)`: skill lookup by slug
- `listAll(category)`: list skills with optional category filter
- `search(query)`: full-text search on skill name
- `create(name, slug, category)`: admin-only
- `update(id, data)`: admin-only
- `delete(id)`: admin-only (cascades to user_skills)

RLS checks:
- SELECT: all authenticated users
- INSERT/UPDATE/DELETE: admin or service role only

### UserSkillRepository
Query patterns:
- `getByUserAndSkill(userId, skillId, role)`: single user skill
- `listByUser(userId, role)`: user's teach/learn/both skills
- `listBySkill(skillId, role)`: users teaching/learning skill
- `create(userId, skillId, proficiency, role)`: user declares skill
- `update(userId, skillId, role, data)`: user updates proficiency
- `delete(userId, skillId, role)`: user removes skill

RLS checks:
- SELECT: user's own skills or public discovery
- INSERT/UPDATE/DELETE: only if user_id = auth.uid()

### LearningGoalRepository
Query patterns:
- `getById(id)`: goal lookup
- `listByUser(userId, status)`: user's goals with optional status filter
- `listActive()`: all active goals (for matching)
- `create(userId, data)`: user creates goal
- `update(userId, id, data)`: user updates goal
- `setStatus(userId, id, status)`: user changes goal status
- `delete(userId, id)`: user deletes goal

RLS checks:
- SELECT: own goals, or all goals for matching service
- INSERT/UPDATE/DELETE: only if user_id = auth.uid()

### MatchRepository
Query patterns:
- `getById(id)`: match lookup
- `listByRequester(userId, status)`: matches user initiated
- `listByCandidate(userId, status)`: matches user received
- `listByUser(userId, status)`: all matches for user
- `create(requesterId, candidateId, goalId, data)`: create new match
- `update(id, data)`: update match status/score
- `search(filters)`: find matches by criteria

RLS checks:
- SELECT: if user is requester or candidate
- INSERT: service role or requester user
- UPDATE: service role or requester user

### ExchangeSessionRepository
Query patterns:
- `getById(id)`: session lookup
- `listByOwner(ownerId, status)`: sessions owned by user
- `listByUser(userId, status)`: sessions where user is participant (via join)
- `listScheduled(from, to)`: sessions in time window (for conflict detection)
- `create(ownerId, data)`: create session
- `update(id, data)`: update session
- `setStatus(id, status)`: update session status
- `setVerificationStatus(id, status)`: update verification status

RLS checks:
- SELECT: if user is session owner or participant
- INSERT: if owner_id = auth.uid()
- UPDATE: if owner_id = auth.uid() or user is participant (limited fields)

### SessionParticipantRepository
Query patterns:
- `getById(id)`: participant record lookup
- `listBySession(sessionId)`: all participants in session
- `listByUser(userId)`: all sessions user participates in
- `getBySessionAndUser(sessionId, userId)`: single participant
- `create(sessionId, userId, role)`: add participant
- `update(id, data)`: update participant status (confirmed, joined_at)
- `delete(id)`: remove participant

RLS checks:
- SELECT: if user is owner or participant in session
- INSERT/UPDATE: session owner or service role
- DELETE: session owner or service role

### SessionReviewRepository
Query patterns:
- `getById(id)`: review lookup
- `getBySessionAndReviewer(sessionId, reviewerId)`: single review
- `listBySession(sessionId)`: all reviews for session
- `listByReviewee(userId)`: all reviews about user
- `listByReviewer(userId)`: all reviews by user
- `create(data)`: reviewer creates review
- `update(id, data)`: update review (status, comments)
- `setStatus(id, status)`: change review status

RLS checks:
- SELECT: if user is reviewer, reviewee, or session participant
- INSERT: if reviewer_id = auth.uid() and is session participant
- UPDATE: reviewer or admin (moderation)

### ReputationScoreRepository
Query patterns:
- `getByUser(userId)`: reputation lookup
- `listTopByScore(limit)`: top-ranked users
- `create(userId)`: initialize reputation (score 0)
- `update(userId, data)`: update score/counts

RLS checks:
- SELECT: all authenticated users (public)
- INSERT/UPDATE: service role only

### ContributionBalanceRepository
Query patterns:
- `getByUser(userId)`: balance lookup
- `create(userId)`: initialize balance (0)
- `update(userId, balance)`: update balance
- `incrementBalance(userId, amount)`: add amount
- `decrementBalance(userId, amount)`: subtract amount (with validation)

RLS checks:
- SELECT: own balance only (except aggregates for admin)
- INSERT/UPDATE: service role only

### ContributionTransactionRepository
Query patterns:
- `getById(id)`: transaction lookup
- `listByUser(userId, status, type)`: user's transactions with filters
- `listByBalance(balanceId)`: balance's transaction history
- `listBySession(sessionId)`: transactions tied to session
- `create(data)`: record transaction
- `setStatus(id, status)`: update status

RLS checks:
- SELECT: own transactions only
- INSERT: service role only
- UPDATE: service role or moderation role

### NexosWalletRepository
Query patterns:
- `getByUser(userId)`: wallet lookup
- `create(userId)`: initialize wallet (0)
- `update(userId, balance)`: update balance
- `incrementBalance(userId, amount)`: add amount
- `decrementBalance(userId, amount)`: subtract amount (with validation)

RLS checks:
- SELECT: own wallet only
- INSERT/UPDATE: service role only

### NexosTransactionRepository
Query patterns:
- `getById(id)`: transaction lookup
- `listByUser(userId, status, type)`: user's transactions with filters
- `listByWallet(walletId)`: wallet's transaction history
- `listBySession(sessionId)`: transactions tied to session
- `create(data)`: record transaction
- `setStatus(id, status)`: update status

RLS checks:
- SELECT: own transactions only
- INSERT: service role only
- UPDATE: service role or moderation role

### AuditLogRepository
Query patterns:
- `getById(id)`: log lookup
- `listByEntity(entity, entityId)`: audit trail for entity
- `listByActor(actorId)`: actions by user
- `search(filters)`: search by criteria
- `create(data)`: append log entry

RLS checks:
- SELECT: admin/audit role only (except own logs for non-admin)
- INSERT: service role only
- UPDATE/DELETE: never

---

## Domain Logic and Workflows

### User Registration and Onboarding Flow
1. Supabase Auth signup (AuthenticationService validates token)
2. ProfileService.createProfile(userId, displayName, roleIntent)
   - Creates profile record
   - Initializes ReputationScore (0)
   - Initializes ContributionBalance (0)
   - Initializes NexosWallet (0)
   - Emits ProfileCreated event
3. User fills out skills (SkillService.declareSkill)
   - UserSkill records created
   - Matching index updated
4. User creates learning goal (LearningGoalService.createGoal)
   - LearningGoal record created
5. User appears in matching feeds upon first matching run

---

### Session Creation and Participation Flow
1. MatchService identifies candidate match
2. User accepts match (MatchService.acceptMatch)
   - Match status -> accepted
3. ExchangeSessionService.createSession(matchId, ownerData, participants)
   - Session record created with owner_id, match_id, status=scheduled
   - Confirmation token generated
   - SessionParticipant records created for host and learner
   - Email notifications sent
4. Participants confirm attendance (ExchangeSessionService.confirmParticipant)
   - SessionParticipant.confirmed -> true
   - Session status -> confirmed when all confirmed
5. Session occurs
6. ExchangeSessionService.setStatus(sessionId, completed)
   - Session status -> completed
   - Triggers SettlementEventBus.onSessionCompleted(sessionId)

---

### Session Completion and Settlement
Triggered by: ExchangeSessionService.setStatus(sessionId, completed)

1. ExchangeSession status -> completed
2. SettlementEventBus.onSessionCompleted(sessionId) emitted
3. Background job handler processes event:
   a. Fetch session and participants
   b. Validate session ready for settlement
   c. For each participant:
      - Emit ReputationUpdateEvent (defer to reputation job)
      - Emit ContributionAwardEvent
      - Emit NexosRewardEvent (logic TBD for host vs learner)
   d. Mark session as settled (via metadata flag)

Contribution Settlement:
- Each participant earns +10 contribution points
- ContributionService.recordTransaction(userId, earned, amount=10, session_id)

NEXOS Settlement:
- Host receives +5 NEXOS (or configurable amount)
- Learner receives +0 NEXOS (or optional participation reward)
- NexosWalletService.recordTransaction(userId, session_reward, amount=5, session_id)

---

### Review Submission and Reputation Update Flow
1. SessionReviewService.submitReview(sessionId, reviewerId, revieweeId, rating, comments)
   - Validates reviewer and reviewee are both session participants
   - Creates SessionReview record (status=published)
   - Emits ReviewPublishedEvent
2. Background job handler processes ReviewPublishedEvent:
   a. ReputationService.recalculateReputation(revieweeId)
   b. Fetches all published reviews for reviewee
   c. Computes reputation score
   d. Updates ReputationScore record
   e. Emits ReputationUpdatedEvent (for audit/logging)

Reputation Recalculation:
- Average published reviews (1-5 scale) * 20 = base score (0-100)
- +5 per completed session (capped at +50)
- -10 per flagged/removed review
- Max 150, Min 0

---

### Matching Algorithm Execution
Triggered by: background job or on-demand API call

1. MatchingEngineService.generateMatches(userId, filters)
2. For each active user without recent matches:
   a. Query skills, goals, reputation
   b. Find complementary users
   c. Score candidates
   d. Create Match records
   e. Emit MatchCreatedEvent
3. Matches expire after 30 days if not accepted (async expiration job)

Matching triggers:
- On-demand: user requests matches via API
- Scheduled: daily batch matching for all active users
- Event-driven: when user profile or skills change

---

### Contribution Redemption Flow
1. User initiates redemption or feature purchase
2. ContributionService.redeemContribution(userId, amount, reason)
   - Validates sufficient balance
   - Records transaction (redeemed)
   - Updates balance
   - Emits ContributionRedeemedEvent
   - Returns confirmation

---

### NEXOS Transfer Flow
1. Sender initiates transfer: NexosWalletService.transfer(senderId, recipientId, amount)
2. Validate:
   - Sender has sufficient balance
   - Recipient exists and is active
   - Amount > 0
3. Create transaction pair (atomic):
   - NexosTransaction for sender (spend)
   - NexosTransaction for recipient (receive)
4. Update both wallet balances atomically (Prisma $transaction)
5. Emit TransferCompletedEvent
6. Return confirmation

---

### Moderation and Flagging Flow
1. Admin flags review or session: AuditService.flagEntity(entityType, entityId, reason)
   - Creates audit log with action=flag
   - Sets entity status to flagged
   - Emits FlaggedEvent
2. Background job handles flagged review:
   - Admin reviews flag reason
   - Admin resolves flag:
     a. Remove review (status=removed)
     b. Dismiss flag (status=published again)
3. If review removed: ReputationService.recalculateReputation(revieweeId)
4. AuditService.resolveFlag(flagId, resolution, details)
   - Creates audit log with action=resolve
   - Emits ResolvedEvent

---

## Event Flows and Background Jobs

### Event Bus Pattern
Events are emitted by domain services and consumed by background job handlers. Events are stored in a simple event log or queue.

Event types:
- ProfileCreated
- SkillDeclared
- GoalCreated
- MatchCreated, MatchAccepted, MatchDeclined, MatchExpired
- SessionCreated, SessionConfirmed, SessionCompleted, SessionCancelled, SessionNoShow
- ReviewPublished, ReviewFlagged, ReviewRemoved
- ReputationRecalculated
- ContributionEarned, ContributionRedeemed, ContributionAdjusted
- NexosAwarded, NexosTransferred, NexosAdjusted
- EntityFlagged, EntityResolved

### Background Job Handlers

#### SessionSettlementJob
Trigger: SessionCompleted event
Frequency: immediate or batched every 5 minutes

Responsibilities:
- Fetch completed sessions not yet settled
- For each session:
  - Validate status and participants
  - Award contribution points (each participant +10)
  - Award NEXOS to host (+5)
  - Emit settlement confirmation event
  - Mark session as settled

Error handling:
- Log failures for manual review
- Retry on transient errors (max 3 attempts)
- Dead-letter unresolvable failures

---

#### ReputationUpdateJob
Trigger: ReviewPublished, SessionCompleted, ReviewRemoved, AdminAdjustment
Frequency: immediate or batched every minute

Responsibilities:
- Fetch pending reputation updates
- For each user:
  - Recalculate reputation from scratch (to avoid drift)
  - Update ReputationScore record
  - Emit ReputationUpdatedEvent
  - Track last_updated timestamp

Formula:
- Base: average(published_reviews) * 20
- Bonus: +5 per completed_session (capped at +50)
- Penalty: -10 per removed_review
- Range: [0, 150]

Error handling:
- Log calculation errors
- Fallback to previous score if computation fails
- Alert on drift detection

---

#### MatchExpirationJob
Trigger: scheduled (hourly or daily)
Frequency: daily at off-peak time

Responsibilities:
- Find matches older than 30 days with status=pending
- Set status to expired
- Emit MatchExpiredEvent
- Update match UI accordingly

---

#### AuditLoggingJob
Trigger: all domain events
Frequency: near-real-time

Responsibilities:
- Consume audit-relevant events
- Transform events into audit log records
- Insert AuditLog records
- Emit AuditLogCreatedEvent for compliance

Events to log:
- Session status changes
- Review submissions and flags
- Wallet transactions
- Reputation updates
- Administrative actions

---

#### ContributionReconciliationJob
Trigger: scheduled (weekly)
Frequency: weekly

Responsibilities:
- Audit contribution balances vs transaction ledger
- Detect and log drift
- For significant drift:
  - Create audit log for investigation
  - Alert admin
  - Propose correction transaction

---

#### NexosWalletReconciliationJob
Trigger: scheduled (weekly)
Frequency: weekly

Responsibilities:
- Audit NEXOS wallet balances vs transaction ledger
- Detect and log drift
- For significant drift:
  - Create audit log for investigation
  - Alert admin
  - Propose correction transaction

---

## Session Settlement Logic

### Settlement State Machine
```
Session Status Flow:
scheduled -> confirmed -> in_progress -> completed
         \-> cancelled (at any point)
         \-> no_show (if not confirmed before scheduled time)

Verification Status Flow:
unverified -> verified
          \-> disputed (flagged for review)
```

### Settlement Preconditions
1. Session status = completed
2. At least one review submitted
3. Participants present (SessionParticipant.confirmed = true for at least host and learner)
4. No disputes or flags

### Settlement Transactions
For each completed session:
1. Host contribution: +10 points
2. Learner contribution: +10 points
3. Host NEXOS: +5 (if host earned reward; learner gets +0 by default)
4. Record transaction ledger entries
5. Update balance aggregates
6. Mark session settled

### Idempotency
- Settlement is idempotent: applying twice produces same result
- Use settlement flag to track "already processed"
- If settlement already run, skip (or log duplicate attempt)

---

## Reputation Update Logic

### Reputation Recalculation Algorithm
```
reviews = SessionReview where reviewee_id = target_user AND status = 'published'
sessions = ExchangeSession where owner_id = target_user AND status = 'completed'

base_score = mean(reviews.rating) * 20 if reviews.length > 0 else 0
session_bonus = min(sessions.length * 5, 50)
review_penalties = count(reviews where status = 'flagged' OR status = 'removed') * 10

final_score = clamp(base_score + session_bonus - review_penalties, 0, 150)

ReputationScore.score = final_score
ReputationScore.reviewCount = reviews.length
ReputationScore.completedSessions = sessions.length
ReputationScore.updatedAt = now()
```

### Reputation Triggers
- New review published
- Review removed or flagged
- Session marked completed
- Admin manual adjustment
- Scheduled recalculation (weekly)

### Reputation Display
- Public reputation score visible on profile (0-150)
- Review count visible
- Completed session count visible
- Cannot be negative

---

## Contribution Accounting Logic

### Contribution Balance Model
```
initial_balance = 0

transaction_types:
  - earned: +N (from session completion, bonuses)
  - redeemed: -N (user spends points)
  - adjustment: +/- N (admin correction, bonus)

balance = sum(all transactions where status = 'posted')

constraints:
  - balance >= 0
  - balance updated atomically with transaction insert
```

### Contribution Awards
- Session completion: +10 points per participant
- Bonus: +5 points for 5-star review (optional)
- Milestone: +25 points for 10 completed sessions (optional)

### Contribution Redemptions
- User may redeem points for in-platform features
- Redemption types: TBD (feature upgrades, premium matches, etc.)

---

## NEXOS Wallet Operations

### Wallet State Model
```
initial_balance = 0

transaction_types:
  - session_reward: +N (from session completion)
  - internal_transfer: +/- N (user-to-user transfer)
  - spend: -N (user purchases feature or item)
  - adjustment: +/- N (admin correction)

balance = sum(all transactions where status = 'posted')

constraints:
  - balance >= 0
  - balance updated atomically with transaction insert
```

### NEXOS Awards
- Session reward: configurable amount (default +5 NEXOS to host)
- Bonus: optional rewards for milestones or referrals

### NEXOS Spending
- Internal only (no fiat conversion in MVP)
- User may transfer NEXOS to other users
- User may spend NEXOS on features (e.g., premium match, priority booking)

### NEXOS Transfer Logic
```
transfer(sender_id, recipient_id, amount):
  validate sender_balance >= amount
  validate recipient_exists and is_active
  validate amount > 0
  
  tx := begin_transaction()
    sender_wallet.balance -= amount
    recipient_wallet.balance += amount
    
    create NexosTransaction(sender, spend, amount)
    create NexosTransaction(recipient, receive, amount)
  tx.commit()
  
  emit TransferCompletedEvent
```

---

## Matching Engine Logic

### Matching Algorithm
```
for_user_id = userId requesting matches

candidate_users = active users excluding user_id
matches = []

for candidate in candidate_users:
  if recent_match(for_user_id, candidate):
    continue  // skip if match exists in last 30 days
  
  score = 0
  
  // Skill complementarity
  user_teach_skills = UserSkill where user_id = for_user_id AND role IN ('teach', 'both')
  candidate_learn_goals = LearningGoal where user_id = candidate AND status = 'active'
  
  for user_skill in user_teach_skills:
    for goal in candidate_learn_goals:
      if goal.skill_id = user_skill.skill_id:
        score += user_skill.proficiency * 10
        break
  
  // Reverse: candidate teaches user learns
  candidate_teach = UserSkill where user_id = candidate AND role IN ('teach', 'both')
  user_goals = LearningGoal where user_id = for_user_id AND status = 'active'
  
  for cand_skill in candidate_teach:
    for goal in user_goals:
      if goal.skill_id = cand_skill.skill_id:
        score += cand_skill.proficiency * 10
        break
  
  // Reputation signal
  cand_reputation = ReputationScore where user_id = candidate
  score *= (cand_reputation.score / 100)
  
  // Location proximity (if available)
  if proximity_match(for_user_id, candidate):
    score += 10
  
  // Availability overlap
  if availability_overlap(for_user_id, candidate):
    score += 5
  
  if score > 0:
    matches.append({ candidate_id: candidate, score: score })

// Sort by score descending
matches.sort((a, b) => b.score - a.score)

// Limit to top N
for match in matches[0:10]:
  MatchService.createMatch(for_user_id, match.candidate_id, match.score)

return matches
```

### Matching Triggers
- On-demand: user clicks "Find Matches" button
- Scheduled: background job daily for all active users
- Event-driven: when user updates skills or goals

### Matching Constraints
- No self-matches (requester_id != candidate_id)
- No duplicate active matches within 30 days
- Both users must have active profiles
- Both users must have complementary skills/goals
- Minimum score threshold (configurable, default 20)

---

## Audit Logging Strategy

### Audit Trail Design
All significant events are logged to AuditLog table.

### Audit Events
```
entity types: profile, skill, user_skill, learning_goal, match, session, review, 
              reputation, contribution, nexos_wallet, admin_action

actions: create, update, delete, flag, resolve

audit_log entry = {
  id: UUID,
  actor_id: UUID (who performed action),
  entity: string (profile, session, etc.),
  entity_id: UUID (primary key of affected record),
  action: enum (create, update, delete, flag, resolve),
  details: JSONB (before/after state, reason, metadata),
  created_at: timestamp (immutable)
}
```

### Audit Events to Capture
- Session status changes (esp. completed, cancelled, no_show)
- Review submissions and moderation (flag, remove)
- Reputation recalculation (score change, trigger)
- Wallet transactions (award, transfer, spend)
- Administrative overrides (ban, restore, adjustment)
- Matching algorithm runs and results

### Audit Log Queries
- Retrieve audit trail for entity
- Retrieve all actions by actor
- Search by date range, action type, entity type
- Export audit logs for compliance

### Audit Log Retention
- All logs retained indefinitely (no deletion)
- Logs are append-only, immutable
- Admin/audit role has read access

---

## Folder Structure

### Directory Layout
```
backend/
├── src/
│   ├── api/
│   │   ├── routes/                          # Next.js: /api; NestJS: controllers
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.route.ts
│   │   ├── profile/
│   │   │   ├── profile.controller.ts
│   │   │   └── profile.routes.ts
│   │   ├── skill/
│   │   │   ├── skill.controller.ts
│   │   │   └── skill.routes.ts
│   │   ├── learning-goal/
│   │   │   ├── learning-goal.controller.ts
│   │   │   └── learning-goal.routes.ts
│   │   ├── match/
│   │   │   ├── match.controller.ts
│   │   │   └── match.routes.ts
│   │   ├── session/
│   │   │   ├── exchange-session.controller.ts
│   │   │   └── exchange-session.routes.ts
│   │   ├── review/
│   │   │   ├── review.controller.ts
│   │   │   └── review.routes.ts
│   │   ├── reputation/
│   │   │   ├── reputation.controller.ts
│   │   │   └── reputation.routes.ts
│   │   ├── contribution/
│   │   │   ├── contribution.controller.ts
│   │   │   └── contribution.routes.ts
│   │   └── nexos/
│   │       ├── nexos.controller.ts
│   │       └── nexos.routes.ts
│   ├── domain/
│   │   ├── services/
│   │   │   ├── authentication.service.ts
│   │   │   ├── profile.service.ts
│   │   │   ├── skill.service.ts
│   │   │   ├── learning-goal.service.ts
│   │   │   ├── match.service.ts
│   │   │   ├── matching-engine.service.ts
│   │   │   ├── exchange-session.service.ts
│   │   │   ├── session-review.service.ts
│   │   │   ├── reputation.service.ts
│   │   │   ├── contribution.service.ts
│   │   │   ├── nexos-wallet.service.ts
│   │   │   └── audit.service.ts
│   │   ├── models/
│   │   │   ├── profile.model.ts
│   │   │   ├── skill.model.ts
│   │   │   ├── match.model.ts
│   │   │   ├── session.model.ts
│   │   │   ├── review.model.ts
│   │   │   └── wallet.model.ts
│   │   └── events/
│   │       ├── event-bus.ts
│   │       ├── event.types.ts
│   │       └── event-emitter.ts
│   ├── data/
│   │   ├── repositories/
│   │   │   ├── profile.repository.ts
│   │   │   ├── skill.repository.ts
│   │   │   ├── user-skill.repository.ts
│   │   │   ├── learning-goal.repository.ts
│   │   │   ├── match.repository.ts
│   │   │   ├── exchange-session.repository.ts
│   │   │   ├── session-participant.repository.ts
│   │   │   ├── session-review.repository.ts
│   │   │   ├── reputation-score.repository.ts
│   │   │   ├── contribution-balance.repository.ts
│   │   │   ├── contribution-transaction.repository.ts
│   │   │   ├── nexos-wallet.repository.ts
│   │   │   ├── nexos-transaction.repository.ts
│   │   │   └── audit-log.repository.ts
│   │   └── prisma/
│   │       ├── schema.prisma              # (mapped to PRISMA_SCHEMA_V1.md)
│   │       └── migrations/
│   ├── infrastructure/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error-handler.middleware.ts
│   │   │   ├── request-logger.middleware.ts
│   │   │   └── rls-enforcer.middleware.ts
│   │   ├── jobs/
│   │   │   ├── session-settlement.job.ts
│   │   │   ├── reputation-update.job.ts
│   │   │   ├── match-expiration.job.ts
│   │   │   ├── audit-logging.job.ts
│   │   │   ├── contribution-reconciliation.job.ts
│   │   │   └── nexos-reconciliation.job.ts
│   │   ├── queue/
│   │   │   ├── event-queue.ts             # Bull/BullMQ or similar
│   │   │   └── job-processor.ts
│   │   ├── cache/
│   │   │   ├── redis-cache.ts
│   │   │   └── cache-keys.ts
│   │   └── logger/
│   │       └── logger.ts
│   ├── common/
│   │   ├── errors/
│   │   │   ├── app-error.ts
│   │   │   └── error-codes.ts
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   └── constants.ts
│   │   ├── types/
│   │   │   ├── request-context.ts
│   │   │   ├── pagination.ts
│   │   │   └── filter.ts
│   │   └── guards/
│   │       ├── auth.guard.ts
│   │       ├── rls.guard.ts
│   │       └── role.guard.ts
│   └── main.ts                            # Application entry point
├── prisma/
│   └── schema.prisma                      # Prisma schema (alt location)
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Module Boundaries

### AuthModule
Exports: AuthenticationService, AuthGuard
Responsible for: JWT validation, user context extraction

### ProfileModule
Exports: ProfileService, ProfileRepository
Responsible for: profile CRUD, discovery, activation

### SkillModule
Exports: SkillService, SkillRepository, UserSkillService, UserSkillRepository
Responsible for: skill taxonomy, user skill declarations

### LearningGoalModule
Exports: LearningGoalService, LearningGoalRepository
Responsible for: goal management, status lifecycle

### MatchModule
Exports: MatchService, MatchRepository, MatchingEngineService
Responsible for: match generation, scoring, recommendations

### SessionModule
Exports: ExchangeSessionService, SessionParticipantService, ExchangeSessionRepository, SessionParticipantRepository
Responsible for: session creation, participant enrollment, status flow

### ReviewModule
Exports: SessionReviewService, SessionReviewRepository
Responsible for: review submission, moderation

### ReputationModule
Exports: ReputationService, ReputationScoreRepository
Responsible for: reputation calculation, caching

### ContributionModule
Exports: ContributionService, ContributionBalanceRepository, ContributionTransactionRepository
Responsible for: contribution accounting, settlement

### NexosModule
Exports: NexosWalletService, NexosWalletRepository, NexosTransactionRepository
Responsible for: wallet management, internal transfers, spending

### AuditModule
Exports: AuditService, AuditLogRepository
Responsible for: audit trail, compliance logging

### EventModule
Exports: EventBus, EventEmitter, event types
Responsible for: event publishing, consumption

### JobModule
Exports: SessionSettlementJob, ReputationUpdateJob, MatchExpirationJob, etc.
Responsible for: background job execution and scheduling

---

## Background Jobs Configuration

### Job Scheduling
Using Bull/BullMQ or similar for job queuing and scheduling.

### Job Definitions
```
SessionSettlementJob:
  trigger: SessionCompleted event or recurring every 5 min
  max_attempts: 3
  backoff: exponential (1s, 2s, 4s)
  timeout: 30s
  priority: high

ReputationUpdateJob:
  trigger: ReviewPublished event or recurring every 1 min
  max_attempts: 3
  backoff: exponential (1s, 2s, 4s)
  timeout: 60s
  priority: high

MatchExpirationJob:
  trigger: scheduled daily at 2 AM UTC
  max_attempts: 1
  timeout: 5 min
  priority: low

AuditLoggingJob:
  trigger: event-driven (async)
  max_attempts: 3
  backoff: exponential
  timeout: 10s
  priority: low

ContributionReconciliationJob:
  trigger: scheduled weekly on Sunday at 1 AM UTC
  max_attempts: 1
  timeout: 10 min
  priority: low

NexosReconciliationJob:
  trigger: scheduled weekly on Sunday at 2 AM UTC
  max_attempts: 1
  timeout: 10 min
  priority: low
```

---

## Security Rules

### Authentication
- All endpoints require Supabase JWT token (except signup/login)
- Token validated via AuthenticationService
- User context extracted and passed to services
- No token bypass for admin or service roles

### Authorization (RLS)
- Supabase RLS policies enforced on all table queries
- Repositories enforce RLS checks before queries
- Services trust repository-enforced RLS
- Admin/service roles bypass RLS only for explicit operations

### Access Control
- Users can only read/write own profile, goals, skills
- Users can only read own balances, wallets, transaction history
- Users can only read matches involving them
- Users can only read sessions they participate in
- Admin/moderation role has broader read access for oversight

### Data Validation
- All inputs validated at API layer (schema validation)
- Services perform business rule validation
- Repositories do not accept unvalidated input
- Database constraints as final safeguard

### Transaction Integrity
- Atomic operations for wallet updates (both sides of transfer)
- Prisma $transaction() for multi-record updates
- Idempotent settlement operations
- No partial state visible between commits

### Audit Trail
- All significant changes logged to AuditLog
- Admin actions explicitly tracked
- Session settlement logged
- Reputation recalculation logged

---

## Transaction Boundaries

### ACID Transactions
Prisma $transaction() used for:
- Profile creation (profile + reputation + contribution + nexos wallets all-or-nothing)
- Session completion and settlement (status update + contribution award + NEXOS award)
- Wallet transfer (both wallets updated atomically)
- Reputation recalculation (score + counts updated together)
- Balance updates (balance + transaction inserted together)

### Isolation Level
PostgreSQL default (READ COMMITTED) suitable for MVP. Upgrade to SERIALIZABLE if concurrency issues arise.

### Deadlock Prevention
- Consistent lock order: Profile -> Match -> Session -> Participant
- Keep transaction duration short (< 1 second)
- Avoid nested transactions where possible

### Failure Handling
- Transient errors (connection, timeout): retry with exponential backoff
- Constraint violations: return semantic error to user (e.g., "insufficient balance")
- Deadlock: retry entire transaction
- Unrecoverable errors: log and escalate to admin

---

## Error Handling Strategy

### Error Categories
- ValidationError: input validation failed
- AuthenticationError: token invalid or missing
- AuthorizationError: user lacks permission
- NotFoundError: resource not found
- ConflictError: business rule violation (e.g., balance insufficient)
- InternalError: unexpected server error

### Error Response Format
```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Contribution balance insufficient for redemption",
    "details": {
      "required": 100,
      "available": 50
    }
  }
}
```

### Logging
- All errors logged with context (user_id, request_id, timestamp)
- Stack traces logged only for InternalError
- Errors >= ERROR level alerted to ops team
- Audit trail maintained for security events

---

## Performance Considerations

### Caching
- Profile data cached (TTL: 5 min)
- Skill catalog cached (TTL: 1 hour)
- Reputation scores cached (TTL: 5 min)
- Recent matches cached (TTL: 1 min)
- Cache invalidated on relevant updates

### Indexing
- Indexes defined in Prisma schema
- Composite indexes for common filter combinations
- Partial indexes for status-based queries
- JSONB GIN index on Profile.availability

### Query Optimization
- Limit result sets with pagination (default 20, max 100)
- Use projection to fetch only needed fields
- Batch queries where possible
- Avoid N+1 queries (use Prisma include/select)

### Rate Limiting
- Per-user rate limits on expensive operations (matching, settlement processing)
- API rate limit: 100 req/min per user (default)
- Matching API: 1 req/min per user
- Admin operations not rate-limited

---

## Scalability Notes

### Current MVP Scope
This architecture scales to ~10K active users with PostgreSQL on a single RDS instance (db.t4.large or similar).

### Bottlenecks to Monitor
- Matching algorithm (quadratic complexity per user)
- Reputation recalculation (full scan per user)
- Session settlement (N participants per session)

### Horizontal Scaling (Post-MVP)
- Background jobs scale via job queue workers
- API layer scales via load balancer
- Database read replicas for reporting
- Cache layer scales via Redis cluster
- Separate read/write PostgreSQL instances (CQRS pattern)

### Vertical Scaling (Short-term)
- Upgrade RDS instance class
- Increase job worker count
- Expand Redis memory

This architecture is designed as a strong foundation for MVP V1 with clear extension points for future optimization.
