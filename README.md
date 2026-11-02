# PawTrail

**Every Paw Has a Story.** Discover. Care. Connect.

PawTrail is a planned social community for pets and animal welfare: stories and pet profiles connect to nearby sightings, adoption, fundraising, and volunteer help.

This repository contains the implementation planning package, application scaffold, typed API boundary, and isolated local demo storage. Feature implementation is in progress.

Start with the [master implementation plan](docs/superpowers/plans/2026-11-02-pawtrail-implementation.md), then read the [architecture specification](docs/superpowers/specs/2026-11-02-pawtrail-design.md). The [original brief](docs/requirements/pawtrail-original-brief.txt) is preserved verbatim.

The plan has seven work packages, covering 35 independently testable tasks. The frontend uses Next.js App Router, React, TypeScript, Tailwind, and Shadcn. Initial data and workflows run in explicit demo mode behind an API boundary prepared for Django REST Framework.

No Git remote, hosted site, or deployment has been created. Repository verification rules are in [AGENTS.md](AGENTS.md).

## Local demo storage

Demo mode (`NEXT_PUBLIC_USE_MOCK_API=true`) supports one Node process with writable local disk. Session overlays live in the ignored `.pawtrail/demo/` directory, or the server-only `DEMO_DATA_DIR`. This repository is unsuitable for stateless or multiple-process hosting; use Django or replace the repository with shared storage for those deployments. Keep the directory private to the application OS account. Session JSON files use owner-only permissions and must never be committed, published, or served as static content.

Anonymous reads use base fixtures without a cookie. Send a same-origin `POST /api/v1/demo/session` to initialize an isolated session. The response sets an opaque HttpOnly, SameSite=Lax cookie (Secure over HTTPS). New content belongs only to that browser session and remains available after refresh. Public RSC and BFF reads load the same current snapshot; Server Components only read cookies. Both projections and the explicit API route allowlist remain enforced. Feature mutations and actor login are supplied by their owning packages.

Set `DEMO_ALLOW_RESET=true` explicitly to enable same-origin `POST /api/v1/demo/reset`. Reset affects only the session named by the request cookie, including its idempotency receipts. Both lifecycle endpoints are disabled in real mode. Old schema/fixture versions and damaged documents return `DEMO_RESET_REQUIRED` (HTTP 409), preserving the file until an explicit reset; there is no silent fallback to another session. If reset is disabled, the host must opt in before recovery.

Repository commands receive a private mutable `draft.data` and the shared frozen demo clock (`2026-11-02T00:00:00+08:00`). Commands must validate domain permissions/invariants and use JSON-safe inputs/results. Name idempotent commands by operation and actor scope, supplying the same input and key on retries. Receipts commit atomically with collection overlays, and conflicting reuse returns `CONFLICT`. Different handles share a process-level queue keyed by canonical file path. Queries and command outputs are detached from stored state. Do not call repository operations recursively inside a command. When new persistent collections or storage formats are introduced, update the schema version; changing the base fixtures requires updating the fixture version.

Commits sync a private temporary file before atomic rename. Failed commands or failed replacement leave the previous file valid, and a normal replacement failure removes its temporary file. This does not provide distributed locking, arbitrary power-loss recovery, automatic expiry/cleanup, or protection from another privileged local process modifying the data directory.
