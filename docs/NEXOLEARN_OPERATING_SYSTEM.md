# NexoLearn Operating System — Definitive Architecture

Date: 2026-06-04

Role: Chief Systems Architect

This document consolidates the NexoLearn architecture into a single operating model. It integrates findings from:
- `ARCHITECTURE_AUDIT.md`
- `DATABASE_AUDIT.md`
- `NEXOLEARN_DOMAIN_MODEL.md`
- `NEXOS_ECONOMY_DESIGN.md`
- `RECIPROCAL_EXCHANGE_ENGINE.md`
- `TRUST_AND_REPUTATION_ENGINE.md`
- `TREASURY_AND_GLOBAL_PAYOUT_ENGINE.md`

NexoLearn is a global knowledge exchange network where users teach, learn, earn reputation, generate contribution value, earn NEXOS, and eventually convert value into local currencies.

## 1. User Lifecycle

Actors
- New user
- Learner
- Host/teacher
- Community participant
- Premium mentor
- Moderator / compliance officer

Triggers
- Registration
- Profile completion
- Skill declaration
- Session request or offer
- Reputation change
- Withdrawal request
- Dispute or fraud alert

States
- Visitor
- Registered
- Verified
- Active learner
- Active contributor
- Premium participant
- Trust-restricted
- Suspended
- Withdrawn

Transitions
- Visitor → Registered: sign up
- Registered → Verified: complete KYC/email/phone
- Verified → Active learner/contributor: attend or host sessions
- Active → Premium participant: earn reputation/trust or purchase access
- Any active state → Trust-restricted: fraud signal, dispute, or suspicious behavior
- Any active state → Suspended: confirmed abuse or regulatory block
- Active → Withdrawn: payout completed and balance zero

Business rules
- Users must complete minimum profile data before matching
- Identity verification is required before NEXOS withdrawal
- Users earn contribution and reputation from verified sessions and community actions
- Low trust users may be matched into supervised pools only
- Suspended users cannot initiate sessions, withdraw, or earn rewards

Edge cases
- Users with high contribution but low reputation: can participate but with premium restrictions
- Users changing country: require revalidation of regional compliance and payout rules
- New users with paid NEXOS but no contributions: allow learning while encouraging contribution

## 2. Skill Lifecycle

Actors
- User
- Skill taxonomy manager
- Matching engine
- Profile system

Triggers
- Skill added/edited
- Skill confirmed through session proof or assessment
- Skill proof decays due to inactivity
- Skill flagged for audit

States
- Self-declared
- Confirmed
- Verified
- Expired
- Flagged

Transitions
- Self-declared → Confirmed: multiple positive session outcomes or endorsements
- Confirmed → Verified: passing assessment or artifact validation
- Any state → Expired: lack of activity or review decay
- Any state → Flagged: suspicious evidence or misuse

Business rules
- Skills are stored and normalized for matching and discovery
- A skill requires evidence beyond self-report to achieve confirmed/verified status
- Skill scores influence match quality and reputation multipliers

Edge cases
- Multiple similar skills; use taxonomy to avoid fragmentation
- Users claiming broad skills with insufficient evidence; limit premium roles until proof is established

## 3. Learning Goal Lifecycle

Actors
- Learner
- Mentor/host
- Platform recommendation engine

Triggers
- Goal creation
- Goal update
- Goal completion
- Goal abandonment

States
- Draft
- Active
- In progress
- Completed
- Abandoned
- Reprioritized

Transitions
- Draft → Active: learner sets goal and begins matching
- Active → In progress: session or learning path starts
- In progress → Completed: learner passes milestone or session series complete
- In progress → Abandoned: learner stops or changes direction
- Any state → Reprioritized: learner adjusts goals based on outcomes

Business rules
- Goals are associated with skills and preferred outcomes
- Goals influence matching and session recommendations
- Completed goals can trigger achievement rewards and contribution bonuses

Edge cases
- Multi-skill goals requiring different hosts. The platform may split them into separate sessions
- Changing goals mid-course; preserve earned contribution/reputation while adjusting metrics

## 4. Match Lifecycle

Actors
- Learner
- Host
- Matching service
- Reputation engine
- Trust engine

Triggers
- Session request
- Skill need
- Availability update
- Reputation/trust change
- Community invitation

States
- Candidate
- Recommended
- Requested
- Confirmed
- Rejected
- Expired
- Matched

