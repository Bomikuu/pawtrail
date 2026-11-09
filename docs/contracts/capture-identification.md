# Real capture and animal identity API

Implementation: `backend/`. Browser transport: `/api/capture/*` via `src/lib/server/capture-gateway.ts`; upstream API prefix defaults locally to `http://127.0.0.1:8002/api/v1`. The capture client has dedicated Zod schemas in `src/features/capture/schemas.ts` and never obtains generated match results from the sample API.

The dedicated typed capture adapter is a deliberate boundary while other social modules remain mocked. It shares the existing sealed-session implementation and same-origin mutation guard. In full real mode it uses the platform session; in mock community mode it uses a separately sealed real capture session. A demo actor ID is never accepted as authentication or enrollment proof. JSON in this vertical slice is camelCase; it is not passed through the legacy Django field-name mapper.

| Method | Browser suffix | Meaning |
| --- | --- | --- |
| GET | `status` | Real service availability and model/policy availability flags |
| POST | `auth/register`, `auth/login`, `auth/logout` | Real account/session operations; tokens never returned to the browser |
| GET | `auth/session` | Sanitized real identity |
| POST | `media` | JPEG/PNG/WebP multipart upload, up to 10 MiB; idempotency supported |
| GET | `media/:id/content` | Authorized normalized private preview |
| GET | `media/:id/public` | Publication-authorized stripped derivative |
| POST | `captures` | Private media, source/time assertions, optional location/accuracy/time, area label and optional cloud consent |
| POST | `captures/:id/observations` | Create/recover an unsubmitted observation |
| GET | `observations` | Current real account's paginated encounters |
| GET | `observations/:id` | Owner/reviewer detail, evidence, latest analysis and decision history |
| POST | `observations/:id/selection` | Versioned crop/reanalysis selection; invalidates in-flight obsolete runs |
| GET/POST | `observations/:id/analysis` | Durable asynchronous status/start |
| POST | `observations/:id/submit` | Versioned proposal/provisional registration/automatic-policy decision |
| GET | `moderation/animal-identities` | Independent reviewer queue; `scope=all` includes decisions |
| POST | `moderation/animal-identities/:id/decision` | Independent confirm/reassign/dispute/reject, reason and separate evidence acceptance |
| GET | `animals`, `animals/:id` | Confirmed real identities or authorized provisional records; safe historical locations |
| GET/POST/DELETE | `animals/:id/references[/:referenceId]` | Independent reference enrollment/withdrawal |

List cursors are signed and bound to route, real actor and filters. The gateway allowlists routes, methods and query keys; it is not a caller-selected URL proxy. Backend failures use the existing `{code,message,status,fieldErrors?}` envelope.

Upload/capture/submission/review request keys cannot be reused for different inputs. A submission also checks observation version, current reference gallery, currently enabled policy, actual animal species and permissions. An explicit `allowAutomaticMatch=false` prevents the algorithm from overriding a contributor's rejection of the suggestions.

`identityState`, `evidenceState` and `publicationState` are independent. Confirming an identity does not by itself publish a fresh sighting. A duplicate exact photo cannot produce another active sighting for the same animal. All accepted/reassigned/disputed decisions remain auditable. Reference enrollment is independent of automatic matches; no silent profile merge exists.

Source evidence and private-coordinate DTOs are never returned by public animal endpoints. Original files have no public route. Public image eligibility is revocable. The API does not return raw similarity scores, feature vectors, private reference IDs or exact comparison distances in candidate cards.

The legacy direct `POST /sightings` returns `CAPTURE_REQUIRED`; it cannot bypass analysis/review. Other unconnected social domains return `DOMAIN_NOT_CONNECTED`, not fabricated records. Do not globally switch the surrounding community to this backend until its additional domain APIs are implemented.

See [service setup and operating limits](../../backend/README.md). No automated tests, type checks, builds, browser verification, recognition evaluation, PostgreSQL validation or external AI calls were run for this delivery. Migrations/model installation and starting runtime processes are setup operations, not evidence of functional correctness.

## Automatic setup and real rewards follow-up

The canonical real `GET /kibble/wallet` returns a ledger-derived balance, `nonCash=true`, real provenance and the current sighting policy. `GET /kibble/ledger` returns signed-cursor owner-scoped entries with source observation, immutable amount, running balance, reason `sighting_approved|sighting_reversed`, animal attribution snapshot and Manila reward date. These routes are exposed through `/api/capture` and use the same real account.

Receipts now include `rewardStatus`, `rewardAmount` and `rewardReason`. Status distinguishes pending, awarded, reversed, capture-time unknown, same-animal/day recognition, daily limit and ineligible evidence. Client totals and caller-selected amounts are never write inputs. Retried submissions/reviews return the current observation/reward projection without reapplying effects, so a retry cannot display a stale award after correction.

Reviewer-only `GET /identity/setup` returns real model/rule versions, reference coverage and policy blockers. `POST /identity/calibrations` imports a bounded real report plus provenance and an explicit independent-data acknowledgment. `POST /identity/policies/:id/activation` accepts only an enable/disable boolean. Activation requires a passing current report; similarity and competitor thresholds must match the evaluated values, and only the calibrated animal cohort qualifies. There is no arbitrary threshold/credit mutation endpoint. Reports/policies are read-only in Django admin.

See [automatic setup and reward rules](../implementation/automatic-identification-rewards.md). The owner selected preparation for future captured photos. No recognition evaluation, synthetic reward transactions or automated tests were executed.
