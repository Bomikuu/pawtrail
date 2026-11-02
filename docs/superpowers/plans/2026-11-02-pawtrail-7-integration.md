# PawTrail Integration and Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the complete frontend behaves coherently, preserves privacy, supports a replaceable Django adapter, and can be reproduced from its documentation.

**Architecture:** Consume every feature package. Test the same domain contracts against mock storage and controlled Django HTTP fixtures, then exercise real Next dev HTTP routes with isolated sessions. Public SEO and private cache policy are central services.

**Tech Stack:** Next.js, Vitest/Testing Library/axe-core, Node HTTP/process tools, TypeScript compiler checks, CI; no production build or browser screenshots.

**Spec:** [Architecture specification](../specs/2026-11-02-pawtrail-design.md), §§2–11; [master plan](2026-11-02-pawtrail-implementation.md).

## Global Constraints

No semicolons/raw feature controls; run UI check after frontend edits. Verification is automated and scoped: no production builds or visual/manual verification without explicit request. Mock indexing is off. Currency PHP/centavos, en-PH, Asia/Manila, clock `2026-11-02T00:00:00+08:00`. No fabricated backend/payment/Maps verification claims.

## Review Focus

I1 checks malformed/denied/expired upstream responses; I2 checks every public representation and pagination; I3 checks cross-feature transactions and stale state; I4 checks keyboard/error/cancellation paths; I5 checks actual HTTP SSR/session behavior; I6 checks reproducibility and honest external limits.

### Task I1: Django adapter, endpoint contract and identical contract suite

**Files:** Complete `src/lib/api/adapters/django.ts`, create `src/lib/api/{serialization,pagination,retry}.ts`, `tests/contracts/{domain-suite,mock-adapter,django-adapter,fixtures}.test.ts`, `tests/unit/api/{refresh,retry,configuration}.test.ts`; extend the existing `docs/contracts/django-api.md`.

**Interfaces:** Implement all `PawTrailApi` methods against the proposed `/api/v1` contract. Normalize Django pagination `{count,next,previous,results}` into `Page<T>`, including a documented opaque cursor mapping for numeric-page endpoints if required. Only configured upstream origin is permitted; next-page URLs cannot redirect requests to a different host. Preserve RequestOptions abort and idempotency. Produce `runDomainContractSuite(factory: ApiTestFactory): void`, reused for both adapters.

- [ ] Write `adapters_have_identical_domain_results`, `expired_auth_replays_at_most_once`, `malformed_success_is_not_accepted`, and `cancel_does_not_retry`:

```ts
expect(normalizeDRFPage(wirePage)).toEqual(domainPage)
expect(refreshRequestCount).toBe(1)
expect(replayCount).toBeLessThanOrEqual(1)
await expect(readMalformedAnimal()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
expect(requestsAfterAbort).toBe(0)
```

- [ ] Run `npm run test:unit -- tests/contracts tests/unit/api/refresh.test.ts tests/unit/api/retry.test.ts tests/unit/api/configuration.test.ts`; expect incomplete Django adapter/mapping failures.
- [ ] Implement serialization, authorization, CSRF forwarding, controlled refresh, field-error mapping, cursor validation, Retry-After-aware bounded retry for safe reads only, request IDs and every domain operation. Never retry a mutation without an idempotency key and known endpoint support. Preserve exact privacy/state semantics or fail with an explicit unsupported capability. Keep all payment methods disabled in real mode. Document endpoint request/response/error examples, permissions, multipart uploads, private documents, proposed backend responsibilities and readiness status. Do not claim live integration from HTTP fixtures alone.
- [ ] Run contract suites and API tests, typecheck; expect pass.
- [ ] Commit `feat: complete replaceable Django API adapter contracts`.

### Task I2: Public metadata, sitemap, robots, schema and cache/privacy policy

**Files:** Create `src/app/{sitemap,robots}.ts`, shared public OG image handlers for Hordes/fundraisers/shelters/events/users, `src/lib/seo/{sitemap,visibility,cache-policy}.ts`, `tests/unit/seo/{all-entities,sitemap,robots,json-ld,cache}.test.ts`; modify each public detail page to use the shared helpers.

**Interfaces:** Produce `publicMetadata(entity: PublicEntity): Metadata`, `publicJsonLd(entity: PublicEntity): JsonLdDocument`, `listSitemapEntries(api: PawTrailApi): Promise<SitemapEntry[]>`, `cachePolicy(context: ApiContext, resource: ResourceRef): CachePolicy`. Only truly public real context-free reads receive the 60-second public revalidation policy; demo/private reads are no-store.

- [ ] Test `mock_sitemap_is_empty`, `real_sitemap_reads_every_page`, `hidden_profiles_never_enter_metadata_or_sitemap`, `schema_uses_supported_types`, and `private_contexts_are_never_shared_cached`:

```ts
expect(mockEntries).toEqual([])
expect(realEntries.length).toBe(totalPublishedPublicRecordsAcrossPages)
expect(realEntries.map(entry => entry.url)).not.toContain(hiddenProfileUrl)
expect(animalDocument['@type']).toBe('WebPage')
expect(animalDocument.mainEntity['@type']).toBe('Thing')
expect(cachePolicy(privateContext, animalRef).scope).toBe('no-store')
```

- [ ] Run `npm run test:unit -- tests/unit/seo`; expect missing global policy/route behavior.
- [ ] Complete titles/descriptions/canonicals/OG/Twitter/alt/structured-data across animal/Horde/campaign/shelter/event/user pages, supported WebPage/Thing/BreadcrumbList/Organization/Event schemas, mock noindex/robots, real visibility filtering and paginated sitemap generation. Escape JSON-LD and never include private geometry/evidence, applicants, hidden usernames, or private images. Ensure route notFound behavior, metadata and cache invalidation align; do not redirect missing records to unrelated pages.
- [ ] Run SEO/projection tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: complete public SEO and private cache boundaries`.

### Task I3: Cross-feature coherence, invalidation and transactional side effects

**Files:** Create `src/lib/api/invalidation.ts`, `src/lib/server/domain-events.ts`, `tests/unit/integration/{animal-story,campaign-support,adoption-status,mission-reward,event-links,session-refresh}.test.ts`; modify owning services, query hooks and landing/dashboard summary aggregators.

**Interfaces:** Produce `affectedQueries(event: DomainEvent, scope: string): QueryKey[]`, `invalidatePublic(refs: ResourceRef[]): Promise<void>`, `applyDomainEvent(event: DomainEvent, tx: DemoTransaction): Promise<void>`. `DomainEvent` is a discriminated union of reviewed post/sighting, follow/reaction, contribution, application decision, campaign update/expense/closure, mission review/reversal, event change/RSVP, privacy change and session change. Side effects are transactionally persisted or deduplicated by event ID.

- [ ] Test complete traces and pin:

```ts
expect(profileAfterApprovedSighting.lastSeenAt).toBe(sighting.observedAt)
expect(campaignAfterSupport.totals.raised).toBe(previousRaised + contribution.amountMinor)
expect(walletAfterRepeatedReview.balance).toBe(previousBalance + 30)
expect(queriesAfterLogout).toHaveLength(0)
expect(await reopenedDetail()).toMatchObject({ id: createdCampaign.id })
```

- [ ] Run `npm run test:unit -- tests/unit/integration`; expect stale-summary/invalidation/side-effect gaps to fail.
- [ ] Wire animal/Horde helper walls, timeline, campaign previews, mission links, adopted-interest availability, organization summaries, event markers, search, unread counts, Kibble balance, dashboard totals and landing statistics to canonical records. Add idempotency/optimistic rollback for mutations, invalidate scoped queries and public paths, and refresh server content where needed. Ensure removed/rejected/private records disappear from all public entry points. Expose every final navigation/Create destination only once it resolves to the real flow.
- [ ] Run integration/contract tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: reconcile PawTrail activity across every feature`.

### Task I4: Automated accessibility, failure-state and loading-budget checks

**Files:** Create `tests/unit/quality/{accessibility,keyboard,error-states,loading-boundaries,client-boundaries}.test.tsx`, `scripts/check-client-boundaries.ts`, `docs/quality/verification-matrix.md`; modify affected shared/feature components only for observed defects.

**Interfaces:** Produce `checkClientBoundaries(files: SourceFile[]): BoundaryViolation[]`, an AST-based check rejecting `use client` on public profile page modules and eager import of Maps/Recharts into the global shell. Reuse axe-core against rendered components and RTL user-event for dialogs/forms/tabs/dropdowns. These are nonvisual automated checks.

- [ ] Write `every_major_flow_has_keyboard_alternatives`, `dialogs_restore_focus`, `errors_preserve_user_input`, and `public_pages_do_not_depend_on_client_only_maps`:

```ts
expect((await axe(renderedDialog)).violations).toEqual([])
expect(document.activeElement).toBe(originalTrigger)
expect(screen.getByLabelText('Your story')).toHaveValue(draftText)
expect(checkClientBoundaries(publicPageFiles)).toEqual([])
```

- [ ] Run `npm run test:unit -- tests/unit/quality`; expect accessibility/error/boundary gaps to fail.
- [ ] Fix observed semantic labels, contrast tokens, focus order/restoration, live announcements, reduced motion, action alternatives, image dimensions/alt, preserved drafts, retry/reset/error messages, pending states and route loading/error boundaries. Lazy-load Maps and charts; reserve image/skeleton dimensions; honor AbortSignal and stop listeners on unmount. Test responsive control presence/CSS-token contracts without claiming layout screenshots were inspected. Record which WCAG behaviors are covered and what needs a separately requested visual/device review.
- [ ] Run quality tests, typecheck, UI check and client-boundary check; expect pass.
- [ ] Commit `fix: harden PawTrail accessibility and failure states`.