Transitions
- Candidate → Recommended: matching algorithm selects potential partners
- Recommended → Requested: user initiates a match request
- Requested → Confirmed: both parties accept
- Requested → Rejected: declined or canceled
- Confirmed → Matched: session scheduled or started
- Confirmed → Expired: no action before expiry

Business rules
- Matching score uses skills, reputation, contribution, availability, preferences, and trust
- High reputation/trust users are prioritized for premium and contribution-based slots
- Matching avoids repeated low-value pairings and detects patterns of collusion
- Low trust users may only be matched with peers or under supervision

Edge cases
- Two users with similar skills but different time zones. Matching may use asynchronous options or flexible sessions
- Match offers to users with existing high-priority commitments. System must manage scheduling conflicts

## 5. Session Lifecycle

Actors
- Host
- Learner
- Platform scheduler
- Reputation/trust engines
- Fraud detection
- Treasury system

Triggers
- Session request accepted
- Session start
- Session end
- Session review submitted
- Dispute initiated

States
- Scheduled
- Active
- Completed
- Canceled
- No-show
- Disputed
- Settled

Transitions
- Scheduled → Active: session begins
- Active → Completed: session ends successfully
- Active → No-show: one or both participants do not attend
- Scheduled → Canceled: canceled before start
- Completed → Settled: contribution, NEXOS, and reputation are calculated
- Completed → Disputed: a review or fraud signal triggers dispute processing

Business rules
- Sessions require verification signals before settlement
- Minimum duration and engagement thresholds determine whether settlement occurs
- Free sessions settle only contribution/reputation; premium sessions also settle NEXOS and fees
- Disputed sessions may be held and flagged for manual review

Edge cases
- Partial attendance: one user is present, the other absent. Settlement may award partial compensation
- Dual-expert sessions: both users earn and may exchange NEXOS based on negotiated value

## 6. Contribution Lifecycle

Actors
- User
- Contribution engine
- Community systems
- Reputation engine
- Matching and treasury systems

Triggers
- Session completed
- Content shared
- Community event hosted
- Goal achieved
- Review received

States
- Earned
- Validated
- Redeemed
- Expired
- Suspended

Transitions
- Earned → Validated: contribution is confirmed by session verification and feedback
- Validated → Redeemed: user applies points for benefits or fee reduction
- Validated → Expired: unused points decay after time
- Any state → Suspended: fraud or abuse findings prevent use

Business rules
- Contribution is not direct currency; it unlocks access, discounts, and priority matching
- Contribution earn rates are influenced by session quality, reputation, and role
- Contribution redemption is capped and cannot be converted directly into NEXOS at a fixed rate
- Contribution validaton relies on multiple signals to prevent farming

Edge cases
- Accumulated contribution with no redemption path. System must provide sufficient sinks (discounts, events, premium slots)
- Contribution points earned from community events with uneven participation; allocate fairly by verified engagement

## 7. Reputation Lifecycle

Actors
- User
- Reputation engine
- Review and trust subsystems
- Moderation

Triggers
- Session completion
- Review submission
- Dispute resolution
- Fraud signal
- Activity/inactivity

States
- Baseline
- Growing
- Peak
- Declining
- Recovered
- Suspended

Transitions
- Baseline → Growing: consistent positive sessions and reviews
- Growing → Peak: high quality and reliability over time
- Peak → Declining: negative reviews, disputes, or inactivity
- Declining → Recovered: sustained good behavior and remediation
- Any state → Suspended: severe or confirmed abuse

Business rules
- Reputation is a long-term composite score that decays slowly with inactivity
- Reputation updates are weighted by review trust, session verification, and contribution quality
- Penalties apply for confirmed fraud, disputes, or repeated low-quality outcomes
- Reputation recovery requires sustained positive behavior and may include manual remediation

Edge cases
- Reputation inflation from coordinated ratings. The system dampens weight from suspicious reviewer clusters
- Reputation decay due to long-term inactivity. Provide recovery paths while preserving past contribution

## 8. Trust Lifecycle

Actors
- User
- Trust engine
- Fraud detection
- Compliance
- Matching and payout systems

Triggers
- Recent behavior changes
- Verification updates
- Fraud signals
- Session outcomes
- KYC refresh

States
- Untrusted
- Standard
- Trusted
- High trust
- Probationary
- Restricted

