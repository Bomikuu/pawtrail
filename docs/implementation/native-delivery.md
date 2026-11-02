# Native delivery record — 2026-11-02

The user directed: “proceed with the missing, dont use agents, implement natively, dont do automated testing unless told to”. All work in this phase was performed directly in the main session. The earlier subagent pipeline is no longer the execution method.

## Application source

| Work package | Source delivered                                                                                                                                                                                                                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S4/S5        | Public progression, private overview/profile/privacy editing, managed animal editing, own sightings, saved stories/profiles, scoped notifications and wallet in the header.                                                                                                                                      |
| D1–D5        | Persistent reporting, private optional coordinates, reviewed sightings/photos, geographic bounds/radius/species/adoptable filters, URL-based map searches, clustered lazy Google map, accessible no-key list fallback, behavior period map, Hordes and categorized search with cancellable keyboard suggestions. |
| A1–A4        | Optional deterministic compatibility, filters, swipe left/right/up plus labeled buttons, interests, private multi-step applications/drafts, applicant withdrawal/resubmission, shelter-scoped versioned review and private status history. Approval does not automatically mark an animal adopted.               |
| R1–R4        | Public discovery/detail, PHP integer contributions explicitly simulated, anonymous support, private campaign drafts, evidence/publication workflow, animal/Horde beneficiaries, estimates/timeline, organizer editing, reviewed photo updates, private receipts, append-only expense corrections and closure.    |
| W1/W2        | Mission/quest creation, unique acceptance, private evidence, independent review, atomic notification/reward writes, immutable approval/reversal entries, wallet, source-derived level/badge and deterministic public ranking.                                                                                    |
| W3/W4        | Public shelter aggregation, scoped organization workspace, consenting public volunteer attribution, explicit private shelter verification submission, events, organizer edits/cancellation and capacity-checked desired-state RSVP.                                                                              |
| I1–I3        | Shared browser/Django typed client factory, known-key serialization, bounded refresh/replay, sealed credentials, constrained pagination/media, public metadata/OG/JSON-LD, robots/sitemap, mutation invalidation and same-session transaction guard.                                                             |
| I4/I5        | Automated validation/acceptance work intentionally skipped by user instruction. Production loading/error/empty/keyboard/reduced-motion behavior was authored in source.                                                                                                                                          |
| I6           | Reproducible setup, environment reference, architecture/backend/demo documentation, truthful release/verification record and an explicit opt-in manual CI workflow with no automatic triggers.                                                                                                                   |

## Evidence and limits

Source reviewed and formatting edits applied. No automated tests, type/UI/format checks, detector scans, production builds, browser inspections or live external-service validation were run during this phase. This record describes implementation, not verified behavior or production acceptance. The existing preview process was preserved.

Default scope remains the local demonstration frontend/BFF. Google Maps requires a restricted key; the fallback remains usable. A real Django server, production storage/session decisions, real identity verification, external notifications, real payment processing and deployment remain separate infrastructure. Original brand artwork still needs owner approval.

## Decisions carried into source

- Preserve established DTO names and the approved community-journal direction; extend bounded inputs only where a complete flow needs them.
- Reuse the existing atomic repository and its actor-scoped receipts. The new workflow field is optional when loading version-7 files, so current preview data is retained.
- Keep exact coordinates and receipt/evidence associations out of public DTOs. Uploaded photos require publication review; evidence never becomes a public image.
- Reuse community publication for photo campaign updates; do not create another moderation entity kind.
- Add reverse ledger entries, never delete earned history. Keep human adoption approval separate from a completed real-world adoption.
- Do not describe skipped automated gates or unverified integrations as passed.
