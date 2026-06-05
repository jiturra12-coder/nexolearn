# DATABASE_V2_MVP

Date: 2026-06-04

Role: Data Architect

This document defines the complete PostgreSQL database architecture for NexoLearn MVP V1. The design is normalized, Supabase-ready, and prepared for Row-Level Security (RLS).

## Overview

The MVP database supports the following core domains:
- User identity and profile management
- Skill and learning goal modeling
- Candidate matching
- Exchange session lifecycle
- Session reviews and reputation
- Contribution point accounting
- NEXOS wallet and internal transaction ledger
- Audit logging and moderation

The database is designed for production readiness with clear foreign key boundaries, consistency constraints, and indexing for search and reporting.

## ERD Description

The entity relationship model centers on a user profile, skill graph, and exchange session engine.

Primary entities:
- `profiles` stores user identity, role intent, and availability metadata.
- `skills` and `user_skills` normalize the skill taxonomy and permit tagging of users.
- `learning_goals` capture what learners seek from the network.
- `matches` represent recommended or requested pairings between users.
- `exchange_sessions` model the actual session event and its status.
- `session_participants` connect users to sessions and define each participant's role.
- `session_reviews` capture feedback and quality signals.
- `reputation_scores` store aggregate trust values.
- `contribution_balances` and `contribution_transactions` represent the contribution point ledger.
- `nexos_wallets` and `nexos_transactions` model internal currency balances and transaction history.
- `audit_logs` record system-level changes and moderation events.

Cardinalities:
- One `profile` belongs to one authenticated user.
- One user may have many `user_skills` and many `learning_goals`.
- `matches` are linked to two users and one goal context.
- One `exchange_session` may have multiple `session_participants`.
- One completed session may generate one or more `session_reviews`.
- One user has one active `contribution_balance` and one active `nexos_wallet`.
- Transactions are owned by a single balance/wallet and may reference a session or review.

## Table Definitions

### `profiles`
- `id` UUID PK
- `user_id` UUID FK -> `auth.users.id`
- `display_name` TEXT NOT NULL
- `headline` TEXT
- `bio` TEXT
- `role_intent` TEXT NOT NULL CHECK (role_intent IN ('learner', 'host', 'both'))
- `availability` JSONB NULL
- `location` TEXT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `is_active` BOOLEAN NOT NULL DEFAULT true

Notes:
- `user_id` is unique to enforce one profile per authenticated user.
- `availability` can hold schedule metadata as a JSONB object.

Indexes:
- Primary key on `id`
- Unique index on `user_id`
- B-tree index on `is_active`
- GIN index on `availability` if availability-based search is needed.

RLS:
- Allow users to select/update own profile.
- Allow read by all authenticated users for matching discovery.
- Prevent updates by other users.

### `skills`
- `id` UUID PK
- `name` TEXT NOT NULL
- `slug` TEXT NOT NULL UNIQUE
- `category` TEXT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Notes:
- Normalized skill catalog.
- `slug` ensures unique lookup and stable references.

Indexes:
- Primary key on `id`
- Unique index on `slug`
- B-tree index on `name`

RLS:
- Readable by all authenticated users.
- Writable only by admin or system service.

### `user_skills`
- `id` UUID PK
- `user_id` UUID NOT NULL FK -> `profiles.user_id`
- `skill_id` UUID NOT NULL FK -> `skills.id`
- `proficiency` SMALLINT NOT NULL CHECK (proficiency BETWEEN 1 AND 5)
- `role` TEXT NOT NULL CHECK (role IN ('teach', 'learn', 'both'))
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Constraints:
- Unique constraint on (`user_id`, `skill_id`, `role`)

Indexes:
- Primary key on `id`
- B-tree indexes on `user_id`, `skill_id`
- Composite index on (`skill_id`, `role`)

RLS:
- Allow users to insert/select/delete own skill records.
- Allow admin read/write for moderation.

### `learning_goals`
- `id` UUID PK
- `user_id` UUID NOT NULL FK -> `profiles.user_id`
- `title` TEXT NOT NULL
- `description` TEXT NULL
- `skill_id` UUID NULL FK -> `skills.id`
- `status` TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed'))
- `priority` SMALLINT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5)
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes:
- Primary key on `id`
- B-tree index on `user_id`
- B-tree index on `status`
- B-tree index on `skill_id`

