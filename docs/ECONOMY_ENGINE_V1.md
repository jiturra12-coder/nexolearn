# ECONOMY_ENGINE_V1

Date: 2026-06-04

Role: Economy Architect

This document defines the complete NEXOS economy for NexoLearn MVP V1. It covers the contribution system, reputation influence, minting and reward models, inflation controls, anti-abuse mechanisms, and future treasury/fiat design.

## Overview

NexoLearn MVP V1 supports two separate but complementary value systems:
- Contribution points: earned from verified participation and quality activity, used for platform benefits and discounts.
- NEXOS: internal platform currency used for premium access, tipping, transfers, and wallet spending.

Reputation is the trust signal that shapes both systems. The economy is designed to validate reciprocal knowledge exchange while minimizing pay-to-win dynamics and abuse.

Core design principles:
- Contribution is non-transferable and utility-focused.
- NEXOS is platform-controlled and auditable.
- Reputation influences earning rates, access, and risk controls.
- Inflation is managed via fees, caps, and dynamic supply controls.
- Treasury and fiat conversion are deferred to future phases.

## 1. Contribution System

### Purpose
- Reward helpful participation, learning investment, and quality session behavior.
- Enable users to unlock benefits independent of NEXOS balance.
- Preserve a non-currency value system that supports reciprocity.

### Architecture
- Data entities:
  - `contribution_balances`: current point balance per user.
  - `contribution_transactions`: ledger entries for earned, redeemed, adjustment, pending, and reversed contribution.
- Services:
  - `ContributionService` handles balance updates, transactional ledger writes, and settlement flows.
- API:
  - `GET /contribution/me`
  - `GET /contribution/me/transactions`
  - `POST /contribution/redeem`

### Earning model
Contribution points are awarded for:
- verified completed sessions
- high-quality learner engagement
- review submission quality
- future community or referral activity (MVP phase limited)

### Base formula
For a given session:

- `ContributionEarned_host = DurationMinutes / 10 * HostBaseRate * ReputationMultiplier * QualityFactor`
- `ContributionEarned_learner = DurationMinutes / 10 * LearnerBaseRate * ReputationMultiplier * EngagementFactor`

Where:
- `HostBaseRate = 1.0` point per 10 minutes
- `LearnerBaseRate = 0.4` point per 10 minutes
- `ReputationMultiplier` ranges from `0.9` to `1.2`
- `QualityFactor` and `EngagementFactor` are derived from review rating and completion

Example:
- 60-minute session, host with good reputation and quality:
  - `60 / 10 * 1.0 * 1.1 * 1.0 = 6.6` → round to `6` or `7` points
- same learner with strong engagement:
  - `60 / 10 * 0.4 * 1.0 * 1.0 = 2.4` → round to `2` points

### Review bonus
- Completed review submission may add a small bonus. Example: `+1` contribution point for a valid review on a completed session.
- This encourages feedback while preventing review farming.

### Redemption and sinks
Contribution points can be redeemed for benefits such as:
- fee discounts on NEXOS spending
- priority matchmaking
- limited free access to premium sessions

Redemption rules:
- Contribution can only offset benefits; it cannot be directly converted to NEXOS.
- Redemption is capped per session to prevent overuse.
- Example: up to `25%` NEXOS fee reduction, or `10` points for priority booking.

### Edge cases
- Sessions shorter than minimum threshold (e.g. < 15 minutes) earn `0` contribution to avoid farming micro-sessions.
- Disputed or cancelled sessions earn no contribution until resolved.
- If a review is removed or flagged, associated contribution bonus may be revoked.
- Contribution balance must never go negative; redemption beyond available balance is rejected.

## 2. Reputation Influence

### Purpose
- Reputation is a trust multiplier that affects match quality, reward rates, and platform access.
- It encourages sustained quality over pure volume.

### Architecture
- Data entity: `reputation_scores`
- Service: `ReputationService`
- API: `GET /reputation/me`, `GET /reputation/:userId`, `GET /reputation/leaderboard`

### Reputation formula
Reputation is a composite score between `1.0` and `5.0`.

Core contributors:
- average review rating
- completed session ratio
- review count
- cancellation and no-show penalties
- dispute history

Base formula:

