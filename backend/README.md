# PawTrail real animal encounters

A Django/DRF service for real camera captures, animal identity and independently reviewed sightings. It is separate from the Phaser game's housing service and the community's sample data. It does not claim to implement every social backend domain.

## Local setup

From this directory:

```bash
uv sync
uv run manage.py migrate --skip-checks
uv run manage.py install_models
uv run manage.py runserver 127.0.0.1:8002 --noreload --skip-checks
```

In a second terminal:

```bash
uv run manage.py analysis_worker
```

The commands above install dependencies, create database tables and model files, and serve user requests. They do not run tests or recognition benchmarks. `--skip-checks` preserves the owner's current instruction. No automated verification was performed during this implementation.

Open the existing frontend at `/spot`. Local Next.js development defaults to `http://127.0.0.1:8002/api/v1` for capture requests; `PAWTRAIL_CAPTURE_API_BASE_URL` overrides it. Do not change `NEXT_PUBLIC_USE_MOCK_API` just to try capture: other social domains retain their original integration boundary.

Create a real account in the capture screen. Demo passwords, sample members, sample pets and game accounts are not copied into this database. The capture account uses a sealed HttpOnly cookie separate from the sample session. In full platform real mode the gateway reuses the existing real session cookie instead.

Private local state lives under `.data/`: SQLite database, generated Django secret, originals, stripped JPEG previews and ONNX models. `.data/` and `.venv/` are ignored by Git. Back them up appropriately for persistent use; do not expose this directory as static files. Model files occupy roughly tens of megabytes each and are not committed.

## Reviewers and references

Create a separate administrative account interactively:

```bash
uv run manage.py createsuperuser --skip-checks
```

Use that account at `/spot` and `/spot/review`. Staff users and members of the `identity_reviewers` Django group can review identities; ordinary registration cannot grant those roles. The Django admin is at `http://127.0.0.1:8002/admin/`.

Contributors must submit an encounter before it enters review. A reviewer cannot approve their own report. Confirm identity separately from accepting the time/place evidence. A new provisional animal can be confirmed; an existing identity can be reassigned, disputed or rejected with an audit reason. Accepted encounters become public historical sightings.

After independent confirmation and accepted evidence, expand **Enroll this independently checked photo as a reference** in the reviewer interface. Specify viewpoint and provenance. References derived solely from automatic confirmation, or from the reviewer's own report, are not eligible. Reference withdrawal is available through `DELETE /animals/:animalId/references/:referenceId` on the capture gateway. Withdrawn references cannot be silently reactivated. Seed no reference gallery with stock/sample/game images.

## Recognition behavior

1. Decode JPEG/PNG/WebP, normalize orientation and enforce byte/pixel limits.
2. Run pinned DETR ONNX weights locally to find cats/dogs. Multiple animals require selecting one.
3. Assess crop visibility/detail, compute photo hashes, coat-color histogram and DINOv2 visual embedding.
4. Compare only independently curated real references. Global visual retrieval remains available when geographic history is missing or the animal moved.
5. Return possible identities and coarse context. Neither cosine similarity nor detector confidence is an individual-identity probability.
6. Submit a proposed existing identity, provisional new profile, or unidentified observation for review. Strong matches can follow an enabled calibrated policy without manual confirmation.

This is a generic visual-retrieval baseline, not a trained cat face biometric model. Distinctive markings can influence embeddings and human comparisons; named anatomical traits are not automatically asserted as verified. Printed/screen/AI-generated photos cannot be reliably excluded by animal detection alone.