### Task I5: Automated HTTP acceptance against Next dev

**Files:** Create `scripts/test-routes.mjs`, `tests/routes/{helpers,public-ssr,auth-isolation,social,discovery,adoption,fundraising,missions,events,metadata}.test.mjs`, add `test:routes` script. Modify only defects revealed by scenarios.

**Interfaces:** Produce `startTestApp(options: TestAppOptions): Promise<TestAppHandle>`, `TestSession.request(path, init): Promise<Response>`, and `stop(): Promise<void>`. Helpers manage independent cookie jars, isolated temporary data directories, deterministic time, ephemeral port, readiness timeout, and teardown on success/error/signal. Test scenarios use HTTP, not a browser, screenshots or manual steps. Any test-only access mechanism must be disabled outside the isolated test environment.

- [ ] Add failing cases: every listed public route returns expected server text/metadata without executing JavaScript; unknown slugs return 404; private pages redirect anonymously; created demo post/campaign refreshes in the owning session only; two sessions cannot read each other's application/evidence; double contribution/review/RSVP stays unique. Include controlled-Django fixture mode and missing-Google-key mode.

```js
assert.equal(response.status, 200)
assert.match(await response.text(), /Mochi/)
assert.equal((await outsider.request(privateApplicationUrl)).status, 404)
assert.equal(await countMissionRewards(participationId), 1)
assert.equal(await activeTestProcessesAfterStop(), 0)
```

- [ ] Run `npm run test:routes`; expect unimplemented launcher/scenario or real integration failures. The launcher runs `next dev`, never a production build.
- [ ] Implement the isolated launcher/scenarios, cover every route family in spec §7 including static-vs-dynamic route precedence, error/loading contracts, URL filters, 404/metadata/privacy/caching and mock noindex. Verify missing live SDK/configuration produces the intended fallback. Request with an HTML-limited crawler user agent where necessary to assert metadata without executing scripts. Fix only demonstrated integration defects.
- [ ] Run `npm run test:routes`, then the full unit/contract suite, typecheck and UI check once; expect pass.
- [ ] Commit `test: verify complete PawTrail frontend HTTP journeys`.

### Task I6: Reproducible setup, CI, release checklist and review handoff

**Files:** Update `README.md`, `.env.example`, `AGENTS.md`; create `.github/workflows/checks.yml`, `docs/{setup,architecture,backend-integration,demo-limitations}.md`, `docs/quality/release-checklist.md`; update asset credits and task completion records.

**Interfaces:** Produce a documented fresh-checkout sequence `npm ci` → `.env.local` configuration → `npm run dev`, deterministic demo personas/reset procedure, complete commands and env reference, adapter contract checklist, and `npm run check`. CI runs automated type/UI/format/unit/contract/HTTP checks only, with temporary demo storage and no live credentials.

- [ ] Write a documentation/CI check that every documented npm script exists, every relative documentation link resolves, env example names match runtime config, all 35 task IDs have one owner, and no workflow invokes a production build. Pin assertions:

```ts
expect(documentedScripts.every(name => name in packageJson.scripts)).toBe(true)
expect(unresolvedDocumentLinks).toEqual([])
expect(plannedTaskIds.size).toBe(35)
expect(ciCommands).not.toContain('npm run build')
```

- [ ] Run `npm run test:unit -- tests/unit/tooling/docs.test.ts`; expect missing final setup/script/coverage details.
- [ ] Document exact installed versions, env setup, Maps key/map-ID prerequisites, mock isolation/writable-disk limits, private evidence behavior, proposed Django auth/endpoint contract, sample asset replacement, no-real-money wording, noindex policy and known unverified services. Include a compact architecture diagram and route ownership map. Mark genuinely completed tasks with commands/results/commit IDs; unfinished or externally blocked items remain explicit. Do not add a deployment workflow, Git remote, public publication, or production launch claim without the corresponding request.
- [ ] Run document checks and final automated aggregate after only documentation/CI edits; reuse unchanged successful app checks from I5 unless CI changes affect execution.
- [ ] Commit `docs: prepare PawTrail setup and integration handoff`.
- [ ] Request the user's chosen execution method's final independent review when executing the plan. Address actionable findings with targeted checks. Record live Maps/Django/payment/visual limits separately from passing local automated tests; do not mark those services verified from mocks.

## Final acceptance

- [ ] Every expected deliverable in original brief §29 has an implementing task and a verified working local demo route/action.
- [ ] Automated suite passes; UI boundaries, privacy projections, role checks, monetary invariants, review states, refresh persistence and query isolation hold.
- [ ] Live Google Maps and real Django verification are either evidenced with configured services or clearly unverified. Real payments remain out of scope.
- [ ] Setup, asset provenance, configuration, test commands, demo limitations and future production dependencies are documented.
- [ ] No production build, visual/manual verification, external messaging or publication occurred without explicit authorization.
