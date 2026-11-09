# Visible animal help alerts

**Goal:** Make published urgent requests and welfare concerns discoverable through animal/group rings and one actionable bottom-center prompt.

**Architecture:** Project existing public request/incident/missing-animal information into a shared attention DTO. Only explicitly associated animals inherit a request/incident; a concern at a home does not mark all its pets as individually endangered. Both renderers share the marker components. The prompt uses loaded visible/nearby entities, prioritizes real records, deduplicates one source across animal/place/request projections, and dismisses per source version for this map visit.

**Motion thesis:** One slow, translucent expanding ring on urgent/concern map circles, supported by a static outline/icon/status for reduced motion. Routine help has a static indicator. The prompt uses the existing short panel transition, without auto-pan, sound, rotation or opening a profile until a person clicks. Hide it while another contextual panel or report is active.

**Constraints:** Direct implementation; no agents, automated tests/checks/builds or browser verification. Official shadcn/Tailwind, existing privacy and sample boundaries. No diagnosis or confirmation inferred from free text; no reward/reputation changes. One explicitly fictional urgent transport example makes the interaction discoverable in the local demo.

- [x] Derive and propagate attention from explicit, active public sources and preserve uncertainty/status.
- [x] Add rings, alert icons and priority visibility to animal, member and geographic-group markers.
- [x] Add one dismissible bottom-center prompt, working focus/detail actions, and a contextual status explanation.
- [x] Add a labeled sample request, synchronize source and document behavior and verification limits.
