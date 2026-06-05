# PRISMA_SCHEMA_V1

Date: 2026-06-04

Role: Data Architect

This document translates the MVP V1 PostgreSQL database architecture into a complete Prisma schema design. It includes models, enums, relationships, indexes, and constraints.

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum RoleIntent {
  learner
  host
  both
}

enum UserSkillRole {
  teach
  learn
  both
}

enum GoalStatus {
  active
  paused
  completed
}

enum MatchStatus {
  pending
  accepted
  declined
  cancelled
  expired
}

enum SessionStatus {
  scheduled
  confirmed
  in_progress
  completed
  cancelled
  no_show
}

enum VerificationStatus {
  unverified
  verified
  disputed
}

enum ParticipantRole {
  host
  learner
  observer
}

enum ReviewStatus {
  draft
  published
  flagged
  removed
}

enum ContributionTransactionType {
  earned
  redeemed
  adjustment
}

enum TransactionStatus {
  posted
  pending
  reversed
}

enum NexosTransactionType {
  session_reward
  internal_transfer
  spend
  adjustment
}

enum AuditAction {
  create
  update
  delete
  flag
  resolve
}

model AuthUser {
  id       String    @id @default(uuid()) @db.Uuid
  profile  Profile?

  @@map("auth.users")
}

model Profile {
  id                     String                    @id @default(uuid()) @db.Uuid
  userId                 String                    @unique @db.Uuid
  displayName            String
  headline               String?
  bio                    String?
  roleIntent             RoleIntent
  availability           Json?
  location               String?
  isActive               Boolean                   @default(true)
  createdAt              DateTime                  @default(now()) @db.Timestamptz(6)
  updatedAt              DateTime                  @default(now()) @db.Timestamptz(6)

  authUser               AuthUser?                 @relation(fields: [userId], references: [id])
  userSkills             UserSkill[]
  learningGoals          LearningGoal[]
  requestedMatches       Match[]                   @relation("MatchRequester")
  candidateMatches       Match[]                   @relation("MatchCandidate")
  ownedSessions          ExchangeSession[]         @relation("SessionOwner")
  sessionParticipants    SessionParticipant[]
  reviewsWritten         SessionReview[]           @relation("ReviewReviewer")
  reviewsReceived        SessionReview[]           @relation("ReviewReviewee")
  reputationScore        ReputationScore?
  contributionBalance    ContributionBalance?
  nexosWallet            NexosWallet?
  auditLogs              AuditLog[]

  @@index([isActive])
  @@index([availability], type: Gin)
  @@map("profiles")
}

model Skill {
  id           String        @id @default(uuid()) @db.Uuid
  name         String
  slug         String        @unique
  category     String?
  createdAt    DateTime      @default(now()) @db.Timestamptz(6)

  userSkills   UserSkill[]
  learningGoals LearningGoal[]

  @@index([name])
  @@map("skills")
}

model UserSkill {
  id           String          @id @default(uuid()) @db.Uuid
  userId       String          @db.Uuid
  skillId      String          @db.Uuid
  proficiency  Int             @db.SmallInt
  role         UserSkillRole
  createdAt    DateTime        @default(now()) @db.Timestamptz(6)

  profile      Profile         @relation(fields: [userId], references: [userId])
  skill        Skill           @relation(fields: [skillId], references: [id])

  @@unique([userId, skillId, role])
  @@index([userId])
  @@index([skillId])
  @@index([skillId, role])
  @@map("user_skills")
}

model LearningGoal {
  id           String      @id @default(uuid()) @db.Uuid
  userId       String      @db.Uuid
  title        String
  description  String?
  skillId      String?     @db.Uuid
  status       GoalStatus  @default(active)
  priority     Int         @default(1) @db.SmallInt
  createdAt    DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt    DateTime    @default(now()) @db.Timestamptz(6)

  profile      Profile     @relation(fields: [userId], references: [userId])
  skill        Skill?      @relation(fields: [skillId], references: [id])
  matches      Match[]

  @@index([userId])
  @@index([status])
  @@index([skillId])
  @@map("learning_goals")
}

model Match {
  id             String        @id @default(uuid()) @db.Uuid
  requesterId    String        @db.Uuid
  candidateId    String        @db.Uuid
  goalId         String?       @db.Uuid
  status         MatchStatus
  score          Decimal?      @db.Decimal(5, 2)
  reason         String?
  createdAt      DateTime      @default(now()) @db.Timestamptz(6)
  updatedAt      DateTime      @default(now()) @db.Timestamptz(6)

  requester      Profile       @relation("MatchRequester", fields: [requesterId], references: [userId])
  candidate      Profile       @relation("MatchCandidate", fields: [candidateId], references: [userId])
  goal           LearningGoal? @relation(fields: [goalId], references: [id])
  sessions       ExchangeSession[]

  @@unique([requesterId, candidateId, goalId])
  @@index([requesterId])
  @@index([candidateId])
  @@index([status])
  @@map("matches")
}

