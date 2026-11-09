# Live Django social services

Implemented 8 November 2026 using the existing Django database, JWT account boundary and append-only Kibble ledger. All frontend routes use `NEXT_PUBLIC_USE_MOCK_API=false`. The restored social, management and game discovery interfaces load persisted records, without browser fixtures or repeated Sample tags.

## Services

- **Missions:** public filters/details; authorized creation; accept; owner-only evidence submission; versioned independent review; photo/text requirements; notifications; closing. Only eligible non-fixture contributions create Kibble ledger credits. Reversing approval appends a debit rather than deleting history.
- **Adoption:** preferences; explained compatibility based on recorded requirements; interests; private versioned drafts; application submission/resubmission/withdrawal; shelter-scoped review; one approved application per animal; atomic reservation and recorded handover. Applicant answers never appear in public profiles.
- **Fundraisers:** public campaigns; private drafts/evidence; independent publication review; progress from recorded funds; updates; private receipts; append-only expense corrections; supporter anonymity; organizer dashboards. Support pledges are stored separately from collected funds. Independent moderators can record genuine external payment receipts at `POST /api/v1/fundraisers/<id>/receipts`. This service does not charge cards or send payouts.
- **Events:** real records and venue metadata; host/staff creation and edits; ordered future dates; atomic capacity enforcement; idempotent RSVP/cancel; attendance private by default, public only by opt-in in privacy settings; updates notify attendees.
- **Hordes:** public groups, members, contributors and linked missions/campaigns; authorized membership editing. Membership stays independent of map zoom and proximity.
- **Shelters:** public profiles, managed staff membership, linked animals/activities and permissioned application/evidence dashboards. Organization records are unverified until independently reviewed.
- **Leaderboard:** period/category/search pagination; deterministic rank/ties; podium and actual contribution totals; current all-time top-ten crowns in profiles, previews and bylines. Rankings derive from eligible ledger/contribution records and respect public-profile privacy. No purchased or fixture rank is seeded.

Supporting services persist profiles, posts, comments, reactions, saved/followed records, notifications, public identities, search, geographic discovery, moderation reports and audits. Private uploads support validated images and PDF evidence; PDFs are served as private downloads and cannot enter animal identification or public imagery.

## API integration

Social animal DTOs live at `/api/v1/social/animals`, preserving the capture API's separate `/api/v1/animals` contract and evidence restrictions. The Next Django adapter routes the platform's animal reads/writes to this namespace. Other domains use `/api/v1/missions`, `/adoption/*`, `/fundraisers`, `/events`, `/hordes`, `/shelters`, `/leaderboard`, `/community/posts`, `/me/*` and `/users/*`.

Lists use filter/viewer-bound signed cursor pagination. The Next adapter carries page metadata, including leaderboard podium/summary and previous-page cursors. Writes use permission checks, atomic transitions and optional request-key deduplication; retries with changed input are rejected. Explicit expected versions protect draft/evidence/review edits. Database uniqueness/capacity constraints backstop concurrent application and RSVP requests.

Accepted camera sightings with approved public locations synchronize into the social animal directory. Unknown facts remain unrecorded. Fixture animals stay `listed` rather than `confirmed`, never enter the recognition candidate/reference gallery, and cannot create verified Kibble or independently recorded payment receipts. Capture-derived public locations are withdrawn/recomputed when evidence changes; contributing a sighting does not establish pet ownership.

## Populate the database

The social backend is in the platform worktree at `/home/micxsz/projects/pawtrail/.worktrees/implementation/backend`; the standalone game workspace’s `backend/` is the separate housing service. Run from the platform backend:

```sh
cd /home/micxsz/projects/pawtrail/.worktrees/implementation/backend
.venv/bin/python manage.py migrate --skip-checks
.venv/bin/python manage.py seed_community --skip-checks
```

The seed command is development-only and idempotent. Stable internal `seed_key` / `is_fixture` fields keep provenance manageable; it preserves existing records, edits and passwords. `--refresh-dates` moves fixture event/mission dates forward explicitly.

It creates 12 members, 3 shelters, 3 Hordes, 18 animals, 9 missions with 13 participations, 6 fundraisers, 12 unpaid pledges, 6 events, 22 RSVPs, 12 illustrated stories, 24 comments, 36 reactions and 4 private adoption applications. The two existing local operators also receive 10 saved items, 12 follows and 6 notifications between them. Two existing site illustrations are stored through the real media pipeline for stories and organization/campaign presentation; they are not animal identification photographs. It does not create recognition references, accepted sightings, collected money, earned awards or fabricated leaderboard balances. Fixture accounts have unusable passwords.

