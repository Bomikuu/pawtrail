# Django integration

Set `NEXT_PUBLIC_USE_MOCK_API=false`, `DJANGO_API_BASE_URL` to the backend API prefix (for example `http://127.0.0.1:8000/api/v1`), and a private random `SESSION_SECRET` containing at least 32 characters. Never prefix credentials or the backend signing secret with `NEXT_PUBLIC_`.

The proposed endpoint map is in `contracts/django-api.md`. The adapter reuses the complete typed client factory with a server transport, explicit known-key snake/camel conversion, Zod response validation, timeout/abort propagation and idempotency headers. Django must implement these endpoints and the documented object permissions; this repository does not include a Django server.

Login/registration responses must contain `access`, `refresh`, and `session`. `session` is the sanitized PawTrail session DTO (snake_case is accepted). Credentials are encrypted with AES-256-GCM into a same-origin HttpOnly SameSite=Lax cookie, marked Secure in production. Neither JWT enters browser JSON, query keys or local storage. Logout clears the cookie even when the upstream logout fails. Refresh is coalesced while in flight, uses `/auth/refresh`, and permits one replay. Server Component reads can refresh for that request; only BFF request handlers can update cookies. A rotating refresh-token backend must support a short overlap or an external shared session store for cross-request RSC/BFF refresh coordination before production use.

Upstream lists may return native PawTrail pages or Django `{ count, next, previous, results }`. The adapter converts same-resource page/cursor/offset state to filter-bound opaque cursors. It never follows a different host, path or arbitrary pagination URL, and does not follow HTTP redirects. Configure slash conventions to match the contract. Malformed bodies fail explicitly; there is no mock fallback in real mode.

Private media is streamed through the authorized BFF. Only JPEG, PNG, WebP and PDF are served, with a 10 MiB bound, no-store/nosniff/sandbox headers and attachment delivery for PDFs. Backend authorization and content validation remain mandatory.

New bounded contract fields include `GET /me/profile`, owner-scoped animal/sighting/event list filters, optional animal verification evidence, Horde beneficiaries, campaign budget/timeline, private expense receipt IDs, private application history and current-viewer event attendance. Shelter evidence uploads use an explicit `verificationShelterId` plus matching current-organization `shelterId` and `private_evidence` purpose. The backend must preserve these privacy and independent-review semantics.

No live credentials, live backend requests or conformance tests have been used to approve this adapter. Automated testing was explicitly stopped by the owner. Complete backend-specific validation and production session-store decisions before deploying real mode.