RLS:
- Allow users to manage own goals.
- Allow read access by matching engine and peers.

### `matches`
- `id` UUID PK
- `requester_id` UUID NOT NULL FK -> `profiles.user_id`
- `candidate_id` UUID NOT NULL FK -> `profiles.user_id`
- `goal_id` UUID NULL FK -> `learning_goals.id`
- `status` TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired'))
- `score` NUMERIC(5,2) NULL
- `reason` TEXT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Constraints:
- Check `requester_id <> candidate_id`
- Unique constraint on (`requester_id`, `candidate_id`, `goal_id`)

Indexes:
- Primary key on `id`
- B-tree indexes on `requester_id`, `candidate_id`, `status`
- Partial index on `status` for active matches

RLS:
- Allow access to matches where the user is requester or candidate.
- Allow admin read/write for moderation.
- Allow internal matching service to insert and update pairings.

### `exchange_sessions`
- `id` UUID PK
- `match_id` UUID NULL FK -> `matches.id`
- `owner_id` UUID NOT NULL FK -> `profiles.user_id`
- `title` TEXT NOT NULL
- `description` TEXT NULL
- `scheduled_at` TIMESTAMPTZ NULL
- `duration_minutes` INT NULL CHECK (duration_minutes > 0)
- `status` TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'))
- `verification_status` TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'disputed'))
- `confirmation_token` TEXT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes:
- Primary key on `id`
- B-tree indexes on `match_id`, `owner_id`, `status`, `scheduled_at`

RLS:
- Allow users to access sessions where they are enrolled participants.
- Allow session creator to update status and schedule.
- Allow admin moderation.

### `session_participants`
- `id` UUID PK
- `session_id` UUID NOT NULL FK -> `exchange_sessions.id`
- `user_id` UUID NOT NULL FK -> `profiles.user_id`
- `role` TEXT NOT NULL CHECK (role IN ('host', 'learner', 'observer'))
- `confirmed` BOOLEAN NOT NULL DEFAULT false
- `joined_at` TIMESTAMPTZ NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Constraints:
- Unique constraint on (`session_id`, `user_id`)
- Check that at least one host and one learner exist for a valid session should be enforced in application/scheduling logic.

Indexes:
- Primary key on `id`
- B-tree indexes on `session_id`, `user_id`
- Composite index on (`session_id`, `role`)

RLS:
- Allow participants to select the session membership records for their own sessions.
- Allow session owner access to participant list.
- Admin may read all.

### `session_reviews`
- `id` UUID PK
- `session_id` UUID NOT NULL FK -> `exchange_sessions.id`
- `reviewer_id` UUID NOT NULL FK -> `profiles.user_id`
- `reviewee_id` UUID NOT NULL FK -> `profiles.user_id`
- `rating` SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5)
- `comments` TEXT NULL
- `status` TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'flagged', 'removed'))
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Constraints:
- Check `reviewer_id <> reviewee_id`
- Unique constraint on (`session_id`, `reviewer_id`, `reviewee_id`)

Indexes:
- Primary key on `id`
- B-tree indexes on `session_id`, `reviewer_id`, `reviewee_id`, `status`

RLS:
- Allow reviewers to insert/select their own reviews.
- Allow reviewee to select reviews about them.
- Allow session participants to read reviews for the session.
- Allow admin moderation of flagged/removed reviews.

### `reputation_scores`
- `id` UUID PK
- `user_id` UUID NOT NULL FK -> `profiles.user_id`
- `score` NUMERIC(8,3) NOT NULL DEFAULT 0.000
- `review_count` INT NOT NULL DEFAULT 0
- `completed_sessions` INT NOT NULL DEFAULT 0
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Constraints:
- Unique constraint on `user_id`
- Check `score >= 0`

Indexes:
- Primary key on `id`
- Unique index on `user_id`
- B-tree index on `score`

Notes:
- This table is an aggregate store for fast reputation lookup.
- Recompute from reviews and session history on write.

RLS:
- Allow users to select own reputation score.
- Allow read access for matching and discovery.
- Allow admin updates from scoring engine.

### `contribution_balances`
- `id` UUID PK
- `user_id` UUID NOT NULL FK -> `profiles.user_id`
- `balance` NUMERIC(18,4) NOT NULL DEFAULT 0.0000
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Constraints:
- Unique constraint on `user_id`
- Check `balance >= 0`