- `Reputation = clamp(1.0, 5.0, RatingComponent * CompletionComponent * TrustComponent)`

Where:
- `RatingComponent = NormalizedAverageRating(1-5)`
- `CompletionComponent = 0.8 + 0.2 * CompletionRate`
- `TrustComponent = 1.0 - 0.1 * PenaltyCount`

Suggested implementation:
- `RatingComponent = AverageRating / 5.0 + 0.6` (bias toward positive outcomes)
- `CompletionRate = CompletedSessions / TotalSessions`
- `PenaltyCount = min(3, cancellations + no_shows + valid disputes)`

Example:
- user with average rating `4.6`, completion rate `0.9`, one minor penalty:
  - `RatingComponent = 4.6 / 5.0 + 0.6 = 1.52`
  - `CompletionComponent = 0.8 + 0.2 * 0.9 = 0.98`
  - `TrustComponent = 1.0 - 0.1 * 1 = 0.9`
  - `Reputation = 1.52 * 0.98 * 0.9 = 1.34` normalized and mapped back to `4.2` on a `1-5` scale.

### Reputation tiers
- `1.0-2.9`: probationary or new users
- `3.0-3.9`: standard users
- `4.0-4.4`: trusted contributors
- `4.5-5.0`: high-reputation premium users

### Reputation effects
- `ReputationMultiplier` for contribution earn rates
- access to premium matches or contribution-priced slots
- reduced NEXOS fees for high-reputation users
- match ranking preference in recommendations

### Edge cases
- reputation inflation from coordinated reviews: weight reviewer trust and discount repeated ratings between the same pair of users.
- reputation recovery after a bad review: use moving averages and time decay rather than permanent penalties.
- low reputation with many sessions: limit premium access and impose earning caps until trust improves.

## 3. NEXOS Minting Model

### Purpose
- NEXOS is an internal currency minted by the platform to reward participation, enable transfers, and support premium services.
- Minting is controlled, audited, and designed to avoid runaway issuance.

### Mint events
Primary minting triggers in MVP:
- verified completed premium session reward
- referral bonus for inviter/invitee
- promotional grants (controlled and capped)

Future mint triggers (post-MVP):
- paid fiat purchase
- bounty or campaign rewards
- treasury-backed payout conversions

### Minting rules
- All mint events are recorded as `type=mint` in `nexos_transactions`.
- Minted NEXOS enter circulation when credited to user wallets.
- Large promotional mint amounts require admin review and approval.

### Base mint model for MVP
- default premium session mint: `0` NEXOS to avoid uncontrolled inflation; platform may instead rely on internal transfers.
- optional onboarding bonus: e.g. `+20` NEXOS for new user wallet creation.
- referral bonus: e.g. `+15` NEXOS each for inviter and invitee, subject to caps.

### Example
- New user signs up and receives `20` NEXOS into wallet.
- User completes first premium session and receives a promotional `+10` NEXOS bonus.

### Audit and supply controls
- track weekly minted NEXOS vs burned/reserved NEXOS.
- maintain hard caps per campaign and per period.
- review mint ratios relative to active sessions and contribution issuance.

## 4. Reward Calculations

### Session reward calculation
A session reward has three parts:
1. NEXOS payout
2. Contribution points
3. Reputation update

Session reward formula for host NEXOS:

- `HostNEXOS = BaseRate * (DurationMinutes / 60) * ReputationRewardMultiplier * QualityBonus - Fee`

Where:
- `BaseRate` is the premium session rate in NEXOS per hour
- `ReputationRewardMultiplier` depends on host reputation
- `QualityBonus` is derived from review score and completion
- `Fee` is platform settlement fee

Example:
- `BaseRate = 50` NEXOS/hour
- Duration = `60` minutes
- Reputation multiplier = `1.05`
- Quality bonus = `1.0`
- Fee = `5%` of gross payout
- `HostNEXOS = 50 * 1 * 1.05 * 1.0 - 2.5 = 50.0 - 2.5 = 47.5`

Learner NEXOS cost (if premium):
- `LearnerCost = HostGrossPrice + Fee - ContributionDiscount`

Where:
- `ContributionDiscount` is a redemption benefit from contribution points.
- Example: `50 + 2.5 - 5 = 47.5` NEXOS if contribution discounts apply.