Transitions
- Untrusted → Standard: basic verification and completed sessions
- Standard → Trusted: strong recent behavior and KYC status
- Trusted → High trust: consistent low-risk, high-quality behavior
- Any active state → Probationary/Restricted: fraud or compliance alerts
- Probationary → Standard: once issues are resolved and behavior stabilizes

Business rules
- Trust is dynamic and reacts faster than reputation
- Trust influences matching, withdrawal limits, premium access, and moderation thresholds
- Active fraud signals reduce trust immediately, even if reputation remains high

Edge cases
- Users with low trust but high reputation. Give them limited access while allowing recovery
- Verified users with new suspicious device patterns. Apply temporary restrictions pending review

## 9. NEXOS Lifecycle

Actors
- User
- NEXOS economy engine
- Treasury
- Session settlement
- Payments

Triggers
- Mint event
- Session settlement
- Promotion/reward issuance
- Withdrawal request
- Burn event

States
- Minted
- Circulating
- Reserved
- Burned
- Redeemed

Transitions
- Minted → Circulating: issued to user wallets or reserved for promotions
- Circulating → Reserved: earmarked for pending withdrawals or matched commitments
- Circulating → Burned: platform fees burned or redemption costs removed
- Circulating → Redeemed: converted to fiat through treasury/payout

Business rules
- NEXOS are platform currency, not a blockchain asset
- Minting is controlled and audited; large mints require approval
- Burning or reserve routing maintains supply discipline
- Fees may be split between platform reserve and burn pools

Edge cases
- Extreme promotions generating excess NEXOS supply. Use campaign caps and analytics to prevent inflation
- Partial refunds requiring reversal of burned or reserved NEXOS

## 10. Treasury Lifecycle

Actors
- Treasury operator/service
- Finance team
- Exchange provider
- Compliance team
- Payout partners

Triggers
- Withdrawal request
- Reserve rebalance
- FX shock
- Liquidity stress
- Regulatory event

States
- Balanced
- Over-reserved
- Under-reserved
- Hedged
- Stressed
- Paused

Transitions
- Balanced → Over-reserved: reserve accumulation above target
- Balanced → Under-reserved: payout demand or reserve depletion
- Under-reserved → Stressed: reserve coverage falls below policy
- Stressed → Paused: withdrawal throttling or emergency measures
- Over-reserved → Balanced: convert reserves to productive yield or lower-risk holdings

Business rules
- Maintain reserve coverage above defined thresholds (e.g., 120% of 30-day withdrawals)
- Bucket reserves by currency and region based on demand forecast
- Use hedging for material FX exposures
- Trigger alerts before liquidity thresholds are breached

Edge cases
- Sudden withdrawal spike in one currency. The treasury may reroute to alternate currencies or delay payouts
- Counterparty failure. Switch to backup providers and invoke contingency plans

## 11. Withdrawal Lifecycle

Actors
- User
- Withdrawal service
- Compliance service
- Treasury
- Regional payout partner

Triggers
- Withdrawal request
- KYC completion
- Fraud or AML flag
- Exchange rate lock
- Settlement confirmation

States
- Requested
- Validated
- Approved
- In progress
- Completed
- Rejected
- Held

Transitions
- Requested → Validated: verify user identity, limits, and funds
- Validated → Approved: compliance cleared and reserves allocated
- Approved → In progress: payout executed through regional rails
- In progress → Completed: funds settle into bank account
- Approved → Held: suspicious cases paused
- Held → Rejected or Approved: resolved after review

Business rules
- Withdrawals require KYC and trust thresholds
- Amounts are capped by regional rules and trust score
- Rates are fixed only when the conversion path is confirmed
- Payouts are subject to fees, withholding, and provider settlement timing

Edge cases
- Bank account validation failures. Reject and request corrected details
- Jurisdictional payout restrictions. Block and escalate for legal review
- Partial settlement due to banking returns or reversals

## 12. Fraud Lifecycle

Actors
- Fraud detection service
- Trust engine
- Compliance team
- Moderation
- Legal

Triggers
- Suspicious activity detection
- Rating patterns
- Rapid account creation
- Withdrawal anomalies
- Sanctions matches

States
- Normal
- Alerted
- Investigated
- Actioned
- Resolved
- Escalated

