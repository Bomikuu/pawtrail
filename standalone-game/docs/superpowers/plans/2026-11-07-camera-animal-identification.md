# Camera-first Animal Identification Implementation Plan

**Execution update — 7 November 2026:** The owner approved native phased implementation. The real capture vertical slice now lives in `/home/micxsz/projects/pawtrail/.worktrees/implementation`; see its `docs/implementation/camera-identification.md` and `backend/README.md` for the implementation/activation boundary. Phases 1–4 and the automatic-policy/cloud-assistance mechanisms were implemented. The follow-up implements the canonical real sighting ledger, wallet/history UI, calibration preparation/report import and guarded activation. The owner selected setup for future captured photos; actual calibrated activation, recognition evaluation and genuine reference enrollment await that data; no automated verification was authorized or run. The original task checklist below remains the planning baseline rather than a claim that those remaining gates passed.

> **Execution:** Draft for owner review. Implement natively in the main session without subagents, following the user's instruction. Do not author or run automated tests, checks, builds, model benchmarks or browser verification unless requested. Evaluation cases below describe future release work, not authorization to execute it.

**Goal:** Let people photograph an animal, automatically identify strong existing matches, and register/review uncertain observations without corrupting identities or exposing exact locations.

**Architecture:** Next.js capture UI and same-origin BFF send private evidence to a real platform Django API. A background worker performs detection, image processing and visual/geographic retrieval; a versioned decision service handles automatic acceptance, abstention and correction. Publication, reference enrollment and reward eligibility remain separate from model similarity.

**Tech stack:** Existing Next.js/TypeScript/shadcn/Tailwind platform; proposed Django/DRF, PostgreSQL/PostGIS/pgvector, private object storage, Celery/Redis, Pillow/OpenCV and replaceable licensed detector/embedding providers. Model weights and cloud provider are selected through the evaluation and terms gates, not assumed solved.

**Spec:** [Draft design](../specs/2026-11-07-camera-animal-identification-design.md).

## Global constraints

- Planning only until the owner approves implementation. Preserve unrelated work and the running development preview.
- No agents or unrequested automated verification. The model release evaluation must be requested before real automatic matching can be approved.
- Use official shared shadcn/ui sources and Tailwind-first composition. No parallel primitive/CSS system.
- Real-world platform root (`P`): `/home/micxsz/projects/pawtrail/.worktrees/implementation`.
- New platform backend (`B`): `P/backend`, not the game's `/home/micxsz/Documents/ChatGPT/pawtrail/backend`.
- Existing platform routes, BFF token handling, object permissions and error envelope remain authoritative integration conventions.
- Server-derived, versioned identification and idempotent ledger effects only. No simulated output labeled real identification.
- Exact positions, original EXIF and private evidence stay out of public payloads and images. Keep the public minimum 500 m area radius separate from matching logic.
- No bulk migration of all social modules in this work package; build the real capture/animal/sighting vertical slice and explicitly show unavailable integrations.

## Review focus

1. A similar-looking unknown cat must not be forced into the nearest known identity.
2. Missing/stale GPS or relocation must not reject an otherwise useful observation or imply false capture coordinates.
3. Retrying the same media/job/submission must not create another animal, independent encounter or reward.
4. An obsolete analysis, changed crop or withdrawn reference must not be accepted after its version changes.
5. Public derivatives, candidate explanations and revoked/private records must not leak original locations or private references.

## Contract and file boundaries

Existing frontend entry points: `P/src/app/(public)/sightings/create/page.tsx`, `P/src/app/(public)/animals/report/page.tsx` and their exports in `P/src/features/workflows/public-pages.tsx`. Keep route shells/server metadata; move the new client interaction into focused feature components.

Create `P/src/features/capture/{schemas.ts,types.ts,capture-flow.tsx,camera-panel.tsx,location-step.tsx,analysis-progress.tsx,match-candidates.tsx}`. Add `P/src/features/sightings/identity-status.tsx` and `P/src/features/moderation/identity-review.tsx`. Reuse shared media, buttons, dialogs, skeletons and existing review permissions rather than duplicate them.

Extend `P/src/lib/api/{contracts.ts,client.ts,keys.ts,serialization.ts}`, the existing Django/mock adapters and `P/src/app/api/v1/[...path]/route.ts` as necessary. Inspect dispatch/serializer conventions at execution time before adding explicit new fields. Mock scenarios must remain labeled demonstrations.

The new backend separates `B/config/`, `B/accounts/`, `B/media/`, `B/animals/`, `B/observations/` and `B/identity/`. Keep HTTP views/serializers thin; split `B/identity/{pipeline.py,features.py,retrieval.py,decision.py,providers.py,tasks.py}` by responsibility. `B/observations/service.py` owns versioned submission and confirmation transactions. `B/media/service.py` owns private originals/public derivatives. Record API additions in `P/docs/contracts/capture-identification.md` and update the existing integration guide.

Proposed API additions (all same-origin `/api/v1` in the browser):

