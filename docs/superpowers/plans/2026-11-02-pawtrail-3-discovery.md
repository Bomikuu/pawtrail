# PawTrail Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver nearby animal discovery, synchronized Google map/list interaction, animal reports/sightings, Hordes, and cross-domain search.

**Architecture:** Consume foundation and public-profile/moderation services. All geographic record filtering belongs to PawTrail services; Google renders the map and optionally resolves geographical places.

**Tech Stack:** Next.js, Google Maps JavaScript API, vis.gl, MarkerClusterer, Zustand, TanStack Query, Shadcn, Vitest/Testing Library.

**Spec:** [Architecture specification](../specs/2026-11-02-pawtrail-design.md), §§4–8; [master plan](2026-11-02-pawtrail-implementation.md).

## Global Constraints

No semicolons, no feature-level raw controls, mandatory UI check after UI edits. No builds or visual/manual verification without explicit request. Public coordinates use neighborhood centroids with radius ≥500 m; never expose exact sighting or home coordinates. Demo clock is `2026-11-02T00:00:00+08:00`. Google-key failure keeps the animal list usable.

## Review Focus

D1 covers invalid/antimeridian bounds, URL filters and private geometry; D2 covers stale map queries, clustering lifecycle and missing external services; D3 covers sensitive submissions; D4 covers group consistency; D5 covers visibility, canceled queries and cross-domain paging.

### Task D1: Discovery service, filters and geographic query contracts

**Files:** Create `src/features/discovery/{types,schemas,filters,service,url-state}.ts`, `src/features/discovery/{search-panel,animal-result-list,animal-result-card}.tsx`, `src/app/(public)/explore/{page.tsx,loading.tsx,error.tsx}`, `tests/unit/discovery/{filters,bounds,privacy,url-state}.test.ts`.

**Interfaces:** Implement `discovery.searchAreas/nearby`, `animals.list`. `DiscoveryQuery = { bounds?: GeoBounds, center?: GeoPoint, radiusMeters?: number, filters: AnimalFilters, kinds: DiscoveryKind[] }`; require validated lat/lng bounds and positive radius. `DiscoveryResult = { animals: Page<AnimalSummary>, markers: PublicMapFeature[], area: GeoArea }`. `PublicMapFeature` is a discriminated union of animal/Horde/mission/fundraiser/event references and public geometry.

- [ ] Write `filters_combine_and_round_trip`, `handles_wrapped_longitude_bounds`, and `never_returns_private_geometry`:

```ts
expect(parseFilters(serializeFilters(filters))).toEqual(filters)
expect(result.animals.items.every(a => a.species === 'cat' && a.needsHelp)).toBe(true)
expect(withinBounds({ lat: 0, lng: 179 }, wrappedBounds)).toBe(true)
expect(JSON.stringify(result)).not.toContain(privateSighting.exactLongitude.toString())
```