model ExchangeSession {
  id                 String                 @id @default(uuid()) @db.Uuid
  matchId            String?                @db.Uuid
  ownerId            String                 @db.Uuid
  title              String
  description        String?
  scheduledAt        DateTime?
  durationMinutes    Int?                   @db.Integer
  status             SessionStatus         @default(scheduled)
  verificationStatus VerificationStatus    @default(unverified)
  confirmationToken  String?
  createdAt          DateTime               @default(now()) @db.Timestamptz(6)
  updatedAt          DateTime               @default(now()) @db.Timestamptz(6)

  match              Match?                 @relation(fields: [matchId], references: [id])
  owner              Profile                @relation("SessionOwner", fields: [ownerId], references: [userId])
  participants       SessionParticipant[]
  reviews            SessionReview[]
  contributionTransactions ContributionTransaction[]
  nexosTransactions  NexosTransaction[]

  @@index([matchId])
  @@index([ownerId])
  @@index([status])
  @@index([scheduledAt])
  @@map("exchange_sessions")
}

model SessionParticipant {
  id          String          @id @default(uuid()) @db.Uuid
  sessionId   String          @db.Uuid
  userId      String          @db.Uuid
  role        ParticipantRole
  confirmed   Boolean         @default(false)
  joinedAt    DateTime?
  createdAt   DateTime        @default(now()) @db.Timestamptz(6)

  session     ExchangeSession @relation(fields: [sessionId], references: [id])
  profile     Profile         @relation(fields: [userId], references: [userId])

  @@unique([sessionId, userId])
  @@index([sessionId])
  @@index([userId])
  @@index([sessionId, role])
  @@map("session_participants")
}

model SessionReview {
  id          String      @id @default(uuid()) @db.Uuid
  sessionId   String      @db.Uuid
  reviewerId  String      @db.Uuid
  revieweeId  String      @db.Uuid
  rating      Int         @db.SmallInt
  comments    String?
  status      ReviewStatus @default(published)
  createdAt   DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime    @default(now()) @db.Timestamptz(6)

  session     ExchangeSession @relation(fields: [sessionId], references: [id])
  reviewer    Profile         @relation("ReviewReviewer", fields: [reviewerId], references: [userId])
  reviewee    Profile         @relation("ReviewReviewee", fields: [revieweeId], references: [userId])

  @@unique([sessionId, reviewerId, revieweeId])
  @@index([sessionId])
  @@index([reviewerId])
  @@index([revieweeId])
  @@index([status])
  @@map("session_reviews")
}

model ReputationScore {
  id                String   @id @default(uuid()) @db.Uuid
  userId            String   @unique @db.Uuid
  score             Decimal  @default("0.000") @db.Decimal(8, 3)
  reviewCount       Int      @default(0)
  completedSessions Int      @default(0)
  updatedAt         DateTime @default(now()) @db.Timestamptz(6)

  profile           Profile  @relation(fields: [userId], references: [userId])

  @@index([score])
  @@map("reputation_scores")
}

model ContributionBalance {
  id         String                   @id @default(uuid()) @db.Uuid
  userId     String                   @unique @db.Uuid
  balance    Decimal                  @default("0.0000") @db.Decimal(18, 4)
  updatedAt  DateTime                 @default(now()) @db.Timestamptz(6)

  profile    Profile                  @relation(fields: [userId], references: [userId])
  transactions ContributionTransaction[]

  @@index([balance])
  @@map("contribution_balances")
}

model ContributionTransaction {
  id         String                @id @default(uuid()) @db.Uuid
  balanceId  String                @db.Uuid
  sessionId  String?               @db.Uuid
  userId     String                @db.Uuid
  amount     Decimal               @db.Decimal(18, 4)
  type       ContributionTransactionType
  reference  String?
  status     TransactionStatus     @default(posted)
  createdAt  DateTime              @default(now()) @db.Timestamptz(6)

  balance    ContributionBalance   @relation(fields: [balanceId], references: [id])
  session    ExchangeSession?      @relation(fields: [sessionId], references: [id])
  profile    Profile               @relation(fields: [userId], references: [userId])

  @@index([balanceId])
  @@index([userId])
  @@index([sessionId])
  @@index([type])
  @@index([status])
  @@index([userId, createdAt])
  @@map("contribution_transactions")
}

model NexosWallet {
  id         String             @id @default(uuid()) @db.Uuid
  userId     String             @unique @db.Uuid
  balance    Decimal            @default("0.0000") @db.Decimal(18, 4)
  updatedAt  DateTime           @default(now()) @db.Timestamptz(6)

  profile    Profile            @relation(fields: [userId], references: [userId])
  transactions NexosTransaction[]

  @@index([balance])
  @@map("nexos_wallets")
}

