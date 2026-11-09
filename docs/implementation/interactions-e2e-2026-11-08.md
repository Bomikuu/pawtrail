# Interaction testing — 8 November 2026

## Environment and data

Firefox against the actual Next BFF, Django social API and Daphne housing/map service. Registered a generated member through the UI and signed in as an existing local manager. Mutations used isolated copies of the populated SQLite databases and media, on ports 3001/8003/8004. No fabricated JWTs or forced authentication were used in browser journeys. Django regression tests use ordinary test databases and APIClient authentication.

Generated content included stories, a comment, a harmless photo, private care-note attachments, a cancelled event, mission evidence, a private adoption application and a practical-help map request. Existing persisted fixtures supplied animals, shelters and missions. No proximity fixtures were injected into the browser. The main database received the schema migration and fixes, not these generated posts or applications.

## Completed interaction journeys

| Area | Actions exercised | Observed result |
| --- | --- | --- |
| Community | Text and photo creation; linked animal; pending publication; independent review; comment submission/review; edit; delete; reload | Pending content stays private; author sees their pending comment; published comments update counts; deleted stories return 404 |
| Reactions and saves | React/save, reload, simulated failed reaction | Persisted state returns after reload; failed optimistic reaction rolls back |
| Photo privacy | Private upload preview; reviewer preview; publish; remove; image URL fetched before/after | Previously public image changes from 200 to 404 when its last public use is withdrawn |
| Profile and privacy | Change name/bio; hide public profile; reload; restore discoverability | Changes persist; anonymous hidden profile returns 404 |
| Animals | Edit populated animal; attach private evidence; reopen pending edit; independent publication | Edit returns to review, attachment persists separately, public evidence URL remains unavailable |
| Events | Create; reserve place; cancel through manager edit; withdraw RSVP | Real RSVP persisted, cancelled event remained readable, final attendance returned to zero |
| Mission dashboard | Accept; upload evidence; reject; resubmit; approve; reverse approval; text-only resubmit | Each transition persisted; missing-photo approval rejected; resubmission preserves its existing attachment; generated mission credited zero Kibble |
| Adoption | Save partial draft; reopen; submit; manager approval; applicant withdrawal; reload | Private answers persisted and status history advanced through submitted, approved and withdrawn |
| Fundraiser | Organizer text update; beneficiary controls | Text update remains an update without creating a misleading community publication; controls display names rather than UUIDs |
| Notifications | Mark visible activity read; reload | Read state persisted |
| Map discovery | Search; select Horde; save place; reload; saved filter; profile path | Real populated results display; saved state persists on device |
| Map reports | Select a point; submit help request; reload own reports; second-account review; publish generalized summary | Private original description stays hidden from discovery; only the approved summary appears publicly |
| Story Play | Intro dialogue; inventory; journal; accept quest; keyboard movement; pause/save; reload | Quest and position persist locally; Game Kibble stays distinct from platform rewards |
| Housing Play | Enter authenticated home; connection; change house name; reload; choose cottage layout | Name persists; cottage action succeeds after reachability fix; all three furnished presets pass server validation |
| Responsive map | 390 × 844 viewport; unanswered geolocation permission; filters | No horizontal overflow; location request falls back to manual selection |

Browser artifacts are in `output/playwright/interactions-e2e-2026-11-08/`. Some exploratory scripts timed out because selectors or navigation expectations were wrong; their error artifacts are retained as diagnostics, not counted as application failures or successful tests. An anonymous request made through a shared browser request context cleared that context's session; the generated member was signed in again through the UI before completing withdrawal.

## Fixed defects