- [ ] Run `npm run test:unit -- tests/unit/discovery`; expect missing query/filter behavior.
- [ ] Implement cats/dogs/other/nearby/needs-help/missing/recent/adoptable/Hordes filters, keyword/area search, canonical URL state, stable paging/sorting, last-seen/personality/health/badge display, empty reset action, error retry, and location permission states. Use fixture areas offline; optional place geocoding must not fetch PawTrail records from Google. Shared record queries return only approved public records.
- [ ] Run discovery/API projection tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: add filtered animal discovery services and list`.

### Task D2: Google map, clustered features and accessible map/list layouts

**Files:** Create `src/components/maps/{google-provider,map-canvas,animal-marker,feature-marker,marker-cluster,info-window,map-controls,map-fallback}.tsx`, `src/features/discovery/{explore-layout,map-panel,mobile-results-sheet}.tsx`, `src/features/discovery/map-controller.ts`, `src/features/animals/behavior-map.tsx`, `tests/unit/maps/{controller,clustering,fallback,selection}.test.tsx`.

**Interfaces:** Produce `MapCanvas({features,selectedId,onSelect,onBoundsChanged})`, `useDiscoveryMapController(): DiscoveryMapController`; controller exposes `select(ref)`, `searchBounds(bounds)`, `locate()`, `setZoom(zoom)`, `setPanelMode(mode)`. `BehaviorMap({sightings,period})` consumes generalized sightings from S1/D3, with morning/afternoon/evening/all filters in Asia/Manila. MarkerClusterer is cleaned up when features change or the island unmounts.

- [ ] Test `list_selection_and_marker_selection_share_one_reference`, `stale_bounds_response_cannot_replace_newer_results`, `unmount_clears_cluster_and_listeners`, and `missing_key_keeps_results_accessible`:

```ts
expect(controller.selectedRef).toEqual(clickedListAnimalRef)
expect(renderedFeatureIds).toEqual(newestResponseIds)
expect(clusterer.clearMarkers).toHaveBeenCalledTimes(1)
expect(screen.getByText('Map unavailable')).toBeInTheDocument()
expect(screen.getByRole('link', { name: /View Mochi/ })).toHaveAttribute('href', '/pets/mochi-the-void')
```

- [ ] Run `npm run test:unit -- tests/unit/maps`; expect missing controller/adapter/fallback behavior.
- [ ] Implement Google provider/key/map-ID configuration, typed marker styles, clustering, infowindows, zoom/location/search-this-area controls, record/list synchronization, selected-card focus, map lifecycle cleanup, abortable bounds fetches, desktop resizable/collapsible panel, and mobile draggable sheet with equivalent buttons/keyboard controls. Store panel preference only as UI state. Handle denied geolocation, script error, network/quota failure, and missing configuration without fabricated geographic imagery. Add animal-history maps without replacing server profile text.
- [ ] Run map/discovery tests, typecheck, UI check. Fake the external SDK for deterministic logic tests; record live-SDK verification as unavailable without credentials and explicit verification scope.
- [ ] Commit `feat: connect clustered animal maps and responsive results`.

### Task D3: Animal reports and sightings with private coordinate handling

**Files:** Create `src/app/(public)/animals/report/page.tsx`, `src/app/(public)/sightings/create/page.tsx`, `src/features/animals/report-form.tsx`, `src/features/animals/report-service.ts`, `src/features/sightings/service.ts`, `src/features/sightings/sighting-form.tsx`, `tests/unit/sightings/{privacy,validation,persistence,moderation}.test.ts`; extend F2's sighting types/schemas.

**Interfaces:** Implement `animals.report`, `sightings.list/create`. `SightingInput` contains animalId or hordeId, observedAt, observation/body-condition/feeding notes, photograph media IDs, areaId, optional private submitted coordinates, and consent flags. `Sighting` contains public area and observation data only; private coordinates use `PrivateSightingLocation`. `AnimalReportInput` requires species, description, area, image/alt when available, and reported status; the service assigns ownership/review status.

- [ ] Test `report_and_sighting_require_auth`, `future_observation_is_rejected`, `exact_location_never_enters_public_dto`, and `unreviewed_sighting_does_not_award_points`:

```ts
expect(created.moderationState).toBe('pending')
expect(created).not.toHaveProperty('exactLatitude')
expect(await publicSightings()).not.toContainEqual(expect.objectContaining({ id: created.id }))
expect(await earnedFor(created.id)).toBe(0)
```

- [ ] Run `npm run test:unit -- tests/unit/sightings`; expect missing report/sighting behavior.
- [ ] Implement report/sighting forms, linked animal/Horde prefill, upload previews, time/area validation, explicit coordinate consent, duplicate-submit handling, local persistence and reviewer integration. Reject invalid species references, impossible/future observations, and observations on inaccessible records. Approved observations update last-seen, timeline, generalized behavior map, discovery, dashboard sightings and relevant post/help links. Keep observed condition separate from medical diagnosis.
- [ ] Run sighting/moderation/privacy tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: support reviewed animal reports and sightings`.