### Contribution reward calculation
- `HostContribution = max(0, round(DurationMinutes / 10 * HostBaseRate * ReputationMultiplier * QualityFactor))`
- `LearnerContribution = max(0, round(DurationMinutes / 10 * LearnerBaseRate * ReputationMultiplier * EngagementFactor))`

Quality and engagement factors are in the range `0.8` to `1.2`.

### Fee model
- `PlatformFee = GrossSessionAmount * FeeRate`
- default `FeeRate = 5%` for MVP premium sessions
- fee split: `50%` to platform wallet reserve, `50%` burned or reserved depending on inflation control policy

### Example summary
Session with 45 minutes, host reputation `4.6`, learner contribution discount `5` points:
- host NEXOS: `50 * 0.75 * 1.08 - 2.7 = 38.7` → host receives `38.7` NEXOS
- learner pays: `41.7` NEXOS after fee and discount
- host earns contribution: `45 / 10 * 1.0 * 1.08 = 4.86` → `5` points
- learner earns contribution: `45 / 10 * 0.4 * 1.0 = 1.8` → `2` points

## 5. Inflation Controls

### Purpose
- prevent NEXOS oversupply
- preserve contribution value by ensuring useful sinks
- maintain a healthy ratio of issuance to activity

### Controls
- Platform fee sink: fee portion removed from direct circulation or moved into reserve.
- Mint caps: limit promotional and referral issuance per period.
- Reputation gating: restrict high earnings to trusted users.
- Session minimums: disallow reward for trivial sessions.
- Dynamic rates: adjust base rates if average NEXOS per session exceeds target.

### Monitoring metrics
- weekly minted NEXOS
- weekly burned/reserved NEXOS
- average NEXOS per session
- average contribution points per session
- distribution concentration among wallets
- ratio: `TotalNEXOSMinted / TotalContributionIssued`

### Target ratios
For MVP, use guiding targets rather than hard economics:
- aim for `NEXOS earned per session` low relative to contribution: e.g. `10:1`.
- aim for `NEXOS fee sink` ≥ `5%` of premium session volume.
- monitor `wallet concentration`; flag if top 5% hold > 50% of circulating NEXOS.

### Edge cases
- promotional campaigns can temporarily increase NEXOS supply; compensate with higher burn/reserve rates.
- if NEXOS scarcity causes poor premium adoption, reduce fee rate or increase base reward budgets.
- if NEXOS inflation is too high, restrict new minting and increase fee burn proportion.

## 6. Anti-abuse Mechanisms

### Goals
- prevent farming of contribution or NEXOS
- prevent reputation manipulation
- preserve the integrity of session rewards

### Mechanisms
- New user earning caps: limit NEXOS and contribution accrual for first `30` days and first `10` sessions.
- Reputation gating: users with reputation < `3.0` may only earn `0.9x` rates and have premium access limits.
- Session quality gating: only fully verified completed sessions with valid reviews count for rewards.
- Duplicate account detection: monitor IP/device clusters and shared contact data.
- Review trust weighting: reviews from low-reputation or recently connected users carry reduced influence.
- Rate limits on recommendations and gift transfers.
- Transaction-based flags: alert if single user earns > `1000` NEXOS/week with reputation < `3.5`.

### Examples of anti-abuse rules
- users cannot earn more than `100` NEXOS total until they have `5` verified sessions and reputation > `3.5`.
- if a user cancels or no-shows more than `2` sessions in 30 days, their session reward multiplier drops by `0.1`.
- accounts with repeated reviews between the same pairs are discounted to avoid collusion.

### Edge cases
- legitimate high-frequency hosts must be differentiated from farming rings; use combined signals (reputation, completion, review diversity).
- abusive users may still accumulate contribution in free sessions; require quality signals before awarding points.

## 7. Session Reward Formula

### Core formula
For host NEXOS payout:

- `HostNEXOS = max(0, (GrossRate * DurationHours * ReputationMultiplier * QualityFactor) - Fee)`

For learner cost:
- `LearnerNEXOS = GrossRate * DurationHours + Fee - ContributionDiscount`

