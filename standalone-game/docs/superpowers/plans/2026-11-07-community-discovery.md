# Community Discovery Implementation Plan

**Goal:** Extend the existing map with animal relationships, independent geographic clustering/proximity and moderated welfare information, preserving MapLibre/OpenFreeMap and existing entry flows.

**Architecture:** Keep CommunityPlace as the existing housing/platform boundary and project it into richer discovery entities. Permanent membership uses explicit animal IDs; geographic clusters aggregate visible entities at the current zoom; proximity uses geodesic distance to an independently selected center. Contribution evidence and welfare reports are separate DTOs, stores, overlays and summaries. New persistent reporting uses the existing signed-account housing Django service and external entity references, without duplicating platform User/Animal/Shelter records. An optional GeoDjango/PostGIS index supports production spatial queries; SQLite remains the local development path. Existing platform APIs supply public animal/Horde/mission/shelter data through the integration bridge.

**Tech stack:** React/TypeScript, official shadcn/ui, Tailwind, existing MapLibre/OSM fallback, Django/DRF, optional GeoDjango/PostGIS. No map-provider dependency replacement.

**Spec:** Attached Community Map & Discovery System brief plus the owner's explicit membership/geographic/proximity separation and independent reputation/incident recommendation. Google Maps in the attachment is superseded by the owner's confirmed MapLibre choice.

**Execution constraints:** Implement directly without agents. No automated tests, type/UI/format/detector checks, builds or browser verification unless newly requested. Graphify source tracing and Jev architecture classification are explicitly requested; submit only a non-sensitive architecture synopsis to Jev. Retain the running development services.

- [x] Extend discovery DTOs, membership/deduplication, spherical radius geometry, distance summaries and bounded cached services. Preserve existing list/entry/provider recovery features.
- [x] Expand the platform bridge and opt-in home directory with approved animal memberships. Include only public non-sensitive animal photos/locations. Keep fictional demo records labeled.
- [x] Add Django incident/help/community/reference/contribution records, private evidence, owner/reviewer access, explicit public summaries, corrections and urgent expiration. Add production-only spatial indexing and bounding/distance queries.
- [x] Compose accessible photo/collage markers, mixed cluster summaries, synchronized selection, layers, proximity controls, geolocation/manual center, contextual detail panels and reporting/review dialogs. Reuse shared shadcn components and existing visual identity.
- [x] Synchronize the game/API integration, apply additive migrations with --skip-checks, restart only the affected housing service, and document implemented behavior and unverified runtime limits.

Delivery notes: see docs/implementation/community-discovery.md for service/adapter limits and the unexecuted PostGIS path. Runtime/browser verification was intentionally not performed.
