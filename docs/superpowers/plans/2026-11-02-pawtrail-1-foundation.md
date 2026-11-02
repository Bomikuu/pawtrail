# PawTrail Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a running local application with shared controls, typed data access, persistent demo sessions, authentication, media, navigation, and landing content.

**Architecture:** Follow [the master plan](2026-11-02-pawtrail-implementation.md). Server and browser entry points share adapters and schemas; only server code touches sessions or disk.

**Tech Stack:** Next.js/React/TypeScript, Tailwind/Shadcn, TanStack Query, Zustand, Zod, React Hook Form, Lucide, Motion, Vitest/Testing Library.

**Spec:** [Architecture specification](../specs/2026-11-02-pawtrail-design.md), especially §§2–5/9–10.

## Global Constraints

Inherit every master constraint. No semicolons; no production builds or visual/manual verification without explicit request. PHP integer centavos, en-PH, Asia/Manila; demo clock `2026-11-02T00:00:00+08:00`. Controls belong in `src/components/ui`; run `npm run check:ui` after frontend edits. Demo data and auth are labeled, and private data never enters public projections.

## Review Focus

F2 covers public DTO allowlists and invalid data; F3 covers refresh/session isolation/concurrency; F4 covers cache and actor crossover, refresh loops and CSRF; F5 covers private media and rejected uploads; F6/F7 cover accessible navigation and truthful sample content.

### Task F1: Application tooling and UI boundary enforcement

