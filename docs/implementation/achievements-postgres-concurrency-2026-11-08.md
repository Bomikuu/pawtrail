# PostgreSQL achievement and Kibble concurrency — 8 November 2026

The PostgreSQL run reproduced and fixed two failures that SQLite did not expose. The corrected suite passed with 12 and 24 simultaneous requests, including real lock waits, achievement claims, independent approval withdrawals, mission corrections and the capture reward collector.

## Failures and fixes

### Mission review failed before it could approve or reverse rewards

The review queryset used `select_for_update()` with related volunteer, shelter and animal rows. PostgreSQL rejected the nullable shelter/animal outer joins with `FOR UPDATE cannot be applied to the nullable side of an outer join`; the real review endpoint returned HTTP 500.

`backend/social/missions.py` now uses `select_for_update(of=('self',))`. The participation remains locked for version checks and reward reconciliation. Joined optional records and the volunteer account are read without taking additional row locks. Mission reward terms already cannot be edited through the mission API.

Retest: create a generated mission with no shelter/animal, accept it, upload private JPEG evidence and submit it through the real API. Independent review awards 25 Kibble. Claiming First Help awards another 30. Mission reversal racing achievement claim retries appends exactly -25 and -30, revokes the dependent badge and leaves the wallet at zero.

### Encounter reconciliation could deadlock with achievement claims

`sync_encounter_rewards()` selected the wallet with `select_related('owner')` and an unrestricted `FOR UPDATE`. This also locked the account row. Member mutations take the account lock before their wallet; an encounter correction could take the wallet and then wait for the member account, producing the reverse order.

The failure was reproduced with independent transactions: hold the wallet, queue encounter reconciliation first, start an authenticated achievement claim that locks its account and queues for the wallet, then release the wallet. PostgreSQL detected a deadlock and aborted native reconciliation. No ledger corruption was observed.

`backend/rewards/service.py` now locks only the wallet with `select_for_update(of=('self',))`. Related owner data can still be read without acquiring the extra account lock.

Retest: execute the actual `achievement_changes()` / `defer_encounter_rewards()` collector path concurrently with an authenticated claim, in both observed wallet-wait orders. Native reconciliation completes, the ineligible claim returns normal 409, and balances/history remain consistent. This lock regression needs no invented animal identity or identification reference.

## Isolated environment

- PostgreSQL **14.18**, PostGIS **3.5.2**, pgvector **0.8.6**; real `django.contrib.gis.db.backends.postgis` adapter.
- Django 5.2.19, psycopg 3.3.8, Gunicorn 23.0.0 with four workers and eight threads per worker.
- Dedicated Docker container, loopback-only ports, separate generated database `pawtrail_concurrency`, tmpfs PostgreSQL storage and separate private uploads/settings.
- Normal migrations, real registration/JWT authentication and HTTP API requests. Staff permissions and stable internal test provenance were configured only in the isolated database.
- Generated posts, private PDFs, a private JPEG and a generated mission. No production data, identity reference, payment, real-world verification or browser fixture was used.
- Test-only throttle rates were raised to avoid confusing rate-limit behavior with database locking. Database lock timeout was five seconds and statement timeout fifteen seconds. The mutation and reward code ran unchanged except for the two fixes above.

## Verified races and invariants

| Scenario | Result |
| --- | --- |
| Simultaneous first claims with different keys | Every request resolves successfully; one claim and one award. |
| Concurrent retries with the same idempotency key | Every retry resolves successfully; no extra ledger entry. |
| Two independent moderators reversing the same proof | One succeeds; all other decisions return stale/conflict 409; one deduction. |
| Simultaneous reclaims after revision/reapproval | One restoration entry; the original claim row is reused. |
| Claims racing proof withdrawal | Requests succeed before withdrawal or return ineligible 409 afterward; final credit is zero. |
| Forced claim-first wallet wait order | Award and reversal both commit; final credit is zero. |
| Forced withdrawal-first wallet wait order | Withdrawal commits; claim returns 409; no award is created. |
| Different proofs reversed by different moderators for the same wallet | Both corrections commit without a lost update. |
| Mission reversal racing dependent achievement claims | Both source and dependent achievement credits reverse exactly once. |
| Encounter collector racing a claim in both forced wallet orders | Both transactions complete without deadlock or server error. |

At each checkpoint, SQL and API checks compare the wallet cache, immutable ledger sum, running `balance_after` values, claim/source credited totals, claim uniqueness, consecutive reward revisions and exactly-one-source attribution. Unapproved mission participation has zero credit. Forced races observe waiting transactions in `pg_stat_activity` before releasing the gate, rather than relying on a timing sleep to manufacture overlap.

The corrected 12-request run passed 225 assertions/race summaries. The final 24-request run passed 246, including **148 parallel HTTP requests**. Its longest recorded parallel request was about 2.46 seconds in this local environment. These timings are test observations, not a production performance guarantee. PostgreSQL recorded **zero errors during the final run**, with zero lock waiters remaining afterward. The pre-fix deadlock is retained in the failure evidence.

## Repeatable regression script

`backend/scripts/check_achievement_concurrency.py` uses real HTTP authentication and psycopg connections. It refuses non-loopback addresses or a database other than `pawtrail_concurrency` with `current_setting('pawtrail.isolated_test') = 'on'`.

Provision and migrate a separate PostgreSQL/PostGIS/pgvector database, set that custom database marker, and start the backend with private test data/settings. Supply the controller connection through `PAWTRAIL_CONCURRENCY_DATABASE_URL`. The `--native-runner` JSON argument is an argv prefix that executes `manage.py shell -c` against the same isolated backend. It is invoked without a shell and rechecks the database marker before reconciliation.

Example shape, with paths/ports supplied by the isolated environment:

```sh
backend/.venv/bin/python backend/scripts/check_achievement_concurrency.py \
  --base-url http://127.0.0.1:TEST_PORT/api/v1 \
  --output /tmp/pawtrail-postgres-results.json \
  --concurrency 24 \
  --native-runner '["/path/to/backend/.venv/bin/python","/path/to/backend/manage.py","shell","-c"]'
```

Do not point either connection or the native runner at development/production records. Generated records are created through normal application eligibility only inside the isolated test database.

## Evidence, checks and cleanup

Sanitized JSON reports are in `output/achievements-postgres-2026-11-08/`, including environment versions, initial and corrected runs, final ledger snapshots, reproduced failure summaries and the final PostgreSQL log check. They contain no passwords, JWTs or runtime secrets.

System checks passed against both the isolated PostgreSQL database and the normal development database. No frontend change, production build or deployment was needed. The development API and idle analysis worker were reloaded to pick up the lock fixes, retaining their original private environments.

The final development inventory found zero generated PostgreSQL test accounts, achievement claims/proofs and achievement ledger entries. The isolated container/database was removed and generated connection secrets deleted after evidence was saved. The existing development preview remained running.

Coverage is PostgreSQL 14.18 with local Gunicorn workers, not every supported database release, production load, payment processing, visual recognition accuracy or all 45 individual qualification rules. Encounter testing targets the actual correction lock path without creating accepted sightings or identification references. The earlier SQLite/browser journey remains documented in [the end-to-end report](achievements-e2e-2026-11-08.md).

No Graphify graph existed, so the lock relationships were traced directly from source without graph extraction. Jev selected isolated PostgreSQL from sanitized test-plan facts (410 input / 45 output tokens); that judgment is planning guidance, not test evidence. Work was performed directly without subagents.