| Method/resource | Input or output |
| --- | --- |
| `POST /captures` | Owner-scoped uploaded media ID, capture source/time and private location assertions → capture ID/version |
| `POST /captures/:id/observations` | Selected crop/detection → observation ID/version |
| `POST /observations/:id/analysis` | Observation version and idempotency key → `202`, analysis ID/status |
| `GET /observations/:id/analysis` | Owner/reviewer-safe status, candidates and actionable outcomes; no raw feature vectors/private reference IDs |
| `POST /observations/:id/submit` | Version, proposed animal ID or provisional registration, notes and idempotency key → pending/accepted observation receipt |
| `GET /moderation/animal-identities` | Authorized scoped review queue |
| `POST /moderation/animal-identities/:id/decision` | Versioned confirm/reassign/reject/dispute decision → current decision receipt |
| `GET/POST /animals/:id/references` | Authorized reference-gallery curation with media ownership and provenance checks |

Keep the current `sightings.create` operation for compatible callers, but route it through the same server evidence/identity policy. It must not become a bypass that can publish arbitrary named sightings without analysis or review.

Shared types: `CaptureInput` contains `mediaId`, `source=browser_camera|device_capture|gallery`, nullable `capturedAt` and nullable location `{latitude,longitude,accuracyMeters,measuredAt,source=device|exif|manual}`. Location and source are client assertions, not attestation. Preserve separate EXIF/device assertions server-side when both exist. `AnalysisResult` contains `analysisId`, `version`, stage/status, detected animals, public-safe `candidates` and typed reason codes; it does not manufacture calibrated probabilities. `ObservationSubmission` carries `observationVersion`, nullable `proposedAnimalId`, optional provisional description and notes. `ObservationReceipt` distinguishes identity, evidence and publication states plus nullable resulting `sightingId`/`animalId`.

## Phase 1 — Real evidence and identity contract

**Deliverable:** A real authenticated persistence boundary for this vertical slice; no dependence on game housing sessions or local mock truth.

- [ ] Add the capture DTOs and schemas above; extend the API contract/explicit serialization and standard typed errors. Make coordinate pairs/accuracy/time coherent and distinguish unknown from zero.
- [ ] Update `P/PRODUCT.md` and the platform architecture/API documentation to make camera-based animal encounters the primary entry point while retaining the human-authored social feed and care/adoption workflows.
- [ ] Create the platform Django project and capture-domain apps at `B`; implement the existing platform login/refresh/session contract and minimum animal/media/sighting endpoints used by this slice. Reuse the existing BFF's sealed token transport. Do not silently mix mock actors/animal IDs with real records.
- [ ] Add ownership/scoped reviewer permissions, `Capture`, `AnimalObservation`, `AnalysisRun`, `IdentityDecision` and `AnimalReference` persistence plus migrations. Bind source media and crops to immutable evidence versions.
- [ ] Implement `create_capture(actor, input, key)` and `create_observation(actor, capture_id, selection, version)` returning owner-scoped DTOs. Reject cross-owner/private-resource access without existence disclosure.
- [ ] Implement private image decoding/storage and metadata-stripped public derivatives. Preserve existing 10 MiB request limits; configure decoded-pixel limits and explicit supported formats. Public publication uses only the derivative.

**Future evaluation:** Real-mode authentication/ownership, missing coordinate pairs, unauthorized reviewers, unsupported/oversized/corrupt images, and public image/DTO metadata separation. Leave unimplemented platform features visibly unavailable in real mode rather than inventing records.

## Phase 2 — Camera-first contributor flow

**Consumes:** Capture/observation contracts from phase 1.

**Produces:** Persistent capture with selected animal and resumable analysis state.

- [ ] Compose `capture-flow.tsx` from official controls; replace the old animal-first sighting form and connect the animal-report route to the same intake. An animal-specific entry point seeds a proposed candidate only.
- [ ] Make **Spot an animal** a prominent platform action using the existing shell/navigation components; retain ordinary story creation as its separate action.
- [ ] Implement rear-camera preview/capture, accessible retake, separate gallery path and cleanup of media tracks. Normalize browser captures to a supported upload format without representing that conversion as verification.
- [ ] Implement location permission/freshness feedback and accuracy capture. Gallery uploads ask about capture location rather than attaching today's GPS as historical fact; allow explicit unknown/manual input.
- [ ] Create capture/observation records, start analysis asynchronously, and display stage-shaped skeletons/progress. Preserve the draft across transient failure; support retry/cancel without reassigning an analysis to a changed photo.
- [ ] Remove fixed dates and default-first-animal selection. Present candidate comparison, **None of these**, **I'm not sure**, and provisional registration with clear status.

**Future evaluation:** Real phone camera permission denial, no camera, gallery without EXIF, poor GPS, upload failure, multiple animals, crop changes, navigation away and return. No browser verification is authorized by this plan itself.

## Phase 3 — Detection, replay checks and reference enrollment

**Files:** `B/media/service.py`, `B/identity/{providers.py,pipeline.py,features.py,tasks.py}`, `B/animals/models.py`, `B/identity/models.py` and the reference-curation UI/API.

