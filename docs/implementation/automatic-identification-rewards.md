# Automatic identification setup and real Kibble

7 November 2026. The owner requested native implementation, no agents and no automated tests. The owner then selected **Prepare setup for future captured photos** after source-data inspection found no real animals, observations, references or calibration policies. No real identity/photo/report was invented or seeded.

## Delivered

- `/spot/setup`: reviewer-only readiness, reference coverage, cohort-manifest download, calibration-report import, explicit activation/deactivation and clear blockers.
- A structured immutable calibration artifact links species, installed model revision, decision-rule version, known animal cohort, reference fingerprint and evaluated operating thresholds. Adding/changing the calibrated references or changing models/rules stops that policy from accepting new observations.
- `prepare_calibration`: an operator-invoked product command for future independently reviewed observations. It chooses thresholds on tuning data, then measures a separate validation split. It never runs on startup, migration or capture submission.
- `/spot/kibble`: authenticated real wallet and paginated append-only contribution history. The capture toolbar, saved encounter cards, receipt and reviewer detail show actual reward outcomes.
- Real `GET /kibble/wallet` and `/kibble/ledger` use the platform's own accounts/database, not the demo store or game balances.
- Publication and reward changes share a database transaction. Corrections revoke old credit, reassign attribution through reversal/recredit entries, and deterministically reconsider previously limited genuine encounters. Retries retain idempotent source/revision protection.

## Reward policy `verified-sighting-v1`

An accepted real sighting earns **10 non-cash Kibble**, once per animal per contributor per **Asia/Manila capture day**, with a maximum of **100 sighting Kibble** per contributor per day. The backend alone selects eligibility and amount. Identity must be confirmed, encounter evidence accepted, and an active published sighting must exist. Capture time must be known and the original server receipt must be within 24 hours of that reported time (with at most five minutes of clock lead).

Exact reused photos cannot become another active sighting of the same animal. Pending, rejected, disputed, too-old and time-unknown observations do not earn points. Distinct accepted encounters that exceed the same-animal/day or overall daily cap still remain valid sightings. They receive an explanatory reward status rather than invented credit.

Only immutable ledger amounts constitute the authoritative balance. The locked Wallet row serializes writes; GET balance is derived from history. One mutable grant projection per observation tracks current eligibility; every change to credited value has a unique append-only ledger revision. Invalidated credit is reversed, never deleted. Reconfirming a legitimate corrected encounter can restore credit without increasing its net entitlement beyond one award. There is no spending/cash-out endpoint or client-supplied credit amount.

The real ledger currently implements sighting rewards. Other real social contribution types can use this authority when their backend domains are implemented; existing sample achievements/mission wallets remain explicitly sample data.

## Future reference and calibration workflow

1. Register real contributors at `/spot`. Establish an independent real reviewer with the backend's interactive `createsuperuser` command or the `identity_reviewers` group; ordinary registration cannot grant review rights.
2. Submit genuine camera encounters. A second person confirms the animal identity and accepts encounter evidence at `/spot/review`.
3. Enroll independently checked reference photos, with three photos across at least two viewpoints for each intended automatic identity. Automatically matched photos cannot silently become references.
4. Collect separate independently reviewed query observations, including known animals and genuinely unknown animals outside the reference gallery. Include similar coats, competing neighboring animals and relevant camera conditions.
5. Download a cohort manifest at `/spot/setup`. Populate its `observations` array with real IDs and `split` values `tuning` or `validation`. Empty manifests and invented IDs cannot prepare a report.
6. When the owner authorizes operational calibration, run from `backend/`:

```bash
uv run manage.py prepare_calibration .data/calibration/manifest.json --output .data/calibration/report.json
```

7. Import that JSON at `/spot/setup`, supply provenance/covered conditions, and acknowledge genuine independently labeled data. Passing import creates a **disabled** policy. Enable it explicitly only after reviewing its results.

The dataset command uses completed local feature analyses and independent review labels. It rejects query/reference observation overlap, exact duplicate pixel content, and repeated queries for the same animal within a 30-minute session. Reference, tuning and validation sessions must be separate. Unknown ground-truth individuals must have no active references. Thresholds are selected using tuning data only; validation data cannot tune them.

The pilot gate uses an exact one-sided 95% binomial upper bound of at most 0.5% wrong identities among accepted matches, zero unknown false accepts, at least 20 unknown queries across two unknown individuals, and at least 10% automatic coverage. With no errors, roughly 600 independently sampled accepted validation encounters are needed for that error bound. This is a proposed operating gate, not measured PawTrail performance. Generalization still depends on representative, correctly labeled independent data. [NIST exact binomial confidence limits](https://itl.nist.gov/div898/software/dataplot/refman2/auxillar/exacbino.htm).

Imported counts/provenance are operator assertions; structural validation does not independently prove that an external report was genuinely produced. Reviewers must check provenance. The supplied local command provides the reproducible report path from real stored observations. The UI never displays an imported similarity threshold as a probability of identity.

Automatic acceptance additionally checks strong individual visual agreement, the closest competing identity, reference count/views, fresh location/time evidence, absence of replay/quality flags, the contributor's acceptance of the suggestion and current gallery/model/rule compatibility. Only identities in the calibrated cohort are eligible. Outside-cohort animals can still compete in retrieval, but cannot be automatically accepted under that report. Uncertain/unsupported observations continue through independent review.

## Delivery evidence and limits

Database migrations were generated and applied with system checks skipped. The backend and analysis worker were restarted for the new models/routes. No tests, type checks, builds, browser verification, calibration runs, synthetic reward events or external vision calls were run. No accuracy claim or fabricated policy was produced. Activation awaits the future real photos and calibration data, as selected by the owner.