Indexes:
- Primary key on `id`
- Unique index on `user_id`
- B-tree index on `balance`

RLS:
- Allow users to select their own contribution balance.
- Allow system service to update balances.
- Prevent users from reading other user balances except via aggregated metrics.

### `contribution_transactions`
- `id` UUID PK
- `balance_id` UUID NOT NULL FK -> `contribution_balances.id`
- `session_id` UUID NULL FK -> `exchange_sessions.id`
- `user_id` UUID NOT NULL FK -> `profiles.user_id`
- `amount` NUMERIC(18,4) NOT NULL
- `type` TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'adjustment'))
- `reference` TEXT NULL
- `status` TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'pending', 'reversed'))
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes:
- Primary key on `id`
- B-tree indexes on `balance_id`, `user_id`, `session_id`, `type`, `status`
- Composite index on (`user_id`, `created_at`)

RLS:
- Allow users to select transactions for their own balance.
- Allow system processes to insert new transactions.
- Prevent direct modification except by admin or reconciliation logic.

### `nexos_wallets`
- `id` UUID PK
- `user_id` UUID NOT NULL FK -> `profiles.user_id`
- `balance` NUMERIC(18,4) NOT NULL DEFAULT 0.0000
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Constraints:
- Unique constraint on `user_id`
- Check `balance >= 0`

Indexes:
- Primary key on `id`
- Unique index on `user_id`
- B-tree index on `balance`

RLS:
- Allow users to select own wallet balance.
- Restrict write to transaction settlement and admin.

### `nexos_transactions`
- `id` UUID PK
- `wallet_id` UUID NOT NULL FK -> `nexos_wallets.id`
- `session_id` UUID NULL FK -> `exchange_sessions.id`
- `user_id` UUID NOT NULL FK -> `profiles.user_id`
- `amount` NUMERIC(18,4) NOT NULL
- `type` TEXT NOT NULL CHECK (type IN ('session_reward', 'internal_transfer', 'spend', 'adjustment'))
- `reference` TEXT NULL
- `status` TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'pending', 'reversed'))
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes:
- Primary key on `id`
- B-tree indexes on `wallet_id`, `user_id`, `session_id`, `type`, `status`
- Composite index on (`user_id`, `created_at`)

RLS:
- Allow users to select transactions for own wallet.
- Allow system processes to create wallet transactions.
- Prevent unauthorized updates.

### `audit_logs`
- `id` UUID PK
- `actor_id` UUID NULL FK -> `profiles.user_id`
- `entity` TEXT NOT NULL
- `entity_id` UUID NULL
- `action` TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'flag', 'resolve'))
- `details` JSONB NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes:
- Primary key on `id`
- B-tree indexes on `actor_id`, `entity`, `action`, `created_at`
- GIN index on `details`

RLS:
- Allow admin and audit roles to read logs.
- Prevent regular users from reading arbitrary audit records.

## Entity Descriptions

- `profiles`: core profile records linked to Supabase auth users. Contains public-facing name, intent, availability, and basic status.
- `skills`: normalized skill taxonomy for both teaching and learning.
- `user_skills`: maps users to skills with proficiency and intent metadata.
- `learning_goals`: captures a user’s active learning objectives and optional skill context.
- `matches`: stores recommended or requested pairings between users for potential sessions.
- `exchange_sessions`: represents the scheduled interaction between matched users.
- `session_participants`: connects users to sessions and defines their role in the exchange.
- `session_reviews`: captures post-session feedback from one participant about another.
- `reputation_scores`: aggregated reputation data for fast lookup and discovery.
- `contribution_balances`: current contribution point holdings for each user.
- `contribution_transactions`: ledger of contribution point movements tied to sessions or adjustments.
- `nexos_wallets`: internal currency wallets for each user.
- `nexos_transactions`: ledger of NEXOS currency movements for settlements and internal spending.
- `audit_logs`: immutable history of administrative and system actions.

## Relationship Descriptions

