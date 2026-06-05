# NexoLearn — Database Audit

Date: 2026-06-04

## Overview

This audit reviews the current database schema in `api/schema.sql` and related repository evidence for table design, relationships, indexes, constraints, normalization, scalability, and support for requested capabilities.

## Table Inventory

Supported tables:
- `profiles`
- `courses`
- `course_content`
- `purchases`
- `credits`
- `transactions`
- `conversations`
- `messages`
- `matches`

### Notes
- `profiles` extends `auth.users` and includes `interests TEXT[]`.
- `courses` and `course_content` support course authoring and lesson content.
- `purchases`, `credits`, and `transactions` form the credit economy.
- `conversations`/`messages` support private chat.
- `matches` stores connections and match status.

## Relationships

The schema defines the following foreign-key relationships:
- `profiles.id` references `auth.users(id)`
- `courses.creator_id` references `profiles(id)`
- `course_content.course_id` references `courses(id)`
- `purchases.user_id` references `profiles(id)`
- `purchases.course_id` references `courses(id)`
- `credits.user_id` references `profiles(id)`
- `transactions.user_id` references `profiles(id)`
- `conversations.user1_id` and `user2_id` reference `profiles(id)`
- `messages.conversation_id` references `conversations(id)`
- `messages.user_id` references `profiles(id)`
- `matches.user1_id` and `user2_id` reference `profiles(id)`

### Relationship quality

- Well-defined ownership relationships exist for courses, purchases, and messaging.
- `conversations` and `matches` correctly use normalized edges between `profiles`.
- `course_content` is properly dependent on `courses`.

## Indexes

Present indexes:
- `idx_courses_creator` on `courses(creator_id)`
- `idx_courses_published` on `courses(is_published)`
- `idx_purchases_user` on `purchases(user_id)`
- `idx_course_content_course` on `course_content(course_id)`
- `idx_transactions_user` on `transactions(user_id)`
- `idx_messages_user` on `messages(user_id)`
- `idx_messages_created` on `messages(created_at)`
- `idx_messages_conversation` on `messages(conversation_id)`
- `idx_conversations_user1` on `conversations(user1_id)`
- `idx_conversations_user2` on `conversations(user2_id)`
- `idx_conversations_updated` on `conversations(updated_at)`
- `idx_matches_user1` on `matches(user1_id)`
- `idx_matches_user2` on `matches(user2_id)`
- `idx_matches_status` on `matches(status)`

### Index analysis

- Good coverage for direct lookup by foreign key and status.
- Missing composite indexes for common access patterns, such as:
  - `messages(conversation_id, created_at)` for ordered conversation retrieval.
  - `transactions(user_id, created_at)` for user transaction history.
  - `purchases(user_id, course_id)` already unique, but if query patterns involve `course_id` a second index may help.
- There is no index for `courses(category)` or `courses(is_published, category)` which are likely useful for browsing.

## Constraints

Strong constraints are present:
- Primary keys on all entity tables.
- Foreign keys for referential integrity.
- Unique constraints on `profiles.email`, `purchases(user_id, course_id)`, `conversations` pair, and `matches` pair.
- Check constraints on `profiles.role`, `transactions.type`, `matches.status`, and `conversations`/`matches` distinct-user enforcement.
- `credits.balance` has a non-negative check.

### Constraint issues

- `course_content.order_index` is required but not constrained to be unique per `course_id`.
- `transactions` has no enforcement of balance invariants; it is possible to insert transactions that drift `credits.balance`.
- `messages` and `conversations` rely on application flows to create valid relationships; DB-level backstops exist but additional `WITH CHECK` constraints could be more explicit.

## Normalization

### Good aspects

- The core schema is normalized through 3NF for courses, course content, purchases, credits, transactions, conversations, and matches.
- Entity separation is appropriate for user profiles, courses, purchases, and chat.

### Denormalization / gaps

- `profiles.interests` is stored as `TEXT[]`, which is a denormalized representation of tags. This is acceptable for simple matching but limits query flexibility, tag normalization, and analytics.
- The schema has no `skills` column/table despite the frontend and docs referencing teach/learn skills.
- `credits` behaves as a wallet account, but there is no normalized wallet table or account history beyond transactions.

## Scalability

### Strengths

