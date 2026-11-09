# Real achievements backend implementation plan

Execution: directly in the main session, as requested. No subagents, demo accounts, seeded domain records, automated tests/checks/builds or browser verification. Apply schema migrations needed by the requested persistent feature; retain the development preview.

**Goal:** implement the existing 45-badge achievement contracts against genuine database activity, reviewed private evidence and the canonical Kibble ledger.
**Architecture:** a shared static catalog defines the approved rules/rewards. Django stores claims, explicit digital activities, versioned private proofs and showcase preferences. A wallet-serialized reconciliation service appends claim/reversal ledger entries; source mutation collection reconciles affected owners before committing. The existing frontend/real adapter use the same endpoints.
**Spec:** existing `docs/implementation/achievements.md`, current API schemas and the owner's database-only request. Real support badges use independently confirmed receipts rather than unpaid pledges or simulated contributions.
**Stack:** Django/DRF, existing SQLite/PostgreSQL persistence and immutable rewards ledger; existing Next/React/shadcn views.

## Tasks

- [x] Share static catalog configuration between frontend and backend; add claim/activity/proof/showcase models and migrations. Keep all runtime achievement tables empty until genuine activity creates records.
- [x] Derive every metric from genuine persisted sources; enforce independent review, real receipts, deduplication, Manila dates, privacy and source visibility.
- [x] Add authenticated overview/claim/showcase/activity/proof endpoints and moderator review with idempotency, optimistic versions and uniqueness constraints.
- [x] Extend the authoritative ledger with an exclusive achievement source; reconcile corrections and dependent milestones under the wallet lock, preserving immutable history.
- [x] Reconcile affected owners on social/capture changes, preserve private evidence, and publish only consented badges/mastery in real profile/leaderboard DTOs.
- [x] Re-enable existing navigation/share/discovery controls; remove temporary service-unavailable treatment.
- [x] Apply schema migrations without seed commands; source-review the final integration and update documentation. Do not run unrequested verification.

## Review focus

Concurrent claims and retry keys; missing/fixture/withdrawn reference rows; independent and reversed proof review; date boundaries and repeated evidence; private media authorization; dependent badge reversals and exact ledger source attribution. No fabricated fixtures are a substitute for real-account integration verification.

Delivery details: `docs/implementation/real-achievements.md`. Migrations applied; source review completed without unrequested tests, checks or browser work.