- `profiles` -> `auth.users`: one-to-one relationship via `user_id`.
- `profiles` -> `user_skills`: one-to-many. Each profile may declare many skills.
- `profiles` -> `learning_goals`: one-to-many. Each profile owns multiple goals.
- `skills` -> `user_skills`: one-to-many. Each skill can be attached to many users.
- `skills` -> `learning_goals`: optional one-to-many. A goal can map to one skill.
- `profiles` -> `matches`: one-to-many as requester and as candidate. Each match involves two profiles.
- `learning_goals` -> `matches`: one-to-many. A match may be scoped to one goal.
- `matches` -> `exchange_sessions`: one-to-one/one-to-many. A session may derive from a match.
- `exchange_sessions` -> `session_participants`: one-to-many. Each session has multiple participants.
- `profiles` -> `session_participants`: one-to-many. Each user participates in many sessions.
- `exchange_sessions` -> `session_reviews`: one-to-many. Each completed session may produce reviews.
- `profiles` -> `session_reviews`: one-to-many as reviewer and as reviewee.
- `profiles` -> `reputation_scores`: one-to-one. Each user has a reputation aggregate.
- `profiles` -> `contribution_balances`: one-to-one. Each user has a contribution ledger.
- `profiles` -> `nexos_wallets`: one-to-one. Each user has an internal wallet.
- `contribution_balances` -> `contribution_transactions`: one-to-many. Balance changes are recorded.
- `nexos_wallets` -> `nexos_transactions`: one-to-many. Wallet movements are recorded.
- `exchange_sessions` -> `contribution_transactions` / `nexos_transactions`: optional one-to-many. Sessions can drive rewards and spend events.
- `profiles` -> `audit_logs`: one-to-many as actor.

## Supabase RLS Requirements

All tables are designed for Supabase RLS and should be protected by explicit policies.

General RLS design:
- Enable RLS on every table.
- Use `auth.uid()` to scope user access.
- Authorize queries for only the rows the current user owns or is explicitly involved in.
- Allow service roles or admin roles to bypass RLS only for moderation and internal systems.

Recommended policy patterns:
- `profiles`: `SELECT` for public discovery; `UPDATE` only if `user_id = auth.uid()`; `INSERT` for new profile creation when `user_id = auth.uid()`; `DELETE` disabled.
- `user_skills`: `SELECT` and `INSERT`/`UPDATE`/`DELETE` only if `user_id = auth.uid()`.
- `learning_goals`: same as `user_skills` for goal owners.
- `matches`: `SELECT` if `requester_id = auth.uid()` OR `candidate_id = auth.uid()`; `INSERT`/`UPDATE` by matching service or by user involved in match action; `DELETE` restricted.
- `exchange_sessions`: `SELECT` if user is participant via `session_participants` or `owner_id = auth.uid()`; `UPDATE` if session owner or approved participant; `INSERT` by session creator; `DELETE` denied.
- `session_participants`: `SELECT` if `user_id = auth.uid()` or if user owns the session; `INSERT`/`UPDATE` by session orchestration service or session owner.
- `session_reviews`: `SELECT` if reviewer or reviewee is auth user or if they are participant on the referenced session; `INSERT` if reviewer_id = auth.uid() and session participant exists; `UPDATE` only for moderation or flags.
- `reputation_scores`: `SELECT` for all authenticated users; `UPDATE` by scoring engine role only.
- `contribution_balances`: `SELECT` if `user_id = auth.uid()`; `UPDATE` only by service role.
- `contribution_transactions`: `SELECT` if `user_id = auth.uid()`; `INSERT` by service role or internal process; `UPDATE` restricted.
- `nexos_wallets`: `SELECT` if `user_id = auth.uid()`; `UPDATE` only by service role.
- `nexos_transactions`: `SELECT` if `user_id = auth.uid()`; `INSERT` by service role; `UPDATE` restricted.
- `audit_logs`: `SELECT` only by admin/audit roles; `INSERT` by backend service role; `UPDATE`/`DELETE` disabled.

Policy enforcement should also cover:
- `match_id` and `session_id` references by participants and reviewers to prevent users from querying unrelated sessions.
- limiting `skills` writes to authorized maintainers or services.
- audit trail creation by backend function rather than user-supplied inserts.

## Notes on Production Readiness

- Keep wallet and contribution balances current with transaction-based updates to avoid drift.
- Use foreign key cascading carefully: cascade deletes only for child tables that should disappear with parent rows, otherwise prefer restrict.
- Enforce business rules in both application and database constraints where possible.
- Index active and status fields for fast feed queries and dashboard metrics.
- Use numeric precision for balance and score columns suitable for internal economy values.
- Maintain separate aggregate/reputation tables to reduce expensive runtime computations.

This design is intentionally minimal while providing a robust, normalized foundation for MVP V1.
