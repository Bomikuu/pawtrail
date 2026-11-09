# Camera-first animal identification — draft design

Date: 7 November 2026. Status: proposed for review; no implementation authorized by this document.

## Intended outcome

PawTrail's primary real-world action is photographing an animal. The platform checks the photo, finds plausible existing identities, and records either a sighting of an existing animal or a provisional new animal. The user explicitly wants both automatic identification and human confirmation: strong evidence should be accepted automatically; uncertain or disputed cases should reach an authorized caregiver or moderator.

Success means fewer duplicate profiles and misidentified sightings without making ordinary contributors wait for manual approval on every strong match. A photograph containing a cat, a photograph matching Smokey, and evidence supporting where/when the photograph was taken are three different decisions.

## Existing system and project boundary

- Social platform: `/home/micxsz/projects/pawtrail/.worktrees/implementation`. Next.js, typed API adapters, official shadcn/ui, Tailwind, and a local mock/BFF implementation. `docs/backend-integration.md` explicitly says the platform Django server is not included.
- Its `SightingPage` in `src/features/workflows/public-pages.tsx` currently selects an animal from the first 50 records, preselects one, uses a fixed sample date, and accepts optional manually entered coordinates. This is a report form, not an identification flow.
- `src/features/sightings/schemas.ts` requires an animal ID before submission. It has no GPS accuracy, capture source, analysis result, candidate comparison, or identity decision.
- `src/features/media/upload-field.tsx` supports ordinary uploads. Server media validation inspects file signatures and size; this does not detect animals. Public delivery currently reads stored bytes, so a separate metadata-stripped public derivative is necessary for capture evidence.
- Current workspace: `/home/micxsz/Documents/ChatGPT/pawtrail`. It contains the separate Phaser game and a Django housing service. `backend/config/urls.py` exposes home endpoints, not the platform animal/sighting API.
- Implement the real-world flow in the social platform. The proposed platform backend belongs at that worktree's new `backend/` directory. Do not repurpose the housing service or overwrite unrelated platform changes. A future external platform backend can implement the same contract instead.

## Approaches considered

| Approach | Useful for | Main limitation |
| --- | --- | --- |
| Color, shape and geographic rules | Cheap filtering and explainable similarities | Similar cats, lighting and backgrounds make individual identification unreliable |
| Cloud vision on every submission | Quick semantic analysis and comparisons | Recurring cost, latency, external image processing, and no guaranteed individual identity |
| Local detection/re-identification plus rules, selective cloud comparison and review | Efficient candidate retrieval, controlled automation and correction | Requires curated reference photos and measured accuracy |

Recommend the hybrid approach. Detection and embeddings are already AI: the useful distinction is inexpensive local processing versus optional paid generative vision. Conventional image processing supports identification; it cannot replace a model trained or evaluated for distinguishing individuals.

Animal re-identification is an established research task. That does not establish accuracy for PawTrail's street cats or camera conditions. [PetFace paper](https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02660.pdf) and [WildlifeDatasets paper](https://openaccess.thecvf.com/content/WACV2024/papers/Cermak_WildlifeDatasets_An_Open-Source_Toolkit_for_Animal_Re-Identification_WACV_2024_paper.pdf).

PetFace's published dataset, code and models are restricted to noncommercial research. Treat it as research evidence, not the default production dependency. Select actual model weights only after reviewing their terms and evaluating them on appropriate PawTrail photos. [Official repository](https://github.com/mapooon/PetFace).

## Contributor experience

1. Choose **Spot an animal**. Start the rear camera after permission; offer an explicitly labeled gallery alternative and a graceful desktop/no-camera path.
2. Take a photo. Preview it immediately, allow retaking, and optionally request an additional angle when appearance is ambiguous. Capture location alongside the photo rather than assuming EXIF exists.
3. Upload privately and show a local progress panel: uploading, checking photo, finding possible matches. Analysis runs asynchronously; navigation and the rest of the page remain usable.
4. If there are multiple animals, select one detected animal. If the photo is too dark, blurred, too distant, or unrelated, explain the issue and offer retake. Uncertain detection is not a conclusive accusation of abuse.
5. Present up to five useful candidates with approved photos, name, coarse last-reported area/time, similarities, and meaningful differences. Always include **None of these** and **I'm not sure**. Never preselect the first database animal.
6. Strong matches can be accepted automatically when the contributor submits the observation. Allow correction before submission. A named animal supplied by a route or selected by the reporter remains a proposal, not proof.
7. Ambiguous matches remain pending identification; authorized people can confirm them. An unmatched photo can start a provisional profile with a temporary name and description. Lack of a match does not prove this is a previously unregistered animal.
8. Show the outcome clearly: **Automatically matched**, **Confirmed by a reviewer**, **Possible match**, **Animal not identified**, or **Photo needs another look**. Animal presence, identity status and publication/reward status remain distinct in the details.

