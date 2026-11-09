# Achievements end-to-end verification — 8 November 2026

The claims, proof-review, reversal and restoration journeys passed against the real local Django API, Next.js BFF and Firefox UI. Two runtime failures were reproduced and fixed: the evidence dialog could place controls outside the viewport, and deleting an unattached upload raised `NameError` because the retention guard did not import `FundReceipt`.

## Environment and data boundary

The owner authorized generated data after the development database was found to contain no genuine member/moderator records suitable for testing. Generated records were persisted in a separate SQLite database at `/tmp/pawtrail-achievements-e2e-20261108/data/platform.sqlite3`, with a separate upload directory and normal migrations. A temporary copy of the current frontend ran on port 3001 against the current backend source on port 8003. The existing development preview stayed on ports 3000/8002.

Three accounts were registered through the real HTTP registration endpoint: a member, an independent moderator and an unrelated member. Staff permission was configured only in the isolated database. Posts were created and private PDFs uploaded through the API; the principal member proof was uploaded and submitted through Firefox. Generated accounts carry internal seed provenance, and the PDF explicitly identifies itself as a local automated test document. There was no mock API, forced authentication, fabricated identity reference, collected payment or production reward. Synthetic actors used normal application eligibility in this isolated environment; separate fixture-marked records exercised exclusion rules.

Firefox sessions were isolated by actor. Browser checks covered 1440 × 900 desktop and 390 × 844 mobile. Development hot-reload WebSockets were disabled in the two test contexts after route compilation repeatedly refreshed the temporary webpack preview. Application requests, authentication, uploads and mutation responses remained live.

The final read-only development-database inventory found zero generated test accounts, zero achievement claims/proofs/activities, and zero achievement ledger entries. Test records were not inserted into the main development database. The isolated servers and test browsers were stopped after verification; generated login credentials and the temporary runtime environment file were removed.

## Verified journeys

| Scenario | Observed result |
| --- | --- |
| Authenticated overview | All 45 configured badges load; a new member starts with zero unlocked badges. |
| Ineligible claims | Claims without qualifying evidence return 409 and award nothing. |
| Evidence validation | Empty attachments, borrowed attachments, future/naive dates, another author's post and missing references are rejected. |
| Private media | Owner and moderator can read the private PDF; anonymous and unrelated users receive 404. |
| Proof privacy | An unrelated member's proof list contains no other member's submissions. |
| Review permissions | Members cannot access the review queue or review endpoint; a moderator cannot approve their own proof. |
| Optimistic versions | Stale review versions return 409. |
| Browser submission | Member uploads, describes and submits the private document from the mobile form. The persisted proof starts pending. |
| Independent approval | Moderator approves through the review UI. Progress becomes ready, while the wallet remains zero. |
| Claim | Member unlocks the badge through the UI. Exactly one +40 entry is appended. |
| Duplicate claims | Eight concurrent retries with different keys produce no extra reward; submitted reward amounts cannot increase the configured award. |
| Showcase | An opted-in active badge appears publicly; private proof identifiers, attachment identifiers and proof details do not. |
| Approval reversal | Moderator confirms reversal in the UI. A -40 correction is appended, the claim is revoked and the public badge disappears. |
| Reversal retries | Stale/repeated decisions return 409 without another deduction. |
| Revision and restoration | Member revises the same proof in the mobile UI and retains its private attachment. Reapproval grants no automatic reward; an explicit reclaim appends +40. |
| Mutation idempotency | Identical approval/revision retry keys return the same version. Reusing an approval key with different input returns 409. |
| Source correction | Editing the reviewed post through the API places its proof back in pending review, clears the reviewer binding, revokes the claim and appends -40. Independent reapproval and reclaim restore +40. |
| Concurrent reversal | Of eight simultaneous requests, one succeeds and seven return 409. Only one correction is appended. |
| Concurrent reclaim | Eight simultaneous reclaims all resolve successfully with one award and one claim row. |
| Fixture exclusion | A fixture-marked post cannot become a proof reference; a fixture-marked account cannot access real achievements. |
| Evidence retention | Attached proof evidence returns 409 on deletion. An unattached upload deletes successfully after the import fix. |
| Ledger integrity | Model/queryset update/delete guards reject changes; database constraints reject a missing source and duplicate claim/revision. |
| Daily activity | Same-key and different-key repeated check-ins leave one server-dated daily record. |
| Responsive behavior | Evidence controls can be reached by normal scrolling on desktop/mobile. Final mobile achievements state has no horizontal overflow. |

Across successive claim/reversal/restoration scenarios, the final ledger amounts were:

`+40, -40, +40, -40, +40, -40, +40`

The final persisted wallet, API wallet, ledger sum and active claim credit were each **40**. The claim remained a single row. Historical corrections were retained.

## Fixes and checks

- `src/features/achievements/proof-form.tsx`: bound the dialog to the dynamic viewport height and allow vertical scrolling. Existing shadcn primitives remain unchanged.
- `backend/observations/views.py`: import `FundReceipt` in the media retention guard. Retested both attached and unattached evidence deletion.
- Narrow compile-contract corrections: MapLibre namespace import and map-instance narrowing, explicit pagination result type, nullable configured profile area, and the missing `publicAttendance` default in existing auth/projection objects. No demo workflow was executed.

Passed after the fixes:

- `npm run typecheck`
- `npm run check:ui`
- `backend/.venv/bin/python backend/manage.py check --database default`

The API/database assertion journal contains 137 passing assertions. Two initial harness expectations assumed 401/403 for private attachments; the actual privacy contract intentionally returns 404 to conceal their existence. Corrected probes passed, and the original expectation corrections remain in the journal. A separate earlier anonymous probe rejected all 16 requests: 15 returned 401, and the malformed BFF proof request returned validation error 400 before authentication.

Sanitized evidence is in `output/playwright/achievements-e2e-2026-11-08/`: `summary.json`, `api-database-assertions.json`, database snapshots, desktop/mobile proof screenshots and final-state screenshots. Account credentials, tokens and runtime secrets are excluded.

## Limits

These are generated-data integration tests of the actual local application. They do not verify real-world contributions. All 45 badges loaded, but each badge's individual qualification rule was not exhaustively exercised. Concurrency checks used SQLite; PostgreSQL/PostGIS row-lock behavior and production load were not tested. No production build, deployment or external service action was performed.

Subsequent verification covered PostgreSQL/PostGIS concurrency, reproduced two additional locking failures and passed after fixes. See [the PostgreSQL concurrency report](achievements-postgres-concurrency-2026-11-08.md); the limits above describe this earlier SQLite/browser run.