For contribution:
- `HostContribution = round(DurationMinutes / 10 * HostBaseRate * ReputationMultiplier * QualityFactor)`
- `LearnerContribution = round(DurationMinutes / 10 * LearnerBaseRate * ReputationMultiplier * EngagementFactor)`

Definitions:
- `GrossRate`: base premium price per hour in NEXOS
- `Fee`: `GrossRate * DurationHours * FeeRate`
- `DurationHours = DurationMinutes / 60`
- `QualityFactor`: `0.8` to `1.2`
- `EngagementFactor`: `0.8` to `1.2`
- `ReputationMultiplier`: e.g. `0.9` to `1.2`

### Example scenario
Session data:
- duration: `90` minutes
- gross rate: `60` NEXOS/hour
- fee rate: `5%`
- host reputation multiplier: `1.1`
- quality factor: `1.0`
- contribution discount: `6` NEXOS

Calculation:
- `DurationHours = 1.5`
- `GrossAmount = 60 * 1.5 = 90` NEXOS
- `Fee = 90 * 0.05 = 4.5` NEXOS
- `HostNEXOS = (90 * 1.1 * 1.0) - 4.5 = 94.5 - 4.5 = 90` NEXOS
- `LearnerNEXOS = 90 + 4.5 - 6 = 88.5` NEXOS
- `HostContribution = round(90 / 10 * 1.0 * 1.1 * 1.0) = 10` points
- `LearnerContribution = round(90 / 10 * 0.4 * 1.0 * 1.0) = 4` points

### Special session types
- Free session: `GrossRate = 0`; platform awards only contribution and reputation.
- Mixed session: learner pays partial NEXOS while both earn contribution.
- Tip-enabled session: additional tip flows are recorded as separate NEXOS transactions.

## 8. Referral Rewards

### Purpose
- reward onboarding and growth while limiting abuse.

### MVP model
- inviter receives `15` NEXOS when invitee completes their first verified session.
- invitee receives `15` NEXOS upon first verified session completion.
- both parties may receive `5` contribution points after first session if quality thresholds are met.

### Rules
- referrals only count after invitee completes `1` verified session.
- no more than `5` referral rewards per inviter per month in MVP.
- referrals do not affect reputation directly.
- referral awards are recorded as separate `nexos_transactions` with `meta.referralId`.

### Example
User A invites User B.
- User B signs up and completes first session.
- system mints `15` NEXOS to User A and `15` NEXOS to User B.
- if User B never completes a verified session, no reward is triggered.

### Edge cases
- self-referral is forbidden.
- referral chains are capped; only first valid inviter receives reward.
- fraud detection applies if many low-quality invitees are created.

## 9. Reputation Multipliers

### Purpose
- reward trusted users and discourage low-quality behavior.

### Multiplier bands
- `Reputation < 3.0`: `0.90x` reward rate, limited premium access
- `3.0 <= Reputation < 4.0`: `1.00x` base rate
- `4.0 <= Reputation < 4.5`: `1.05x` bonus rate
- `4.5 <= Reputation <= 5.0`: `1.10x` to `1.20x` premium rate

### Use cases
- apply to host contribution and NEXOS payouts
- optionally apply to learner contribution and access discounts
- used in matching weight to elevate high-rep users

### Example formula
- `ReputationMultiplier = 1.0 + max(0, Reputation - 4.0) * 0.05`

Examples:
- `Reputation = 3.2` → `1.0 + max(0, -0.8) * 0.05 = 1.0`
- `Reputation = 4.3` → `1.0 + 0.3 * 0.05 = 1.015`
- `Reputation = 4.8` → `1.0 + 0.8 * 0.05 = 1.04`

### Safeguards
- cap multiplier at `1.2` for MVP to avoid runaway advantages.
- reduce multiplier for users with recent penalties or disputes even if average reputation remains high.

## 10. Economy Balancing Rules

### Objectives
- ensure contribution value remains meaningful
- keep NEXOS supply aligned with useful premium activity
- prevent hoarding and one-sided value extraction

### Balancing levers
- `MintingRateControl`: limit NEXOS mint per session and per period.
- `FeeSink`: enforce platform fees to remove or reserve NEXOS.
- `RedemptionSinks`: create sufficient contribution redemption paths.
- `EarningCaps`: impose period and onboarding caps.
- `ReputationBalance`: use reputation to modulate reward rates.

