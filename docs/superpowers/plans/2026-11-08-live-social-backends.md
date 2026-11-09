# Django social backends and database fixtures

**Goal:** Replace the unavailable social domains with persisted Django workflows and populate usable fixtures, without repeated Sample tags, agents, automated tests, checks or builds.

**Architecture:** One social Django app with normalized foreign keys, explicit domain modules and shared permission/pagination/idempotency helpers. Existing animal identity and immutable Kibble tables remain authoritative. The social animal projection is a separate API namespace so camera detection/calibration never treats fixture animals as enrolled identities. Fixture origin remains internal and reversible through stable seed keys; public provenance identifies database origin without adding Sample labels.

**Execution:** Direct implementation, explicitly requested by the owner. Add schema migrations and apply them with skip-checks. Seed idempotently into the actual development database. Do not reset genuine records or create paid donations, confirmed sightings, identification references, earned awards or transferred funds from fixtures.

1. Add shelters/staff, Hordes/members, public animal metadata, profiles, posts/comments/follows/notifications and admin interfaces.
2. Implement missions: creation, accept, evidence, independent authorized review, version/conflict checks, notifications and append-only mission Kibble/reversals. Fixture tasks carry no verified rewards.
3. Implement adoption: preferences, compatible candidates, interests, private drafts/applications, owner/shelter scoping, state histories and approval locks.
4. Implement fundraisers: private drafts, publication review, updates, private receipts, append-only expenses/corrections, pledges, supporter privacy and staff dashboards. Pledges never count as collected money.
5. Implement events with future dates, ordered times, public venues, capacity locking, private/public attendance preferences and host management. Add shelter/Horde write APIs and permissioned dashboards.
6. Implement leaderboard from authoritative, eligible contributions with fixed tie ordering, period/category filters, filtered pagination, global top-ten recognition and profile/byline integration.
7. Restore full platform pages and game discovery/mission/adoption integration. Adapt public photos, nullable unknown animal facts, pledge UI and API transport. Remove unavailable-state guards for implemented domains.
8. Apply migrations and populate curated linked fixture accounts, organizations, animals, missions, applications, campaigns, pledges, events and stories. Bootstrap local operator access securely without resetting existing passwords. Persist no recognition training/evidence records from fixtures.
9. Update README and agent guidance with live services, seed lifecycle, access paths, money limitations and the no-verification status. Restart only affected development services.

## Delivery

Implemented all seven domain service groups, normalized supporting social records, permissioned transitions, private media and financial record boundaries, cursor integration, full page restoration and game links. Applied social/media/rewards migrations and populated the linked seed in the actual local database. Local operator credentials remain private. Fixture records have internal origin markers but no repeated Sample tags. Source-only review and mutation-formatting were used; no automated tests/checks/builds/browser verification or agents. See docs/implementation/live-social-backends.md for entry points and external payment limitations.