1. Firefox bodyless DELETE/POST requests could expose an empty stream. The BFF tried to parse it as JSON and rejected valid actions. Empty requests now work; malformed nonempty JSON still fails.
2. Text stories and comments bypassed the review promised by the UI. Both now enter review; own pending comments survive reload, and notifications are sent on publication.
3. Populated moderation subjects omitted the required nullable verification field, breaking the dashboard contract. Comment moderation and verification filters now use the actual supported subject types.
4. Soft-deleted stories remained accessible to their authors. Removed stories now disappear and return 404.
5. Withdrawn content left its public photo URL accessible. Public access is reconciled against remaining published uses without deleting private audit files or images shared by another public record.
6. Animal edits remained published and discarded verification attachments. Edits now return to review, retain explicitly supplied private evidence, allow authorized reopening and protect attached evidence from deletion. Migration: `social.0005_animal_profile_evidence`.
7. Real token expiry caused Proxy redirects to fail because their Location was relative. Renewal now uses a validated absolute browser origin and preserves the Play/dashboard return path on `127.0.0.1`.
8. Mission resubmission silently dropped saved attachments. Existing evidence is supplied to the form; submitted work opens the Awaiting review filter.
9. Fundraiser text updates incorrectly created community posts. Only photo updates create pending publications. Pending/removed photo updates stay out of the campaign's public timeline; the timeline reflects the reviewed post's current text and photos. Newly uploaded story photos can enter review.
10. Shelter and beneficiary selectors displayed raw record IDs. Forms now present names from the real API. Stale demo/payment/adoption copy was corrected.
11. Valid house layouts failed a redundant grid-cell check despite a reachable navigation path. The validator now uses its existing path-aware approach check. The woven rug also has alternative inspect approaches so a table or wall cannot cover its only approach. Catalog geometry was updated identically in the standalone frontend, integrated frontend and housing backend; native frame sizes and animation counts were unchanged.
12. An unanswered location permission prompt could keep the map busy indefinitely because browser acquisition timeouts may exclude permission waiting. Both discovery and report location picking now have an application deadline and ignore late results.
13. Adoption drafts/submissions for fixture animals did not inherit fixture provenance. Newly created applications now retain the animal/shelter fixture flag. Achievement eligibility already excludes fixture animals and shelters.

Pending post controls also no longer expose save/comment actions that cannot succeed before publication.

## Validation

- Django social regressions: **7 passed** (publication, comments, moderation DTOs, animal evidence, shared-photo withdrawal, fundraiser updates and adoption fixture provenance).
- Housing regressions: **2 passed**, covering every floor of the three current furnished presets and rejection of entrance-obstructing furniture.
- Focused frontend/API regressions: **12 passed** across empty requests, renewal/refresh, discovery, notification contracts and geolocation timeout/denial.
- Integrated and standalone TypeScript checks and the UI boundary check: passed. No production build was run.
- Wider existing unit suite: **148 passed, 147 failed; 14 files passed, 48 failed**. It remains ungreen. Failures include tests that expect removed demo seed records, outdated navigation mocks and old UI assertions. These are not represented as passing E2E coverage and were not repaired by restoring runtime demo fixtures.

The isolated database audit recorded **0 reward ledger entries, 0 identification references and 0 collected-fund receipts**. The final main-database audit also confirmed those three counts remain zero, the new migration is installed, and no generated E2E posts or member profile were added. The mission was explicitly a fixture with `credited=0`. Game currency was only local/server game currency. A private SQLite backup was taken before applying the main migration.

## Limits

This covers the journeys above, not every possible product permutation. Physical camera identification, real-world proof, money collection, external Google sign-in, all multi-user housing interactions and furniture drag placement were not certified in this pass. Real PostgreSQL contention was covered separately in the earlier concurrency report; this interaction pass used isolated SQLite copies.

A tool-host restart interrupted the final isolated preview checks. Persistent source, data and results survived; the normal API, housing service, worker and port-3000 preview were restored. Main-preview follow-up confirmed all 17 dashboard destinations returned 200 with no page errors, the feed returned 12 records, and the map displayed 18 animals. Results are recorded in `main-dashboard-pages-final.json`, `main-public-smoke.json` and subsequent `main-*.json` artifacts. Temporary test processes are stopped and their private copied databases, account credentials and compiler output have been removed. Ports 3001/8003/8004 are closed. The main preview, social API, housing service and analysis worker remain running.
