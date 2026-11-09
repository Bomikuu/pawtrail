# Camera and identity delivery — 7 November 2026

Owner instructions: native implementation, no agents, no automated tests/checks/builds/browser verification. Those instructions were preserved. Source was reviewed directly. Dependency/model installation, migration generation/application and runtime startup were performed; they are not recognition evaluations.

| Phase | Implemented | Remaining activation/integration |
| --- | --- | --- |
| Real platform slice | Django accounts, JWT, private media, capture evidence, observations, animal records and migrations | Other social domains remain at their existing integration boundary |
| Camera-first UI | Rear camera, gallery fallback, retake, location accuracy/time, local progress/skeletons, saved encounter recovery | User-driven phone/browser use has not been verified |
| Local analysis | Pinned installed DETR/DINOv2 ONNX weights, cat/dog boxes, selected crop, basic quality/color features, hashes and persistent jobs | Species/quality thresholds and retrieval baseline are not measured PawTrail accuracy |
| Identity and review | Visual candidates, geographic support/wider retrieval, unknown identity, provisional records, independent review/reassignment/disputes, reference enrollment/withdrawal and public historical area maps | Genuine real reference photos must be contributed and independently enrolled |
| Automatic acceptance | Policy/margin/reference/evidence gates, gallery locking, version/idempotency protection, duplicate encounter exclusion and contributor override | Activation is prepared at `/spot/setup`; no policy is seeded. Real sighting Kibble is connected through the canonical ledger and `/spot/kibble`. Future real photos/calibration are required before enabling automatic identity acceptance |
| Cloud assistance | Explicit opt-in, configured HTTPS provider, two-candidate/response/time limits, advisory output, persistent comparison limit | No provider credentials/configuration or real cloud inference was used |

The social worktree is `/home/micxsz/projects/pawtrail/.worktrees/implementation`. The game's housing backend was not changed. Camera entry points formerly at `/animals/report` and `/sightings/create` redirect into `/spot`; existing animal editing workflows remain available through their existing management route.

The live capture API intentionally uses its own typed client/schemas rather than adding simulated capture methods to `PawTrailApi`. It shares the official controls, existing same-origin CSRF guard and sealed-token implementation. This permits incremental backend delivery without changing the sample application's identity store or treating sample animal IDs as real records.

Reference extraction uses the selected animal crop and generic visual features. It is not a trained individual-cat facial biometric model. Device coordinates, timestamps and capture method are assertions, not attestation of a physical scene. These limits are visible in the interface and [service documentation](../../backend/README.md).

The installed database has no generated real animals, sample reference photos, invented calibration report, seeded enabled policy or automatic reviewer account. Register a contributor through `/spot`; create an administrative reviewer interactively using the backend instructions. No secrets, local databases or uploaded media are committed.

The follow-up [automatic setup and real rewards delivery](automatic-identification-rewards.md) adds the calibration preparation/import/activation workflow and transactional real sighting awards/reversals. The owner selected preparation for future captured photos; no calibration run or fabricated metrics were used.
