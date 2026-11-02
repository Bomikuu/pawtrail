# Proposed Django API contract

Status: implementation proposal, not evidence that endpoints exist. I1 completes executable serializers, examples and conformance tests against this contract. The [specification](../superpowers/specs/2026-11-02-pawtrail-design.md) owns domain signatures and privacy/state invariants.

## Transport rules

Browser requests use same-origin `/api/v1`. Server Components call the selected service directly. In real mode only the server adapter calls `DJANGO_API_BASE_URL`, which includes the upstream API prefix; append resource paths once. Never forward tokens to a caller-controlled host or follow pagination URLs to a different origin.

Domain methods return promises. JSON uses camelCase inside the frontend; I1 maps Django snake_case fields explicitly. Lists normalize to `{ items, count, nextCursor }`. Upstream `{ count, next, previous, results }` is normalized without dropping pages. Errors normalize to `{ code, message, status, fieldErrors?, requestId? }`. Cross-owner reads of sensitive resources return 404; forbidden actions on otherwise public records return 403; validation is 400/422; version/idempotency conflicts are 409. Domain response bodies pass Zod validation.

All POST create/submit/approve/support commands support `Idempotency-Key` where repeated delivery can duplicate a side effect. The server persists the actor+operation+key+payload hash and original result. Same key plus different payload is 409. Set-style PUT actions express desired state and are naturally idempotent. Versioned review/edit commands carry `expectedVersion`; do not silently accept stale overwrites. Pagination is default 12/max 50 with stable timestamp/ID ordering and opaque cursors.

Session cookies are HttpOnly with Secure in production, appropriate SameSite, expiry, rotation/logout and server-side credential protection. Validate same-origin/CSRF for mutations. The Django service must enforce object/organization permissions, filter visibility, own exact location policy and private media delivery, process immutable ledger/evidence review transitions, and emit consistent public DTOs. Client route guards alone are insufficient.

## Endpoint map

Paths below are resource paths beneath `/api/v1`. Literal static paths (drafts/preferences/create actions) are matched before parameter patterns. They are proposed concrete mappings; any backend change is resolved in the adapter and contract tests, not feature components.

| Domain | Method and path | Operation |
| --- | --- | --- |
| Auth | `GET /auth/session`; `POST /auth/login`; `POST /auth/register`; `POST /auth/logout`; `POST /auth/refresh` | Session lifecycle, sanitized actor response |
| Demo only | `POST /demo/session`; `POST /demo/actor`; `POST /demo/reset` | Initialize/select seeded actor/reset current isolated overlay; disabled in real mode |
| Media | `POST /media`; `DELETE /media/:id`; `GET /media/:id/content` | Multipart upload/removal and authorized content; approved public media may be anonymously readable |
| Animals | `GET /animals`; `GET /animals/:slug`; `POST /animals/reports`; `PATCH /animals/:id`; `PUT /animals/:id/saved` | Filtered public records, member report, managed edit, saved state |
| Posts | `GET /community/posts`; `POST /community/posts`; `GET/PATCH/DELETE /community/posts/:id` | Feed/create/detail/owned edit/soft removal |
| Post actions | `PUT /community/posts/:id/reaction`; `PUT /community/posts/:id/saved` | Desired active state, never toggle blindly |
| Discussion | `GET/POST /discussions/:kind/:id/comments` | Paged comments and reviewed author-scoped submission |
| Following | `GET /follows`; `PUT /follows/:kind/:id` | Filtered follows; only user/animal targets |
| Users | `GET /users/:username`; `PATCH /me/profile`; `GET/PATCH /me/settings`; `GET /me/summary` | Public projection, private settings and aggregated dashboard |
| Notifications | `GET /me/notifications`; `POST /me/notifications/read`; `GET /me/notifications/unread-count` | Owner-only notification state |
| Moderation | `POST /reports`; `GET /moderation`; `POST /moderation/:id/review` | Reports, authorized queue, versioned audited review |
| Discovery | `GET /discovery/areas`; `GET /discovery/nearby` | Geographic area and public bounded feature query |
| Sightings | `GET /sightings`; `POST /sightings` | Public authorized activity and private-coordinate submission |
| Hordes | `GET /hordes`; `GET /hordes/:slug` | Group discovery and public profile composition |
| Search | `GET /search` | Categorized public records with aggregate paging cursor |
| Adoption preferences | `GET/PUT /adoption/preferences` | Owner-only optional questionnaire |
| Adoption discovery | `GET /adoption/candidates`; `GET /adoption/interested`; `PUT /adoption/interested/:animalId` | Candidate paging and desired interested state |
| Applications | `GET/POST /adoption/applications`; `GET /adoption/applications/:id`; `PUT /adoption/drafts/:animalId` | Owned/organization application lists, submission, private detail/draft resume |
| Application transitions | `POST /adoption/applications/:id/withdraw`; `POST /adoption/applications/:id/resubmit`; `POST /adoption/applications/:id/review` | Explicit versioned status transitions |
| Campaigns | `GET/POST /fundraisers`; `GET /fundraisers/:slug`; `PATCH /fundraisers/:id` | Public discovery, reviewed creation and permitted edits |
| Campaign drafts | `GET /fundraisers/drafts`; `GET /fundraisers/drafts/:id`; `PUT /fundraisers/drafts` | Owner-only summaries/detail/upsert, optional ID on first save |
| Campaign activity | `POST /fundraisers/:id/updates`; `POST /fundraisers/:id/expenses`; `POST /fundraisers/:id/close`; `GET /fundraisers/:id/supporters`; `GET /me/fundraising` | Organizer updates/immutable expenses/closure, public supporters and private dashboard |
| Demo support | `POST /fundraisers/:id/demo-contributions` | Mock-only illustrative ledger entry; returns DEMO_ONLY in real mode |
| Missions | `GET/POST /missions`; `GET /missions/:slug`; `POST /missions/:id/accept`; `GET /mission-participations` | Public help discovery/create and actor/organization participation lists |
| Mission evidence | `POST /mission-participations/:id/evidence`; `POST /mission-participations/:id/review` | Private evidence submission and reviewer approval/rejection |
| Rewards | `GET /me/kibble`; `GET /me/kibble/transactions`; `GET /leaderboard` | Earned non-cash wallet/history/month-or-all ranking |
| Shelters | `GET /shelters`; `GET /shelters/:slug`; `GET /shelters/:id/dashboard` | Public organization and authorized management summaries |
| Events | `GET/POST /events`; `GET /events/:slug`; `PATCH /events/:id`; `PUT /events/:id/rsvp` | Public/managed event operations, cancellation state and desired RSVP |

## Required contract examples at I1

I1 adds executable fixtures for list/detail/create, field validation, 401/403/404/409, expired session/refresh failure, idempotency replay/payload conflict, pending-vs-public visibility, canceled request, missing cursor page, malformed success and private media authorization. The same domain suite runs against mock storage and controlled Django HTTP fixtures. Fixed errors/retries may not silently fabricate real records or payments.

The actual Django backend, durable production storage, provider tokens, geospatial indexes, review operations, external notifications and payment processing remain separate delivery work. A configured live environment is required before claiming live backend conformance.