Transitions
- Normal → Alerted: anomaly detected
- Alerted → Investigated: automated review or manual triage
- Investigated → Actioned: restrict, hold, suspend, or reject transactions
- Actioned → Resolved: if cleared or mitigated
- Actioned → Escalated: to legal, compliance, or law enforcement

Business rules
- Fraud signals are scored and aggregated to produce risk levels
- High risk can trigger immediate holds on sessions, withdrawals, and matching
- Users have defined remediation and appeal paths

Edge cases
- False positives harming legitimate users. Use human review and explainable decisions
- Mixed cases with simultaneous legitimate and suspicious signals. Use tiered handling

## 13. Community Lifecycle

Actors
- Community host
- Community member
- Event sponsor
- Platform operations

Triggers
- Community event creation
- Membership changes
- Contribution awards
- Community reward distribution

States
- Creating
- Active
- Completed
- Archived
- Flagged

Transitions
- Creating → Active: event or group is launched
- Active → Completed: event ends or community cycle finishes
- Completed → Archived: content and rewards are preserved
- Any state → Flagged: abuse or quality issue arises

Business rules
- Community activities earn contribution and may also earn NEXOS rewards
- Access and moderation rights depend on reputation and trust
- Community events can be free, sponsored, or donation-based

Edge cases
- Uneven participation. Use peer feedback and attendance tracking to allocate rewards fairly
- Collusive groups farming points or reviews. Apply audit and anti-sybil controls

## 14. Governance Lifecycle

Actors
- Platform governance team
- Compliance/legal
- Product leadership
- External advisors

Triggers
- Policy changes
- Regulatory updates
- Incentive program changes
- Risk events

States
- Draft
- Reviewed
- Approved
- Published
- Monitored

Transitions
- Draft → Reviewed: internal evaluation
- Reviewed → Approved: governance sign-off
- Approved → Published: live policy or parameter change
- Published → Monitored: ongoing review and performance tracking
- Monitored → Revised: policy updates after feedback or incidents

Business rules
- All major economic and trust policies are documented and versioned
- Regulatory and compliance changes are fast-tracked
- Governance must balance user value, safety, and sustainability

Edge cases
- Emergency changes due to fraud or regulation. Use expedited review and communication channels
- Legacy rules conflicting with new mechanics. Maintain backward compatibility where feasible

## A. Complete System Flow

User
↓ Matching
↓ Session
↓ Contribution
↓ Reputation
↓ NEXOS
↓ Treasury
↓ Withdrawal

Flow description
- User enters the platform, creates skills/goals, and is matched to hosts or peers.
- A session is scheduled and executed. Quality and attendance are verified.
- Contribution value is earned from session participation and content contribution.
- Reputation updates reflect verified outcomes and review weighting.
- NEXOS settle for premium sessions, rewards, and fees.
- The treasury manages payout reserves and converts NEXOS when users request withdraw.
- Withdrawal executes regional payout, subject to KYC/AML and compliance.

## B. Event Architecture

Major events
- `UserRegistered`
- `UserVerified`
- `SkillDeclared`
- `SkillValidated`
- `GoalCreated`
- `MatchCandidateCreated`
- `MatchConfirmed`
- `SessionScheduled`
- `SessionStarted`
- `SessionCompleted`
- `SessionNoShow`
- `SessionDisputed`
- `ContributionEarned`
- `ContributionValidated`
- `ContributionRedeemed`
- `ReputationUpdated`
- `TrustUpdated`
- `NEXOSMinted`
- `NEXOSSettled`
- `NEXOSBurned`
- `WithdrawalRequested`
- `WithdrawalApproved`
- `WithdrawalCompleted`
- `ReserveRebalanced`
- `FraudAlertRaised`
- `FraudInvestigated`
- `ComplianceFlagged`
- `CommunityEventCreated`
- `CommunityRewardDistributed`
- `GovernancePolicyPublished`

## C. Service Architecture

Required services
- Identity & Auth Service
- Profile Service
- Skill & Goal Service
- Matching Service
- Session Service
- Contribution Engine
- Reputation Engine
- Trust & Fraud Service
- NEXOS Economy Service
- Treasury & Payout Service
- Compliance Service (KYC/AML/Tax)
- Community Service
- Notification Service
- Reporting & Audit Service
- Governance/Policy Service
- Admin/Moderation Service
- Data & Analytics Service

## D. Database Architecture

