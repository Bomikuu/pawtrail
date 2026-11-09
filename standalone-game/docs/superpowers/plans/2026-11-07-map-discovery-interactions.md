# Discovery interaction refinement

**Goal:** Let people try nearby animal discovery, select members around grouped pins, preview sidebar results on the map, and report locations without entering coordinates.

**Architecture:** Keep geographic clusters, permanent membership and real records unchanged. A shared member projection supplies clickable satellite avatars in both renderers. Clearly labeled, browser-only proximity fixtures follow explicit location/center choices. Sidebar previews emit debounced focus commands; location picking inside the reporting dialog reuses the existing geographic renderer without losing form input. Cat/dog fallback portraits use original imagegen artwork matching the existing meadow banner.

**Constraints:** Direct implementation, no agents, automated tests/checks/builds/browser verification. Official shadcn components and Tailwind. Preserve MapLibre/OpenFreeMap, existing permissions, sample provenance and unrelated social-worktree changes.

- [x] Add local nearby fixtures and shared membership-to-detail projection.
- [x] Add external clickable animal circles to entity/geographic markers in both renderers; preserve stable membership counts and location meanings.
- [x] Connect sidebar hover/focus/click to map movement with selection retained and reduced-motion support.
- [x] Replace longitude/latitude fields with dialog map/current-location selection and a visible selected-location state.
- [x] Generate, save and integrate separate matching cat/dog illustrations; record prompts and sync the integrated app.