### Task D4: Hordes and shared group activity

**Files:** Create `src/app/(public)/hordes/{page.tsx,loading.tsx,error.tsx}`, `src/app/(public)/hordes/[slug]/page.tsx`, `src/features/hordes/{service,queries}.ts`, `src/features/hordes/{horde-card,horde-profile,member-list,shared-activity}.tsx`, `tests/unit/hordes/{membership,activity,public-profile}.test.tsx`.

**Interfaces:** Implement `hordes.list/get`; `HordeProfile` contains ID/slug/name/image/area, estimated count, known member summaries, shared sightings/feeding, needs, active mission/campaign references, contributors. Estimated count is distinct from confirmed member count and must be labeled.

- [ ] Test `resolves_members_without_duplicate_animals` and `group_activity_obeys_moderation_and_anonymity`:

```ts
expect(new Set(profile.members.map(a => a.id)).size).toBe(profile.members.length)
expect(profile.estimatedCount).toBeGreaterThanOrEqual(profile.members.length)
expect(profile.activity.every(item => item.moderationState === 'published')).toBe(true)
expect(JSON.stringify(profile.contributors)).not.toContain(anonymousHelper.privateName)
```

- [ ] Run `npm run test:unit -- tests/unit/hordes`; expect missing group composition.
- [ ] Implement group index/profile, member cards, approximate location, shared activity, group help links, contributor wall and sample provenance. Wire group map markers and composer links. Animal membership is explicit, not inferred just because coordinates overlap. Campaigns/missions link the same group ID; I3 confirms later-package cross-links.
- [ ] Run group/profile/discovery tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: connect animal Hordes and shared welfare activity`.

### Task D5: Global categorized search and autocomplete

**Files:** Create `src/app/(public)/search/page.tsx`, `src/features/search/{types,schemas,service,queries}.ts`, `src/features/search/{global-search,search-results,search-group}.tsx`, `tests/unit/search/{visibility,cancellation,pagination,keyboard}.test.tsx`. Modify header search.

**Interfaces:** Implement `search.query`. `SearchQuery = { q: string, kinds?: EntityKind[], cursor?: string, limit?: number }`; `SearchResults = { query: string, groups: SearchGroup[], nextCursor: string | null }`. SearchResult contains only public label/summary/image/ref/href; separate per-kind cursors must be encoded transparently in the aggregate cursor. Include animals, Hordes, shelters, fundraisers, missions, events, public posts, and discoverable users.

- [ ] Write `search_mochi_returns_pet_campaign_and_story`, `hides_pending_private_and_removed_records`, and `stale_autocomplete_cannot_overwrite_latest_query`:

```ts
expect(result.groups.map(group => group.kind)).toEqual(expect.arrayContaining(['animal', 'fundraiser', 'post']))
expect(allResultIds).not.toContain(hiddenUser.id)
expect(JSON.stringify(result)).not.toContain(privateApplication.email)
expect(visibleQuery).toBe('Mochi')
```

- [ ] Run `npm run test:unit -- tests/unit/search`; expect missing aggregation/keyboard behavior.
- [ ] Implement debounced/abortable autocomplete, keyboard selection/Escape, categorized links, URL query, stable paged results, loading/no-result/error states, and role-independent public projections. Search real mode uses the backend endpoint; fixture search does not substitute for a missing real endpoint. Do not send private application or document text to search indexing.
- [ ] Run search/profile/privacy tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: add categorized PawTrail global search`.

## Package acceptance

- [ ] Find/select/filter animals in either list or map, report a sighting, review it, and see authorized profile/group updates.
- [ ] Lists/search remain useful without Google configuration. Every public geographic payload passes privacy assertions.
- [ ] Live external Maps verification is recorded separately from SDK-mocked automated coverage.
