# Optional Django game API contract

The current game uses local storage. `DjangoGameApi` in `src/game/django.ts` is an integration boundary, not an operating backend or automatic synchronization. A caller supplies a trusted API base URL and an authenticated session. The transport uses session cookies and, when present, the Django `csrftoken` cookie as an `X-CSRFToken` header.

## Endpoints

- `GET /api/game/progress/`: authenticated user's canonical progress. The response matches the version-2 Progress shape in `src/game/types.ts` and is validated by `validProgress` before consumption.
- `POST /api/game/activities/`: submit `{ id, kind, animal_id, client_timestamp }`, with `Idempotency-Key: <activity UUID>`. Supported gameplay events need an explicit server allowlist and permission checks. The request deliberately omits client-provided reward amounts.

## Server responsibilities

Use authenticated per-user records; apply CSRF protection and narrowly scoped CORS when needed. Validate animal identifiers, action eligibility, inventory, proximity/session evidence, cooldowns, and rescue approval. Lock inventory/progress records inside a database transaction, enforce unique activity IDs and one-time milestone keys, and derive rewards from server-owned rules. Replays return the recorded outcome without spending or awarding again. Return the canonical updated progress and accepted activity identifier.

The local save is untrusted. Never import a local Kibble total, quest completion, medical outcome, or rescue approval as authoritative data. Production real-world sightings/rescue events must use their own privacy, moderation, and verification workflows.

An actual Django/DRF service, migration schema, session/login integration, offline outbox reconciliation, conflict handling, and production deployment remain separate backend work. This prototype makes no network calls to that contract until an integration explicitly uses the adapter.
