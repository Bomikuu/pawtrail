# Animal medical records

Implemented in the social worktree, independently of the standalone Phaser/3D work. Existing public animal profiles have a server-rendered Medical tab; animal editors link to a private medical record book at `/dashboard/animals/[slug]/medical`.

## Data and care status

`AnimalMedicalRecord` persists vaccinations, veterinary visits, treatments, tests and other care against the existing `AnimalInfo`. Care status is explicitly planned or performed. Performed entries require an actual date no later than today in Asia/Manila; follow-up dates are manually entered and cannot precede an entered care date. No clinical entries, vaccination schedules, diagnoses, clinical verification or Kibble rewards are generated. The local database migration `social.0006` is applied; no clinical data was added for the screenshots.

Records are private by default. Sharing requires a separate nonempty summary and exposes only the care type, planned/performed status, dates and public summary. Internal names, providers, clinics, product/dose/batch fields, private notes, document references and correction history never enter the public DTO. No uploaded document establishes veterinary verification. Unknown or unshared history does not imply that an animal is unvaccinated or has not received care.

## Permissions and document retention

The existing caretaker, responsible shelter owner/staff and administrators can manage records. The backend authorizes the current relationship; the browser does not establish permission. Writes serialize the actor and animal care relationship, enforce expected versions on corrections and retain the standard idempotency contract. Current management permission is checked before an idempotent result can replay, preventing a former caretaker from retrieving a saved private response after access changes.

Medical attachments must be private evidence uploads. New attachments must belong to the actor; existing record attachments may be retained by another authorized manager. The medical upload adapter also marks new files sensitive. Private media access extends to current authorized animal managers while preserving original uploader access. Corrections retain revision snapshots and old document references. The existing media deletion endpoint refuses files attached to current records or retained revisions. Removing a saved document from a current entry unlinks it from that entry, without deleting its history.

Each correction requires a reason. Archive/restore is confirmed, uses the expected version and records an audit/revision entry. Archive hides the shared summary; restoring a previously shared record republishes that summary, as stated in its confirmation. The management UI shows up to ten recent revision metadata entries; older snapshots/documents remain stored and are not exposed by a public endpoint.

## API

The real adapter maps typed `/animals/:animal/medical` calls through the existing BFF to Django `/social/animals/:key/medical`. GET accepts `scope=public|manage`, `archive=active|archived|all` and scoped cursor pagination. Public reads allow only active shared summaries. POST creates; PATCH `/:record` corrects or archives/restores. Both use the existing mutation envelope and audit machinery. Pagination uses the existing top-level Django results envelope and real-adapter cursor wrapping. Unconnected adapters return unavailable, without clinical fixture fallback.

## UI and review evidence

Existing registry-installed shadcn controls, Tailwind, Saira Condensed headings and Instrument Sans controls/body are preserved. The Medical navigation item scrolls into view horizontally on small screens. Existing upload fields accept a scoped privacy explanation; the default copy for other workflows is unchanged.

Impeccable used the announced direct-context fallback after its launcher was unavailable in this session. The implementation was reviewed directly, without subagents, under the user's instruction. Jev CLI 0.7.0 / jev-1.14.0 ran twice on generic design/policy summaries only: it selected permission/privacy review, then correctly classified the feature as care-team reported with explicit sharing rather than veterinary verification. Jev output is advisory; permission enforcement was reviewed in source.

Firefox captured desktop (1440px) and mobile (390px) views, using an existing authorized local manager and the existing Oreo record. The initial batched pass reported no page errors or horizontal overflow. The final confirmation showed the selected Medical tab visible on mobile. Opening the blank editor and following its public-profile link worked. Screenshots contain actual rendered UI, an empty care history and an unsaved form; zero clinical records were created.

Artifacts are in `output/playwright/medical-2026-11-08/`: `medical-editor-desktop.png`, `medical-editor-mobile.png`, `medical-profile-desktop.png`, `medical-profile-mobile.png`, and `medical-summary-mobile.png`.

The final required `npm run check:ui` passed. An earlier run flagged a raw select in the separate `src/features/neighborhood/components/game/model-workshop.tsx:153`; it was resolved in concurrent workspace work before the final run. This task did not modify that file or other 3D systems. No production build, broad test suite, clinical create/correct/archive end-to-end test or private-document upload test was run. Backend mutation and concurrent-write behavior were source-reviewed, not runtime-tested for this feature.

## Operation status

The Playwright wrapper's direct executable launch was denied with `Permission denied` because the readable script had mode 664. After inspecting the missing executable bit, the denied operation was retried once through `bash` and succeeded. No further denied action remains pending. Database migration, API restart and screenshot captures completed; the local preview remains running.