Required entities
- `users`
- `profiles`
- `skills`
- `skill_proofs`
- `learning_goals`
- `matches`
- `exchange_sessions`
- `session_participants`
- `session_reviews`
- `reputation_scores`
- `trust_scores`
- `contribution_balances`
- `contribution_transactions`
- `nexos_wallets`
- `nexos_transactions`
- `withdrawals`
- `treasury_reserves`
- `fx_rates`
- `payout_accounts`
- `compliance_records`
- `kyc_documents`
- `fraud_signals`
- `community_events`
- `community_memberships`
- `achievement_badges`
- `notifications`
- `audit_logs`
- `governance_policies`

## E. MVP Scope

Must exist for MVP V1
- User registration and profile
- Skill declaration and interests
- Basic matching between users and hosts
- Session scheduling and completion flow
- Simple NEXOS wallet and transaction ledger
- Contribution earning from sessions
- Reputation calculation from session reviews
- Essential trust checks for matching
- Withdrawal request planning (even if payout not fully live)
- Core DB schema with `profiles`, `courses`, `purchases`, `credits`, `transactions`, `conversations`, `matches`
- RLS and basic authorization
- Minimal compliance gating for withdrawals (KYC gating placeholder)
- Admin audit logs and moderation entry points

## F. Post-MVP Scope

Should be delayed until later phases
- Full treasury payout network with global fiat rails
- Advanced fraud engine and sybil graph analysis
- Regional payouts for many markets
- Full contribution redemption catalog
- Community marketplace and sponsored events
- Knowledge proof assessments and certifications
- Multiple currency wallet support
- Predictive AI matching and personalized learning goals
- Full governance policy UI and audit workflow
- Advanced analytics and resilience tooling

## G. Technical Risks

- Non-atomic wallet/purchase flows leading to double-spend
- Missing pagination and rate limiting causing scale failures
- Incomplete RLS/authorization exposing data or messages
- Lack of observability and testing preventing safe releases
- Single provider or key usage for Supabase/DB access
- Unstructured schema for skills and sessions slowing feature growth

## H. Economic Risks

- Excessive NEXOS minting causing inflation
- Pay-to-win dynamics reducing reciprocal value
- Contribution economy imbalance with few sinks
- Withdrawal liability exceeding treasury reserves
- Fee model too low to support treasury and compliance costs

## I. Regulatory Risks

- Data privacy and KYC/AML obligations across jurisdictions
- Virtual asset or payment services licensing requirements
- Tax reporting and withholding exposure for payouts
- Sanctions and restricted-country payout risk
- Treatment of NEXOS as monetary instrument in some markets

## J. Scaling Risks

- High-volume messaging and session verification load
- Growing `transactions` and `messages` tables without composite indexes
- Match generation and recommendation complexity
- Regional payout complexity and provider integrations
- Real-time trust/fraud scoring at global scale

## Final Scores

Architecture score: 74/100
- Strengths: coherent reciprocal exchange model, economic controls, trust/treasury separation
- Weaknesses: unfinished matching engine, missing explicit session entity, incomplete global payout readiness

Readiness score: 60/100
- Strengths: functional core and strong security design ideas
- Weaknesses: limited production tooling, missing CI/test coverage, incomplete compliance automation

## Final Roadmap

Phase 1: Stabilize core platform
- Implement atomic session & wallet settlement flows
- Add session entity, reviews, and contribution validation
- Harden auth/RLS, add pagination, monitoring, and CI
- Build reputation/trust services and match engine prototype

Phase 2: Expand reciprocity economy
- Add contribution redemption sinks and premium/free exchange logic
- Build community events and curated reward pools
- Introduce governance policies for fees, minting, and trust

Phase 3: Treasury & payout readiness
- Integrate regional payout providers and FX rate engine
- Build KYC/AML pipeline and withdrawal workflow
- Add treasury reserve management and stress testing

Phase 4: Scale and optimize
- Advance fraud/sybil detection and graph analysis
- Add AI recommendations, predictive matching, and learner goal automation
- Expand multi-currency wallets and global payout markets
- Add governance dashboards and audit-ready reporting

Closing
-------
This operating system defines NexoLearn as a trust-led reciprocal knowledge exchange with separate value systems for contribution and NEXOS, a compliance-aware treasury, and a lifecycle-driven product architecture. It is the single reference model for product, engineering, and operations.