### Local fixture visibility

`Record.objects` uses the community browsing manager: persisted fixtures are visible when Django runs locally with `COMMUNITY_FIXTURES_VISIBLE`. This defaults on in debug mode and can be disabled with `PAWTRAIL_COMMUNITY_FIXTURES=0` on the Django process. Production always hides them. Related organization collections use this same browsing manager, so seeded animals, missions, RSVP counts and private staff application lists remain connected. Public member lookups follow the same local-only visibility policy.

`Record.genuine_objects` always excludes fixtures. Achievement progress, proof references, claims and source reconciliation use it explicitly, independent of local browsing settings. Identity/reference enrollment, authoritative reward and collected-payment guards retain their existing fixture exclusions. Internal `is_fixture`, `seed_key` and illustration provenance are preserved; no generated record is reclassified as genuine to make a page appear populated.

The community became empty after achievements introduced a genuine-only default manager across every social model. The 8 November population follow-up separated browsing from eligibility, refreshed fixture event/mission dates, added the linked presentation/dashboard records above and reloaded the local API/worker. A private SQLite backup was made first. Live read-only BFF requests returned 200 with 12 community stories, 9 missions, 6 fundraisers, 6 events, 3 shelters and 3 Hordes. Database counts showed 18 animals, zero genuine fixture-derived posts/missions/animals, zero ledger entries and zero identity references. No automated test suite, type/UI checks, build or browser verification was run for that follow-up.

Two actual local operator accounts are bootstrapped if absent:

- `manager@pawtrail.local` — application/admin management.
- `reviewer@pawtrail.local` — independent reviews.

Generated passwords are saved only in the private `backend/.data/local-operator-access.txt` file (mode 0600), never embedded in source or logs. Existing operator passwords/privileges are not reset or silently upgraded. Sign in at `/login`; use a separately registered member account for applicant/volunteer flows. The operator accounts are staff of the seeded shelters.

## Exercise workflows

- Browse `/community`, `/explore`, `/missions`, `/adopt`, `/fundraisers`, `/events`, `/hordes`, `/shelters`, `/leaderboard`, or `/play?map=community`.
- Accept a mission as a member, attach evidence, then review it as a different authorized operator. Seeded missions carry zero verified Kibble. For a genuine reward flow, an authorized organizer creates a real task with real evidence and no fixture animal association.
- Submit an adoption application as a member; review privately through the shelter dashboard. Approval reserves the animal; the handover API records the actual completion separately.
- RSVP and cancel attendance on an upcoming event. Public attendance requires explicit opt-in; capacity includes private RSVPs.
- Save a fundraiser pledge. It appears in supporter/organizer records but does not increase collected funds. No money moves through this action.

Fixture origin remains internal. Removing visible Sample labels does not turn fixture identities, allegations, donations or achievements into independently verified real-world facts. Game rewards remain separate from the authoritative platform wallet.

## Delivery evidence

Migrations were generated/applied and the seed command completed against the local database. Source relationships and contracts were reviewed directly. The historical requirements graph was consulted (zero graph-query LLM tokens); a compact non-sensitive plan judgment used Jev (373 input / 20 output tokens), not runtime verification. No agents, automated tests, check commands, builds or browser verification were used.

Payment-provider charging/payouts and Google OAuth credentials are external integrations; they are not simulated as successful transactions. Achievement claiming/proof workflows outside these seven services remain separate from this delivery.

## Achievements follow-up

The real achievements endpoints, reviewed proofs, consented showcases and canonical milestone ledger source are now implemented. They exclude fixture data and use the live server clock; no achievement seed records or demo accounts were added. See [real database achievements](real-achievements.md).


## Mixed collection portraits — 9 November 2026

Eight existing local fixture pets now have public photo derivatives from the already licensed pet collection; ten keep null photos and use illustrated fallbacks. The scoped `seed_community_photos` management command preserves existing photos and real records and retains full source-license provenance internally. It creates no identification evidence or verified activity. See `mixed-pet-photos-2026-11-09.md` for exact assignments, reproducibility and execution scope.