The installer pins [DETR](https://huggingface.co/Xenova/detr-resnet-50) and [DINOv2 Small](https://huggingface.co/Xenova/dinov2-small) revisions and records downloaded checksums. It downloads data/model files only; it does not execute remote Python code. Upstream [DETR](https://github.com/facebookresearch/detr) and [DINOv2](https://github.com/facebookresearch/dinov2) publish Apache-2.0 licenses. Preserve upstream notices. PetFace research-only weights are not installed.

## Automatic matching policy

No enabled policy is seeded. This is intentional: no labeled PawTrail calibration or benchmark has been authorized/performed.

The automatic decision engine requires a documented, staff-approved model-specific policy, a similarity threshold and competitor margin, at least three independent reference photos across two viewpoints, usable local visual evidence, compatible recent geography, and no unresolved replay/time/place flags. It also respects an explicit contributor rejection of the suggestions. A missing policy yields review, not a fake success.

The reviewer-only `/spot/setup` screen now prepares the activation workflow: reference readiness, cohort manifest download, immutable calibration-report import, and explicit enable/disable controls. Generate future reports using `uv run manage.py prepare_calibration .data/calibration/manifest.json --output .data/calibration/report.json` after collecting independently reviewed real query photos in separate tuning/validation sessions. This operational command never runs automatically. Import creates a disabled policy; only a passing, current report can be activated. Changing calibrated references, installed models or decision rules makes it ineligible. Django admin shows policies and reports read-only. See [the complete workflow](../docs/implementation/automatic-identification-rewards.md).

Passing the cat/dog detector never awards Kibble. The real platform now has a canonical non-cash ledger in `rewards/`, served by `GET /kibble/wallet` and `/kibble/ledger` and shown at `/spot/kibble`. An accepted sighting earns 10 Kibble once per animal per contributor per Manila capture day, up to 100 sighting Kibble daily. Capture time must be known and submission received within 24 hours of that reported time. Pending, rejected, disputed and duplicated encounters do not add credit. Publication/review and reward changes are transactional; invalidated credits create reversal entries rather than deleting history. Reassignment reverses old attribution and can credit the corrected legitimate encounter. Retries cannot duplicate awards. The wallet never consumes game-local or demo balances, and clients cannot choose an award amount. Other social reward types remain future real-backend integrations.

## Privacy and evidence

The source image and extracted metadata remain private. Even authorized preview responses use stripped normalized JPEGs, not the raw original. Public photographs are separate stripped derivatives with no public source-file URL. Public maps use generalized historical report areas, not original coordinates or guaranteed current positions. Device GPS accuracy, freshness and EXIF conflicts support evidence review but cannot prove physical presence.

Exact normalized-pixel reuse cannot produce a second active sighting for the same animal. Similar-image hashes flag review; they do not establish fraud. Submission/review transactions are versioned and idempotent. Reference updates and acceptance share a gallery lock. Corrections deactivate affected references/sightings and remove public media eligibility when no accepted use remains.

## PostgreSQL production

Set `PAWTRAIL_PRODUCTION=1`, a private `PAWTRAIL_PLATFORM_SECRET`, an allowlisted host list, `DATABASE_URL`, `REDIS_URL`, and `PAWTRAIL_ANALYSIS_QUEUE=celery`. Supply Next.js a private session secret and HTTPS origin. Install native GDAL/GEOS dependencies for the GeoDjango backend. The database must provide the PostGIS and pgvector extensions; migrations create them if the database role is permitted.

The native migration adds generated private geography, a GiST spatial index, and reference vectors. PostGIS handles meter-based proximity and pgvector performs exact retrieval. Local SQLite uses the same evidence/decision contracts with in-process exact vector and distance calculations. This is a local fallback, not a claim of PostgreSQL conformance testing.

```bash
uv run manage.py migrate --skip-checks
uv run gunicorn config.wsgi:application --bind 127.0.0.1:8002 --workers 2
uv run celery -A config.celery:app worker --loglevel=info --concurrency=1
uv run celery -A config.celery:app beat --loglevel=info
```

Use shared private file storage for multiple web/worker instances, a durable Redis deployment, and a reverse proxy with upload/time limits and HTTPS. All media is authorized through the API. Do not run the development server as a production deployment. Redis-backed throttling and the queue recovery task are configured when Redis is supplied. Rotate credentials and maintain database/media backups outside source control.

## Optional external comparison

Local analysis does not need a cloud key. To enable supplemental comparisons, configure `PAWTRAIL_EXTERNAL_VISION_ENABLED=true`, a trusted HTTPS chat-completions-compatible `PAWTRAIL_VISION_ENDPOINT`, `PAWTRAIL_VISION_KEY`, and `PAWTRAIL_VISION_MODEL`. Review the provider's processing terms before enabling real uploads.

The contributor must opt in per capture. Only ambiguous candidate comparisons are eligible, with at most two candidates, a bounded response, a 12-second timeout and one recorded comparison per observation. Crops/public derivatives are re-encoded without metadata; coordinates are not sent. Results are advisory text and never bypass the automatic decision policy. No external comparison was configured or executed during implementation.