**Files:** Create `package.json`, `package-lock.json`, `.nvmrc`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `.prettierrc.json`, `components.json`, `vitest.config.ts`, `tests/setup.ts`, `scripts/check-ui.ts`, `tests/unit/tooling/ui-boundary.test.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `.env.example`. Preserve existing documentation and Git history.

**Interfaces:** Produce `scanUiSource(path: string, source: string): UiViolation[]`, where `UiViolation = { path: string, line: number, tag: string }`; scripts specified in the master plan. Later tasks consume the strict `@/*` path alias and test setup.

- [x] Bootstrap only the tooling needed to run tests, resolving compatible stable dependencies from official metadata. Record Node LTS and package versions in the lockfile. Do not run `next build`.
- [x] Add failing scanner tests: `<button />` in `src/features/community/x.tsx` yields one violation at line 1; raw `input/select/textarea/table/thead/tbody/tfoot/tr/th/td` also fail; identical code under `src/components/ui/` passes; `<Button />` and ordinary links pass. AST traversal must inspect nested JSX, not grep source text.

```ts
it('rejects_feature_primitives_and_allows_shared_controls', () => {
  expect(scanUiSource('src/features/community/x.tsx', '<button />')).toEqual([{ path: 'src/features/community/x.tsx', line: 1, tag: 'button' }])
  expect(scanUiSource('src/components/ui/button.tsx', '<button />')).toEqual([])
})
```
- [x] Run `npm run test:unit -- tests/unit/tooling/ui-boundary.test.ts`; expect failure for the missing scanner.
- [x] Implement the scanner, nonzero CLI exit on violations, global layout, and empty theme entry. Configure Prettier `semi: false`, strict TypeScript, test isolation, and `.env.example` names from the master plan. Avoid adding unrelated libraries.
- [x] Run that test, `npm run typecheck`, and `npm run check:ui`; expect pass.
- [x] Run format checks for the created files; expect pass.
- [x] Commit `chore: establish PawTrail application tooling`.

### Task F2: Domain contracts, fixtures, and request-scoped API entry points

**Files:** Create `src/types/common.ts`, `src/lib/api/{contracts,errors,config,client,server,keys}.ts`, `src/lib/api/adapters/{mock,django}.ts`, `src/lib/server/api-registry.ts`, `src/app/api/v1/[...path]/route.ts`, `src/data/fixtures/{index,animals,hordes,users,posts,fundraisers,missions,shelters,events}.ts`, domain `types.ts`/`schemas.ts` under `src/features/{auth,media,animals,community,follows,users,notifications,moderation,sightings,discovery,hordes,search,adoption,fundraising,missions,kibble,shelters,events}/`, and `tests/unit/api/{contracts,fixtures,projection,registry}.test.ts`.

**Interfaces:** Produce `PawTrailApi` exactly as spec §5; `getServerApi(): Promise<PawTrailApi>`; `getBrowserApi(): PawTrailApi`; `queryKeys(scope: string): QueryKeyFactory`; `ApiError`; `toPublicAnimal(record: AnimalRecord): AnimalProfile`. `dispatchApi(request: Request, context: ApiContext): Promise<Response>` maps allowlisted method/path patterns. Domain methods with no implementation yet fail explicitly rather than return success.

- [x] Write tests asserting fixture counts `[20,5,15,10,10,10,5,5,20]` for animals/Hordes/adoptable subset/fundraisers/missions/posts/shelters/events/leaderboard users; every relation resolves. Add assertions that malicious private fields are absent from `toPublicAnimal`, limits default to 12/cap at 50, malformed records throw `ApiError`, unknown BFF paths return 404, wrong methods 405, and real mode without an origin fails rather than selecting mocks.

```ts
it('preserves_sample_counts_and_public_projection', () => {
  expect(seed.animals).toHaveLength(20)
  expect(seed.animals.filter(animal => animal.adoptable)).toHaveLength(15)
  expect(toPublicAnimal(privateAnimal)).not.toHaveProperty('exactLatitude')
})
```
- [x] Run `npm run test:unit -- tests/unit/api`; expect missing contracts/fixtures/projection/registry failures.
- [x] Implement schemas and deterministic fixtures using the clock in spec §10, domain API signatures, public projections, request cancellation, error normalization, and query-key scoping. Add public sample provenance fields, supporting activity records and representative error/empty fixtures. Define only explicit BFF handlers, without a general URL proxy. I1 completes the Django adapter implementation.
- [x] Run the same API tests, typecheck, UI check; expect pass.
- [x] Commit `feat: define PawTrail domain API and sample records`.

### Task F3: Persistent, session-isolated demo repository

**Files:** Create `src/lib/server/demo/{repository,session,clock,transactions,migrations}.ts`, `tests/unit/demo/{persistence,isolation,concurrency,migrations}.test.ts`. Modify mock adapter and BFF registry.

**Interfaces:** Produce `openDemoRepository(sessionId: string, dataDir: string): Promise<DemoRepository>`; `DemoRepository.read<T>(query: DemoQuery<T>): Promise<T>` and `transact<T>(command: DemoCommand<T>): Promise<T>`; `resolveDemoContext(request: Request): Promise<ApiContext>`; `resetDemoSession(sessionId: string): Promise<void>`; `Clock.now(): Date`. The repository is server-only and used identically by RSC reads and BFF reads.

- [x] Write tests that persist a new sample post, reopen the repository and read the same ID; a second session sees no post; two concurrent idempotent commands produce one record; failed transactions leave the old file valid; reset affects only the current session; old schemas return a recoverable reset state. IDs/path traversal cannot escape the configured data directory.

```ts
it('persists_one_mutation_without_cross_session_visibility', async () => {
  expect(await reopened.read(postById(created.id))).toMatchObject({ id: created.id })
  expect(await otherSession.read(postById(created.id))).toBeNull()
  expect(await countRowsWithIdempotencyKey(key)).toBe(1)
})
```
- [x] Run `npm run test:unit -- tests/unit/demo`; expect failures for missing persistence/session behavior.
- [x] Implement atomic file replacement and one-process transaction serialization, random session cookies, base-fixture overlays, versioning, frozen demo clock, and initialization/reset handlers with same-origin checks. Do not write cookies during Server Component render; establish sessions through route handlers. Public fixture-only reads need no cookie. Document the writable-disk/single-process boundary.
- [x] Re-run demo/API tests and typecheck; expect pass.
- [x] Commit `feat: persist isolated PawTrail demo sessions`.

### Task F4: Authentication, permissions, protected routes, and cache lifecycle

**Files:** Modify F2's `src/features/auth/{schemas,types}.ts`; create `src/features/auth/{session-provider,login-form,register-form,require-session}.tsx`, `src/lib/server/{auth,permissions,csrf}.ts`, `src/app/(auth)/{login,register}/page.tsx`, `src/app/(dashboard)/dashboard/layout.tsx`, `src/components/providers.tsx`, `tests/unit/auth/{permissions,session,csrf,forms,query-isolation}.test.tsx`. Modify API auth handlers.

**Interfaces:** Produce `requireActor(context: ApiContext): Actor`, `can(actor: Actor, action: Permission, resource?: OwnedResource): boolean`, `validateReturnPath(input: string | null): string`, and spec §5 `auth` methods. Return-path validation falls back to `/community` and allows local application paths only. `Session` exposes a sanitized actor, roles, demo flag, and non-secret cache scope, never tokens. Roles are member, shelter/rescuer staff, and moderator; organization membership scopes management actions.

- [ ] Test anonymous protected action → login with a validated local return path; reject external return URLs; member cannot view another applicant's data or manage another shelter; moderator approval requires server permission; demo actor selection is disabled in real mode; cross-origin mutation is denied; logout/actor switch clears cached private records. Add expired-token tests: one serialized refresh/replay, then logout on failure, never an infinite loop.

```ts
it('denies_cross_scope_access_and_stale_credentials', async () => {
  expect(can(member, 'review_application', otherShelterApplication)).toBe(false)
  expect(validateReturnPath('https://external.example')).toBe('/community')
  expect(refreshCallsAfterConcurrentFailures).toBe(1)
  expect(privateQueriesAfterLogout).toEqual([])
})
```
- [ ] Run `npm run test:unit -- tests/unit/auth`; expect missing guard/session/CSRF failures.
- [ ] Implement mock personas, demo registration/login feedback, real-mode form contracts, server guards, query providers/hydration, cookie-only credential handling, accessible form errors and return navigation. Do not persist submitted passwords in demo storage or logs. Refresh mechanics use controlled adapter fixtures until I1 integration.
- [ ] Run auth/API/demo tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: add session and role-aware PawTrail access`.

### Task F5: Media upload, preview, and protected evidence delivery

**Files:** Modify F2's `src/features/media/{schemas,types}.ts`; create `src/features/media/{upload-field,preview-list}.tsx`, `src/lib/server/media/{storage,validation,delivery}.ts`, `src/components/shared/animal-image.tsx`, `tests/unit/media/{validation,access,preview,cleanup}.test.tsx`. Add explicit upload/private-download API routes through the registry.

**Interfaces:** Produce `media.upload(MediaUpload): Promise<MediaAsset>`; `MediaAsset = { id: Id, url: string, alt: string, visibility: 'public' | 'private', mimeType: string, bytes: number }`; `validateUpload(file: UploadCandidate, purpose: MediaPurpose): ValidatedUpload`. API payloads reference media IDs, not user-supplied filesystem paths.

- [ ] Test allowed JPEG/PNG/WebP content against signature and MIME; reject SVG, executable/disguised content, files over 10 MiB, more than 6 attachments, and unauthorized private reads. Image previews create/revoke object URLs on removal/unmount; failed uploads preserve the form; a publicly rendered record never contains private evidence URLs.

```ts
it('rejects_unsafe_media_and_private_access', async () => {
  expect(() => validateUpload(disguisedExecutable, 'photo')).toThrow()
  await expect(readEvidenceAsOtherActor()).rejects.toMatchObject({ status: 404 })
  expect(revokedPreviewUrls).toEqual(createdPreviewUrls)
})
```
- [ ] Run `npm run test:unit -- tests/unit/media`; expect missing validation/storage/preview failures.
- [ ] Implement image inputs/previews/alt fields, bounded image validation, PDF evidence accepted only as private document uploads (10 MiB maximum), randomized filenames, owner/organization authorization, safe content disposition, and clean removal of abandoned uploads. Public approved media is promoted explicitly. Keep files outside `public/` until approved, exclude private documents from Next image optimization, and use an accessible image fallback.
- [ ] Run media/auth tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: support safe demo media and evidence uploads`.

### Task F6: Design contract, shared controls, and responsive navigation

**Files:** Create `DESIGN.md`, `.impeccable/surfaces/{marketing,community,discovery,adoption,fundraising,dashboard}.md`, `src/components/ui/*` (only required Shadcn primitives), `src/components/ui/{button-link,button-anchor}.tsx`, `src/components/layout/{header,mobile-nav,create-menu,dashboard-nav}.tsx`, `src/components/shared/{demo-banner,data-state,money,status-badge,confirm-dialog}.tsx`, `src/stores/ui.ts`, `tests/unit/layout/{navigation,create-menu,states}.test.tsx`, `tests/unit/design/contrast.test.ts`.

**Interfaces:** Produce `AppShell({children})`, `ButtonLink({href,children,...buttonProps})`, `ButtonAnchor({href,children,...buttonProps})`, `DataState({state,retry,emptyAction,children})`, and `formatPHP(amount: MoneyMinor): string`. State names are loading/empty/error/ready; notices use an accessible Sonner live region.

- [ ] Complete the Impeccable direction workflow before UI edits, preserve pinned branding, and record the selected world/surface contracts. Respect its comp/code preference workflow and launcher-unavailable fallback. No visual verification is implied by this task.
- [ ] Add failing component tests for all desktop destinations, mobile Explore/Adopt/Create/Community/Profile order, keyboard-operated Create/dropdown/drawer, authenticated redirects, unread count, Kibble balance, focus restoration, visible sample labeling, and accessible contrast-safe action colors. Every Create action maps to the spec route inventory; unfinished destinations are not exposed as working links until implemented.

```ts
it('keeps_create_navigation_keyboard_accessible', async () => {
  await user.keyboard('{Enter}')
  expect(screen.getByRole('menuitem', { name: 'Create Community Post' })).toBeVisible()
  expect(mobileItemLabels).toEqual(['Explore', 'Adopt', 'Create', 'Community', 'Profile'])
  expect(actionTextContrast).toBeGreaterThanOrEqual(4.5)
})
```
- [ ] Run `npm run test:unit -- tests/unit/layout tests/unit/design`; expect missing shell/control behavior.
- [ ] Read craft-floor, implement canonical Shadcn controls, typography/tokens, header/mobile/drawer/dashboard shells, create-menu auth checks, data states, accessible money/status components, and reduced-motion behavior. Keep Zustand free of fetched records and private form answers.
- [ ] Run these tests, typecheck, UI check, changed-file format check; expect pass.
- [ ] Commit `feat: establish PawTrail design system and navigation`.

### Task F7: Landing page and real asset provenance

**Files:** Create `src/app/(marketing)/page.tsx`, `src/features/marketing/{hero,discovery-preview,adoption-preview,campaign-preview,community-preview}.tsx`, `src/components/illustrations/*`, `public/images/pets/*`, `public/fonts/*`, `docs/assets/credits.md`, `tests/unit/marketing/landing.test.tsx`.

**Interfaces:** Consume fixture/API summaries, shared shell, image/money components. Produce `LandingPage` and `getCommunitySampleStats(): Promise<CommunitySampleStats>` with documented fixture-derived definitions; real mode later uses backend summaries rather than summing one paginated result page.

- [ ] Test “Every Paw Has a Story.”, Explore the Map → `/explore`, Find Your Companion → `/adopt`, four explicitly sample-labeled statistics, discovery/adoption/fundraising/PawPal/story sections, descriptive image alt text, and real destination URLs. Empty/failure previews retain usable CTAs.

```ts
it('introduces_every_core_action_with_honest_sample_stats', () => {
  expect(screen.getByRole('link', { name: 'Explore the Map' })).toHaveAttribute('href', '/explore')
  expect(screen.getByRole('link', { name: 'Find Your Companion' })).toHaveAttribute('href', '/adopt')
  expect(sampleStatisticLabels).toHaveLength(4)
})
```
- [ ] Run `npm run test:unit -- tests/unit/marketing/landing.test.tsx`; expect missing page behavior.
- [ ] Implement all brief landing sections, original/approved doodles, licensed local pet photographs, self-hosted fonts, attribution records, reserved image dimensions, and data-state handling. Do not invent testimonials, adoption counts, or actual fund transfers. A recognizable cat/dog/paw-marker brand mark is an implementation asset, with review status recorded.
- [ ] Run landing tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: introduce PawTrail with a complete landing page`.

## Package acceptance

- [ ] A fresh local setup can run the shell/landing in Next dev without a Maps credential.
- [ ] Server/client API tests read identical sample data and isolated persistent mutations.
- [ ] Roles, CSRF, cache clearing, upload authorization, and UI boundaries pass automated tests.
- [ ] No production build or unrequested visual/manual verification was performed.