### Key rules
- do not mint NEXOS solely for session completion unless quality is verified.
- preserve contribution as the primary reward for engagement.
- use NEXOS for convenience and premium access rather than the core learning experience.
- ensure contribution point sinks exist before increasing earn rates.
- require platform analytics to monitor `TotalNEXOSCirculation`, `TotalContributionOutstanding`, and `ActiveSessions`.

### Monitoring thresholds
- If `AverageNEXOSPerSession > TargetNEXOSPerSession`, reduce premium base rate or increase fee burn.
- If `ContributionRedemptionRate < 20%` of issued points over 30 days, add additional contribution sinks.
- If `NEXOSConcentrationTop5% > 50%`, investigate imbalance or abuse.

### Simulation example
Scenario A: conservative launch
- 1,000 sessions/month, average `40` NEXOS/session, `5` contribution points/session
- monthly NEXOS issuance: `40,000`
- monthly contribution issuance: `5,000`
- fee sink at `5%` removes `2,000` NEXOS
- ratio: `NEXOS:Contribution = 8:1`

If supply appears too high:
- lower base NEXOS rate to `35` NEXOS/session
- increase fee sink to `7%`
- add contribution-only priority slots to use contribution points

## 11. Treasury Model (Future)

### Purpose
- manage fiat reserves, payout liability, and currency risk once NEXOS convert to real-world value.

### Planned components
- treasury wallet/reserve tracking
- payout liabilities ledger
- exchange rate management between NEXOS and supported fiat currencies
- KYC/AML gating for withdrawal eligibility
- reserve ratio policy to ensure `FiatReserves >= PayoutLiabilities`

### Future flow
- NEXOS redeemed for fiat enter treasury reserve calculations.
- treasury may hold a portion of platform fees in stable fiat reserves.
- platform wallet and treasury wallet must be reconciled regularly.

### Example policy
- require `reserveRatio >= 120%` before enabling fiat redemption for a currency.
- use a multi-day settlement window and hold requirements for large redemptions.

## 12. Fiat Conversion Model (Future)

### Purpose
- provide a controlled path from NEXOS to fiat while preserving economy stability and compliance.

### Future design principles
- treat NEXOS as platform credit, not a tradable asset.
- support redemption only after user verification.
- use fixed redemption fees and dynamic conversion rates.
- prevent direct contribution-to-fiat conversion.

### Conversion model
- `FiatAmount = NEXOSAmount * ConversionRate * (1 - RedemptionFee)`
- `ConversionRate` set by treasury based on internal valuation and market conditions.
- `RedemptionFee` may be `10-15%` initially to cover processing and compliance costs.

### Example
- user redeems `100` NEXOS at `0.80` USD/NEXOS with `12%` fee:
  - `FiatAmount = 100 * 0.80 * 0.88 = 70.4 USD`

### Future safeguards
- cap monthly redemption per user until verification and contribution thresholds are met.
- delay payouts to manage liquidity and compliance.
- require audit trails for all conversion transactions.

## Implementation Notes

### Settlement sequence
1. session completes and verification is confirmed
2. `ContributionService` calculates and posts earned points
3. `NexosWalletService` records NEXOS reward or transfer transactions
4. `ReputationService` recalculates scores
5. platform fee sink, mint, and referral transactions are recorded
6. audit logs capture all economy events

### Auditability
- every contribution and NEXOS movement is an immutable transaction
- pending and reversed transaction statuses support dispute handling
- reconciliation jobs compare wallet balances to transaction sums

### MVP guardrails
- keep contribution and NEXOS systems separate
- avoid direct conversion between contribution and NEXOS in MVP
- minimize NEXOS minting to activity-driven and referral events
- make reputation a visible control lever for fair rewards

## Summary

The NEXOS economy for MVP V1 is a dual-system engine where contribution points reward participation and trust, while NEXOS provides internal currency for premium usage and transfers. The design uses formulaic session settlement, reputation multipliers, referral incentives, and explicit inflation controls to create a measurable, abuse-resistant economy. Treasury and fiat conversion remain future extensions, with the MVP focusing on a controlled internal exchange model.