model NexosTransaction {
  id         String             @id @default(uuid()) @db.Uuid
  walletId   String             @db.Uuid
  sessionId  String?            @db.Uuid
  userId     String             @db.Uuid
  amount     Decimal            @db.Decimal(18, 4)
  type       NexosTransactionType
  reference  String?
  status     TransactionStatus  @default(posted)
  createdAt  DateTime           @default(now()) @db.Timestamptz(6)

  wallet     NexosWallet        @relation(fields: [walletId], references: [id])
  session    ExchangeSession?   @relation(fields: [sessionId], references: [id])
  profile    Profile            @relation(fields: [userId], references: [userId])

  @@index([walletId])
  @@index([userId])
  @@index([sessionId])
  @@index([type])
  @@index([status])
  @@index([userId, createdAt])
  @@map("nexos_transactions")
}

model AuditLog {
  id         String      @id @default(uuid()) @db.Uuid
  actorId    String?     @db.Uuid
  entity     String
  entityId   String?
  action     AuditAction
  details    Json?
  createdAt  DateTime    @default(now()) @db.Timestamptz(6)

  actor      Profile?    @relation(fields: [actorId], references: [userId])

  @@index([actorId])
  @@index([entity])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

## Model Explanations

### `AuthUser`
Represents the Supabase authentication user record in the `auth.users` schema. It provides a one-to-one relation to `Profile` and enables Prisma to model the external auth user reference.

### `Profile`
Central user profile record. Stores display metadata, role intent, availability, and active status. It links to auth identity and drives relationships across skills, goals, matches, sessions, reviews, reputation, wallets, and audit logs.

### `Skill`
Normalized skill catalog. Each row defines a skill name, stable slug, and optional category for search and matching.

### `UserSkill`
Joins `Profile` to `Skill` with proficiency and intent metadata. The unique composite constraint enforces one record per user/skill/role combination.

### `LearningGoal`
Captures an individual user’s learning objective, optional skill focus, priority, and lifecycle state. Goals are used to scope match recommendations.

### `Match`
Represents a candidate match between a requester and a candidate profile, optionally scoped to a learning goal. It tracks match status, score, and reason metadata.

### `ExchangeSession`
Models the scheduled exchange event, including its owner, optional originating match, status, verification state, and timing details.

### `SessionParticipant`
Connects users to sessions and records their participation role, confirmation state, and join timestamp.

### `SessionReview`
Stores reviewer feedback for a session, including rating and comments. Review uniqueness ensures one review per reviewer/reviewee pair per session.

### `ReputationScore`
Aggregate reputation record for each user. It stores score, review count, and completed session count for fast read performance.

### `ContributionBalance`
Tracks the current contribution point balance per user, with a one-to-one relationship to `Profile`.

### `ContributionTransaction`
Ledger of contribution balance movements. Transactions reference a contribution balance, optional session, and user.

### `NexosWallet`
Tracks internal NEXOS currency holdings per user. It is the wallet aggregate for NEXOS-based activity.

### `NexosTransaction`
Ledger of NEXOS token movements tied to a wallet, optional session, and user. It supports session rewards, internal transfers, spending, and adjustments.

### `AuditLog`
Immutable record of administrative or system actions. It stores actor context, impacted entity metadata, action type, and structured details.

## Relationship Summary

- `Profile` belongs to `AuthUser`.
- `Profile` has many `UserSkill`, `LearningGoal`, `Match` (as requester and candidate), `ExchangeSession` (as owner), `SessionParticipant`, `SessionReview` (reviewer and reviewee), and `AuditLog`.
- `Skill` has many `UserSkill` and `LearningGoal`.
- `Match` references two `Profile` records and an optional `LearningGoal`, and may produce multiple `ExchangeSession` records.
- `ExchangeSession` references `Match`, `Profile` owner, and has many `SessionParticipant`, `SessionReview`, `ContributionTransaction`, and `NexosTransaction` records.
- `SessionReview` links a reviewer and reviewee `Profile` to a single `ExchangeSession`.
- `ReputationScore`, `ContributionBalance`, and `NexosWallet` each have a one-to-one relation with `Profile`.
- Transaction records belong to a balance/wallet and optionally reference an `ExchangeSession`.
- `AuditLog` optionally links to an acting `Profile`.

## Index and Constraint Strategy

- Unique constraints enforce one-to-one ownership (`Profile.userId`, `ReputationScore.userId`, `ContributionBalance.userId`, `NexosWallet.userId`).
- Composite uniqueness prevents duplicate user skill entries and duplicate session review submissions.
- Indexes support frequent filter paths such as active status, match status, session schedule, and transaction lookups.
- JSONB availability indexing is captured via a GIN index on `Profile.availability` for eligibility and availability queries.

This Prisma schema is a direct translation of the MVP V1 database architecture and is intended for use as the authoritative database model in Prisma-backed application work.
