# Real database achievements

The 45 achievement definitions and mastery thresholds are static configuration in `backend/social/achievement_catalog.json`, shared directly by the frontend catalog and Django. Definitions are not seeded achievement records. Member progress comes from genuine database records; no demo actor, frozen demo clock, client balance or fixture repository is used by the Django implementation.

## Persistent state and API

`AchievementClaim` records the unique user/badge claim, its original reward, credited amount and ledger revision. `AchievementActivity` stores explicit daily check-ins, digital discoveries and share actions with unique per-user keys. `AchievementProof` stores private evidence, its reference/date, independent decision, deduplication key and optimistic version. `AchievementShowcase` stores up to six selected unlocked badges and the separate mastery-sharing preference.

Authenticated endpoints match the existing typed API:

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/v1/me/achievements` | Read the current 45-badge overview without creating claims. |
| POST | `/api/v1/me/achievements/claim` | Validate the server-derived requirements and award the unique claim. |
| PATCH | `/api/v1/me/achievements/showcase` | Save only the member's currently unlocked selections. |
| POST | `/api/v1/me/achievements/activity` | Persist a server-dated check-in or deduplicated public-record discovery/share. |
| GET, POST | `/api/v1/me/achievement-proofs` | List only the member's proofs; submit or revise rejected evidence. |
| GET | `/api/v1/moderation/achievement-proofs` | Staff-only proof queue, filterable and cursor-paginated. |
| POST | `/api/v1/moderation/achievement-proofs/{id}/review` | Versioned independent approval/rejection; previous approvals can be withdrawn. |

The existing BFF/real adapter supplies authenticated transport, response schemas and mutation idempotency keys. The old unavailable-state component and real-mode tracking restrictions have been removed. No visual primitive layer was added.

## Eligibility

- Fixture records, fixture identities and fixture account profiles cannot qualify. Achievement balance criteria and public ranking also exclude ledger entries tied to fixture sources while preserving immutable history. Captured identities also retain their existing independent identity/reference and calibrated automatic-policy boundaries.
- Local community browsing can show persisted fixture content through `Record.objects`; achievements and their source/reference queries use `Record.genuine_objects` explicitly. The local display setting does not relax reward or proof eligibility. Production community queries continue to hide fixtures.
- Sightings must be active with confirmed identity, plausible encounter evidence and published status. Missions must be genuinely approved, independently reviewed and distinct participations; organizers cannot earn from their own missions.
- Community posts use the community service's saved publication state. Pending/removed posts do not count. Photo progress requires published assets and deduplicates identical image digests, including reuploads.
- Support badges count genuine, independently evidenced `FundReceipt` records from published campaigns. Unpaid pledges and simulated contributions never establish support. This service does not take payments or confirm clinical outcomes.
- Application submission and event RSVP have their own explicitly limited badges. Neither establishes a completed adoption or physical attendance.
- Physical care, feeding, hydration, rescue, TNR, fostering, completed adoption/assistance, supplies, sustained support, attendance, referrals, education and awareness use private, independently reviewed proofs. At least one owned private photo/document is required. Dates must include a timezone and fall between joining and the current server time; attendance also requires an ended event and a time within its schedule.
- Manila dates define daily uniqueness and consecutive-day streaks. Care/recovery days are grouped by animal. A joined account can have only one currently approved referral across inviters, enforced by a partial database uniqueness constraint. Reviewers cannot review their own proof or a referral naming themselves.
- Discoveries/shares are stored digital activity against genuine public references. They do not prove a physical visit, actual audience reach or receipt of money. Check-ins always use the server date; submitted counters, timestamps and reward amounts cannot manufacture progress.
- Educational/awareness approvals bind to the reviewed post version. A changed post places the proof back in pending review and invalidates dependent progress; its prior decision audit remains stored.

## Canonical rewards and corrections

The existing append-only `LedgerEntry` now has a third exclusive source, `achievement_claim`. A database constraint requires exactly one of encounter grant, mission participation or achievement claim; unique source/revision keys prevent duplicate ledger writes. The approved 10–500 Kibble schedule remains one-time, non-cash milestone rewards.

Claims and corrections serialize on the authoritative wallet. Proof review locks the proof row without locking its joined submitter/profile rows, avoiding an inverted lock order with member edits. Claiming an active badge again adds nothing. Losing eligibility appends `achievement_reversed`, updates the claim and iterates dependent milestones to a fixed point. Requalification allows the member to claim the original reward again, maintaining one net reward per active badge. Top-rank and held-balance badges intentionally preserve historical milestones after ordinary rank/balance changes. No ledger history is overwritten or deleted.

`achievements/changes.py` collects affected owners while social or capture mutations finish their related rows and media. Wallet locks are acquired in a stable order; capture rewards are deferred until those locks are held and wallet objects are refreshed before achievement corrections. Capture projection, encounter rewards and achievement corrections remain inside the publication transaction. Product mutations and Django admin edits use the collector. Future bulk SQL/queryset updates that change eligibility must explicitly queue affected owners inside that context; ORM signals cannot observe arbitrary SQL.

Private evidence attached to achievement proofs or received-funds records is retained by the media removal guard. Badge/proof rows are read-only in Django admin. Public author/profile/leaderboard DTOs expose only selected active badge labels and, if explicitly enabled, aggregate mastery. Existing discoverability and contribution privacy settings must both permit sharing. Evidence files, proof details, application answers and activity references are not included in these public projections.

## Delivery and verification boundary

Subsequent owner-authorized testing used generated records in an isolated local database. Claims, independent proof review, revisions, concurrent retries, Kibble reversals and restorations passed through the actual API/BFF and Firefox UI. The test found and fixed evidence-dialog overflow and an evidence-cleanup import error. See [the end-to-end report](achievements-e2e-2026-11-08.md) for evidence, data isolation and SQLite/coverage limits. The notes below describe the original implementation handoff, before that verification.

PostgreSQL verification subsequently reproduced and fixed mission-review nullable-join locking and a wallet/account deadlock in encounter reconciliation. The corrected 12- and 24-request suites passed, including mixed-source corrections and deterministic lock-order races. See [the PostgreSQL concurrency report](achievements-postgres-concurrency-2026-11-08.md) and `backend/scripts/check_achievement_concurrency.py`.

Applied schema-only migrations:

- `social.0003_achievementshowcase_achievementactivity_and_more`
- `rewards.0003_ledgerentry_achievement_claim`
- `social.0004_achievementactivity_achievement_activity_ref_and_more` (reference lookups and the ordered review queue)

A private SQLite backup was made before migrating the existing development database. No data migration, seed command, account creation, proof submission, claim or test transaction was executed. The new tables are populated only by genuine application activity. The local API and analysis worker are reloaded to use the new models and source hooks.

Source review covered contracts, fixture exclusion, ownership/review permissions, private media, deduplication, wallet locking, source corrections and public privacy. Under the owner's standing instruction, no automated tests, type/UI/format checks, builds, browser verification or live-account walkthrough were run for this implementation. Database migrations are the schema application result, not evidence of end-to-end or PostgreSQL concurrency conformance.

No Graphify graph exists in this worktree, so relationships were traced from source without graph extraction (0 graph-extraction tokens). Jev selected the canonical-ledger approach from sanitized architectural facts (499 input / 46 output tokens); that classification is design guidance, not verification.