- [ ] Define provider interfaces `detect(image) -> DetectionResult` and `embed(crop, view) -> VersionedEmbedding`; use explicit unavailable/failed results until actual weights are selected. Do not return invented animal confidence in production.
- [ ] Register a selected, terms-reviewed detector; add decoding/quality/animal-box analysis, normalized crop selection and meaningful retake/review reasons.
- [ ] Add SHA-256/perceptual hashes, previous-submission comparison and burst grouping. Store replay signals privately; retries reuse work but never reveal other people's evidence.
- [ ] Add independent reference approval/withdrawal and face/left/right/body viewpoint metadata. Exclude sample stock/game art and unreviewed automatic matches from reference truth.
- [ ] Add bounded Celery jobs, durable stage state, finite retries and worker failure recovery, keyed by content/crop/provider versions.

**Future evaluation:** Non-animal photos, animal illustrations/screens, poor crops, different animals in the same scene, repeated/recompressed photos, legitimate similar scenes and worker restart. Report detector limitations; do not claim guaranteed scene authenticity.

## Phase 4 — Visual/geographic matching and review

**Files:** `B/identity/{retrieval.py,decision.py}`, `B/observations/service.py`, capture candidate components, `P/src/features/moderation/identity-review.tsx` and sighting/public location projections.

- [ ] Implement `retrieve_candidates(observation_id, analysis_version) -> list[CandidateEvidence]`: union geographic and global visual retrieval, rank across curated multi-view references, and return at most five public-safe identity suggestions.
- [ ] Use trusted location/time history and both GPS uncertainty values as supporting features. Keep no-GPS/wider-area retrieval and relocation review paths; public radii are not internal matching thresholds.
- [ ] Implement `assess_identity(evidence, policy_version) -> IdentityAssessment` with match, ambiguous, unknown and unsupported outcomes. Preserve top-competitor/trait-conflict reasons; abstain when required data or a valid policy is unavailable.
- [ ] Implement authorized versioned review, provisional profile handling, disputes and reassignment. Reporter agreement alone does not constitute independent confirmation. Propose possible profile duplicates without automatic merges.
- [ ] Make approved sightings, animal histories and map areas read the corrected decision history. Keep pending observations out of trusted location/reward aggregates. Label historical approximate areas explicitly.

**Future evaluation:** Smokey versus a similar neighboring cat, no known match, moved animals, withdrawn references, stale analyses, cross-permission candidate media and conflicting concurrent submissions.

## Phase 5 — Calibrated automatic acceptance and reward integration

**Consumes:** Versioned observations, references, retrieval and decision services from phases 1–4.

**Produces:** Automatic confirmation for qualified inputs, with reversible publication/reward effects.

- [ ] Curate a consented, independently labeled benchmark with enrollment/query separation, unknown individuals and difficult similar pairs. Record model/license/dataset provenance; keep demonstration data separate.
- [ ] When explicitly requested, evaluate detection, top-five retrieval, selective accepted-match accuracy, unknown false accepts, coverage and condition-specific failures. Fit calibrated thresholds and top-two margins from those results.
- [ ] Evaluate the proposed wrong-identity bound from the spec and document accepted policy/model/gallery versions. Enable automatic acceptance only for qualifying cohorts; keep other submissions useful through review. A numeric cosine score or cloud self-confidence is never a calibrated identity probability.
- [ ] Implement `submit_observation(actor, input, key) -> ObservationReceipt` as an atomic version/policy recheck and state transition. Strong accepted identity can produce an automatic match; contradictory evidence still prevents verified publication.
- [ ] Connect accepted sightings to the real platform reward authority with a unique per-observation ledger source and reversal path. If that authority is not implemented, show no authoritative Kibble award; never use game/local balances or a second independent wallet.
- [ ] Add automatic-policy disable/rollback, audited correction and downstream invalidation. Independent reference enrollment remains required even after an automatic match.

**Future evaluation:** Simultaneous submits, replay/retry, incorrect auto-match correction, one-time reward/reversal, policy/model rollback and reference changes between analysis and submission. No accuracy or latency claim is made before this evaluation.

## Phase 6 — Selective cloud assistance and controlled expansion

- [ ] Compare a chosen provider only on ambiguous candidate pairs with an explicit JSON result: similarities, differences, insufficient evidence. Review processing terms and record user-facing processing notice before sending real photos.
- [ ] Add per-observation/provider budgets, caching and timeouts; unavailable cloud service preserves a pending/reviewable observation. It cannot bypass automatic acceptance gates.
- [ ] Measure improvement against the phase-5 baseline before enabling paid fallback broadly. Expand to additional communities, dog identities and low-light conditions only with matching evaluation coverage.
- [ ] Document operations, reference maintenance, abuse/correction routes, latency/queue/cost monitoring, and the API consumed by animal profile/adoption/quest features. The game reads accepted platform identities; it cannot create real-world verified sightings from virtual activity.

## Review handoff

The design preserves the user's requested automation and human-review fallback. The first release should deliver a complete capture-to-record vertical slice; recognition automation is released against measured data rather than demonstrated with random photos and fabricated certainty. This plan changes documentation only and does not start execution.