Use actual shared shadcn/ui components and Tailwind. Preserve the platform/management layouts. Camera permission is requested on interaction. Stop camera tracks on dismissal/unmount. Support keyboard controls, reduced motion, announced progress and recoverable failed uploads. Secure-context deployment is necessary for browser camera capture. The HTML `capture` attribute is a device preference, not proof of a fresh photograph. [Media Capture specification](https://www.w3.org/TR/mediacapture-streams/) and [HTML Media Capture](https://www.w3.org/TR/html-media-capture/).

## Backend processing

The server owns all authoritative results. Client hints never bypass these stages.

1. **Intake:** authenticate, enforce media ownership, idempotency and resource limits; actually decode images, normalize orientation, and preserve the original privately. Unsupported formats such as undecodable HEIC receive an actionable conversion/retake message. Generate public JPEG/WebP derivatives separately, with location metadata removed.
2. **Replay evidence:** compute exact and perceptual hashes, group burst/near-duplicate images, and compare against existing submissions. A duplicate may support the same record but does not count as a new independent encounter or a new reward. Near-duplicate similarity alone flags review; it is not an automatic fraud verdict.
3. **Animal presence and quality:** detect cats/dogs, identify bounding boxes, evaluate visibility and photo usability. An unsupported species or no usable animal does not enter the ordinary verified cat/dog sighting path. Potentially valid uncertain photos remain reviewable.
4. **Visual features:** crop/mask the selected animal; extract color distributions and coat-pattern clues, then face/body embeddings where usable. Record missing views and uncertain traits. Eye color, collars and apparent body size can change or be unreliable; breed/sex/medical condition must not be asserted as verified from a photo.
5. **Candidate retrieval:** union nearby geographic candidates with broader visual candidates. Compare against a curated multi-view reference gallery for each animal, not only its profile thumbnail. Deduplicate candidates by animal. Do not hard-exclude an animal because it moved or lacks a recent location.
6. **Decision:** combine visual evidence, distinguishing markings, competing candidates, unknown-animal likelihood, reference quality and location/time plausibility. Keep identity confidence separate from sighting-evidence trust. Missing inputs remain missing, never zero-valued facts.
7. **Optional cloud comparison:** for a bounded number of ambiguous candidates, compare supplied photos and return structured similarities/differences/insufficient-evidence. This result can assist the decision or reviewer; a generative model's stated confidence cannot independently authorize confirmation.

Use a Django/DRF platform API with PostgreSQL/PostGIS, private object storage, and a separate bounded worker queue. Pillow/OpenCV are candidates for decoding and simple features; the detector and individual-identity embedding providers remain replaceable interfaces until their weights pass the license/evaluation gate. A Celery worker with Redis is the proposed job transport. Do not load a large model into every Next.js or web-server request.

Use PostGIS geography for meter-based proximity and pgvector for reference-embedding search. Start with exact vector search for the pilot; introduce approximate indexes only when scale warrants the recall tradeoff. These are retrieval tools, not identity-verification algorithms. [PostGIS ST_DWithin](https://postgis.net/docs/ST_DWithin.html), [pgvector documentation](https://github.com/pgvector/pgvector).

## Automatic decision policy

Automatic matching is an intended product capability, not replaced by permanent manual review. It is enabled only for model/species/condition cohorts whose measured performance meets an agreed policy.

An automatic acceptance requires all of the following:

- A usable in-scope animal crop and an eligible, versioned reference gallery.
- Strong individual visual agreement, not merely the same coat color or nearby coordinates.
- A clear separation from the next-best identity, including plausible similar animals.
- The calibrated unknown-animal rejection rule passes; the system is not forced to choose a known animal.
- No unresolved material trait conflict, replay concern, or contradictory time/place evidence.
- A versioned calibration policy covering this kind of input; unsupported conditions abstain.

Location can support a match but cannot compensate for weak appearance. Good visual evidence far outside recent reports should prompt relocation review instead of an automatic rejection. Reporter popularity, crowns and earned Kibble must not override visual contradictions.

Proposed pilot release target: the one-sided 95% confidence bound on the wrong-identity proportion among auto-confirmed sightings is no greater than 0.5%, assessed separately for enabled cohorts. This is a proposed product target, not a claim of current accuracy. Record coverage and missed-match rates too; accepting nothing is not useful success. Calibrate score and top-two margin thresholds from labeled data, not invented percentages such as “98% Smokey.” Run evaluation only after the owner requests it. Until then the automatic policy is not approved for real sightings.

Keep **identity** (`unassigned`, `suggested`, `confirmed`, `disputed`) and **evidence** (`pending`, `plausible`, `needs_review`, `rejected`) independent. Confirmed identity records identify their method: automatic or reviewer. Publishing a verified sighting requires confirmed identity plus accepted evidence/publication rules; identifying an animal in an old imported photo does not prove a new encounter.

## Coordinates and the Smokey example

Store privately: device latitude/longitude, reported accuracy radius, location-fix timestamp, client capture timestamp, server receipt timestamp, capture method, optional EXIF time/location, and any explicitly manual pin. Preserve conflicts and unavailable values. Gallery location is not silently replaced with the uploader's present position.

Browser geolocation provides position, accuracy and timestamp, but does not guarantee the actual device location. EXIF and browser assertions are supporting evidence, not proof against spoofing or a photograph of a screen. Do not claim that all unrelated or manipulated photos can be detected. [W3C Geolocation](https://www.w3.org/TR/geolocation/).

Compare with trusted observations using elapsed time, uncertainty of both locations, and known relocation/care events. Nearby-first retrieval may expand with older evidence; movement assumptions are configurable ranking heuristics, not guaranteed travel limits. Keep wider visual retrieval available. A weak GPS fix makes proximity less informative, not more certain.

For Smokey: a compatible recent nearby photo with matching distinctive markings and no close competing candidate can auto-match after calibration. A second gray cat around the same corner must not auto-match merely because of proximity. A strong Smokey-like photo far away needs a move/identity check. A recycled Smokey photo is not a fresh sighting.

Public maps show **reported areas** derived from accepted historical observations, labeled with time and uncertainty. Example: “Smokey was reported near Riverside yesterday; approximate area.” Do not imply a guaranteed current position or home range. Keep exact positions and original metadata private; candidate explanations must not expose hidden coordinates through exact distances. Preserve the existing public-location schema's minimum 500 m radius; this display floor is separate from internal matching distances.

## Records, corrections and incentives

- `Capture`: contributor, private source media, capture/location assertions, server timestamps and idempotency.
- `AnimalObservation`: one selected animal/crop from a capture; may have no animal identity yet. Keep immutable evidence when identity changes.
- `AnalysisRun`: stage outcomes, feature/model versions, private hashes/embeddings, error/retry state.
- `IdentityCandidate`: observation, animal ID, reference-gallery version, internal scores and public-safe explanations.
- `IdentityDecision`: proposed/confirmed/disputed assignment, method, policy version, reasons, deciding actor/service, version history.
- `AnimalReference`: independently curated reference photos/traits with provenance, viewpoint, approval and withdrawal history.
- `Sighting`: the authorized projection linking an observation to a confirmed animal, with publication/review state. Provisional observations do not overwrite the canonical location.

Do not automatically merge animal profiles or promote an automatic match into training/reference truth. Reference enrollment needs independent curation; this prevents a wrong guess from reinforcing itself. Reviewers may approve a provisional identity, reject it, reassign a sighting or propose a merge. Merges require a separate authorized, audited operation.

Reward only eligible accepted encounters under the platform's server-side policy. Use one immutable ledger event per eligible observation, transactionally idempotent; reverse/reconcile rewards on invalidation without deleting audit history. Existing achievement/rank projections must follow the authoritative ledger. Game-local Kibble remains separate.

## Operational behavior

Persist uploads and observations before asynchronous analysis, expose resumable job status, and bound retries. Recover from worker failure without a second reward or duplicate animal. Changing the selected crop or evidence creates a new analysis version and invalidates obsolete results. Submission rechecks ownership, versions, candidate validity and current policy atomically. Concurrent contributors must not silently create duplicate confirmed identities.

Cache processing by content/crop/model version; reuse results without leaking whether another person's private upload exists. Poll only while the capture screen needs results, with cancellation/backoff. Provider timeout or exhausted budget leaves the observation pending review, not fabricated success. Track latency, queue age, reviewer backlog, cloud usage, match coverage and corrections. No real uploads go to an external provider until processing terms/configuration and the intended user notice are established.

## Delivery sequence and evaluation

1. Establish the real platform identity/media/sighting API and privacy boundary; leave the game service untouched.
2. Ship camera-first capture with persistent private evidence and asynchronous status; no fake recognition.
3. Add species/quality/replay checks and build the curated reference gallery.
4. Add geographic/visual candidate suggestions, provisional profiles and review/correction tools.
5. After authorized evaluation, enable calibrated automatic confirmation for qualifying cohorts; expand coverage gradually.
6. Add selective cloud comparison only if it demonstrably resolves ambiguity within latency/cost limits.

The labeled evaluation set needs same-looking neighboring animals, unknown individuals, repeated photos, night/blur/angle changes, black/white/tabby coats, missing GPS, relocation and multiple animals. Separate evaluation by individual and capture session; keep enrollment photos separate from query photos and keep unknown individuals out of the reference gallery. Report species precision/recall, top-five retrieval recall, accepted-match precision with uncertainty, unknown false accepts, coverage, review rate, latency and cost. The first pilot should focus on cats in one community, then expand only with species/condition-specific evidence; dog support uses the same contracts.

This request is planning only. No product source, dependencies, migrations, models, tests, builds or browser checks are changed or executed.