- RLS is enabled on nearly every table, which helps with multi-tenant style data isolation.
- Indexed foreign keys support key lookups.
- Conversation/messaging and match data are separated into normalized tables.

### Scalability weaknesses

- No explicit pagination or limit enforcement at the DB/query layer; this is primarily an API problem but relevant to DB load.
- Lack of composite indexes for widely expected access patterns may cause slower scans as data grows.
- The `transactions` and `credits` design allows single-row balance reads and writes, but the purchase flow in API is not atomic; that creates concurrency risk under scale.
- No materialized views, summary tables, or shards for high-volume analytics or matchmaking.

## Capability Support Matrix

| Capability | DB Support | Comments |
|------------|------------|----------|
| skills | No | Frontend stores `skills` on `profiles` but schema lacks a `skills` column or table. This is a mismatch and means skills are not persisted in the DB as defined. |
| interests | Partial | `profiles.interests TEXT[]` exists. This supports simple interest storage and basic matching requirements. |
| matching | Partial | `matches` exists and `profiles` are viewable for matching, but there is no dedicated matching algorithm data model or history. |
| exchange sessions | No | There is `conversations` and `messages`, but no structured session entity for tutoring/exchange sessions, scheduling, or session state. |
| reputation | No | No reputation score, badges, rating, or review tables exist. |
| wallet | Partial | `credits` functions as a basic wallet balance, but there is no separate `wallets` entity or multi-currency support; it is a thin ledger via `credits` + `transactions`. |
| transactions | Yes | `transactions` exists with RLS and user ownership. This supports a transaction history, though audit and reconciliation features are missing. |
| gamification | No | No gamification tables or fields (badges, levels, points, streaks) are present. |
| notifications | No | No notification queue, subscriptions, or event delivery tables exist. |

## Missing Entities

The schema is missing these domain entities or explicit support structures:
- `skills` column or `skills` table
- `skill_categories` or normalized skill tags
- `reputation` or `ratings` table
- `exchange_sessions` or `tutoring_sessions`
- `session_attendance` or `session_history`
- `wallets` as a first-class entity beyond `credits`
- `gamification_badges`, `points`, or `achievements`
- `notifications` / `user_notifications`
- `notifications_subscriptions` / `notification_settings`
- `user_feedback` or `reviews`
- `skill_matches` or matching score history
- `tag` / `category` normalization tables for interests and skills
- `audit_logs` for financial and admin actions

## Support Verification Summary

- `skills`: No. The frontend expects `skills`, but the DB schema does not define it.
- `interests`: Yes, partially. Stored as `TEXT[]` on `profiles`.
- `matching`: Yes, minimally. `matches` exists, but the engine data model is incomplete.
- `exchange sessions`: No. `conversations` exist, but not structured session entities.
- `reputation`: No.
- `wallet`: Partial. Basic wallet/balance support via `credits`, but not a dedicated wallet model.
- `transactions`: Yes. Basic transaction history exists and is protected with RLS.
- `gamification`: No.
- `notifications`: No.

## Score

### Database Support Score: 65/100

#### Rationale
- The schema supports the core learning platform: user profiles, courses, purchases, credits, transaction history, private conversations, and matches.
- It is missing several key social and engagement entities requested by the product domain: skills persistence, reputation, exchange sessions, gamification, and notifications.
- The schema is functional for a lean MVP, but it lacks domain completeness and normalized supporting entities for the broader product vision.

## Recommendations

1. Add a persistent `skills` field or normalized `skills` table to align with frontend onboarding and matching.
2. Introduce a dedicated `reputation`/`ratings` structure if user credibility is part of the product.
3. Add `exchange_sessions` or `tutoring_sessions` to capture session scheduling, status, duration, and session-specific metadata.
4. Normalize interests/skills with tag tables if matching and analytics become important.
5. Add notification tables and delivery metadata for in-app / email notifications.
6. Add composite indexes for common read patterns, especially conversation message ordering and transaction history.
7. Consider a wallet entity and stronger financial reconciliation controls beyond a single `credits` row.
8. Add audit logs for financial events and administrative actions.

## Conclusion

The current database design is a solid core for course, purchase, and chat interactions, but it does not fully support the broader social/exchange product features implied by the frontend and docs. The schema can be extended in a focused way to enable skills, reputation, sessions, gamification, and notifications without revisiting the core entity model.
