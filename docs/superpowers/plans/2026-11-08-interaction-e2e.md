# Interaction E2E Implementation Plan

**Goal:** Exercise generated-data user journeys through Firefox and fix failures in their UI or real service boundaries.

**Architecture:** Run a separate Next development preview and Django social/housing services backed by isolated copies of the populated SQLite databases. Use ordinary UI registration/login, real APIs and generated content. Preserve the current preview and database. No agents, production builds or commits.

**Spec:** Current user request: test community posts/comments, dashboard actions, maps and Play end to end, using generated data and fixing failures.

## Tasks

- [x] Community: create/edit/delete text and photo stories, linked animals, comments/review, reactions/save, failure rollback and reload persistence across two accounts.
- [x] Dashboard: profile/privacy, notifications, animal evidence, event creation/edit/RSVP, mission evidence/review/reversal, adoption draft/submit/review/withdraw and campaign text updates.
- [x] Maps: search/selection, saved state/reload, private help report, generalized review publication, mobile filters and unavailable location fallback.
- [x] Play: dialogue, inventory/journal, quest acceptance, keyboard movement, local save/reload, home name persistence and furnished preset validation.
- [x] Fix reproduced defects; focused regressions, TypeScript and UI boundary checks pass. Wider unit suite failures are documented explicitly.
- [x] Record zero generated authoritative rewards, references or collected receipts; back up/migrate main database and restore normal services. Final main-preview dashboard and responsive smoke checks recorded; isolated copied data and compiler output removed.

See the report for exact completed journeys and untested permutations.

## Review focus

- Cross-account/private-data leakage and optimistic state surviving failed requests.
- Repeated submissions and stale versions duplicating records or losing edits.
- Removed/pending content visibility after reload and public navigation.
- Map and game data loading, destination preservation, local versus platform reward boundaries.
- Mobile dialogs, forms and file inputs remaining usable.

## Execution

Implement directly in this session, as explicitly instructed. Record results and fixes in docs/implementation/interactions-e2e-2026-11-08.md. New generated test content stays in the isolated databases; fixture evidence never becomes verified Kibble, identification references or collected money.
