# PawTrail architecture and product specification

Date: 2026-11-02, Asia/Manila. Status: planning baseline for user review; application implementation has not started.

## 1. Authority and intended outcome

The [original brief](../../requirements/pawtrail-original-brief.txt) defines the required feature set and stack. The user's emphasis is social media for pets. This specification makes that emphasis concrete: `/` introduces PawTrail; `/community` is the main signed-in destination; public animal profiles link all welfare workflows. Existing brief features are retained, although social functionality is implemented before map, adoption, and fundraising packages.

Proposed social additions are following users and pets, a Following feed, post reactions, saved posts, and activity notifications. These are planning decisions, not claims that the attachment already specified them. Direct messages, live chat, video processing, production payment processing, and a production Django implementation are outside this frontend delivery. The plan includes a tested Django adapter and integration documentation, not an unverified claim of a working backend.

## 2. Delivery architecture

One Next.js App Router project at the repository root. Functional React, strict TypeScript, Tailwind, Shadcn, Lucide, TanStack Query, Zustand, React Hook Form/Zod, Motion, and Recharts. Use `@vis.gl/react-google-maps` with `@googlemaps/markerclusterer`. Resolve compatible stable package releases and the supported Node LTS at implementation time, record them in `package.json`, `.nvmrc`, and the lockfile; do not install or pin dependencies during planning.

Public route pages are Server Components. Feed controls, composers, map canvas, swipe controls, and forms are client islands. Metadata and public profile text must not depend on a client-only map. The whole animal page must never receive `use client` merely to support its action bar. [Next.js metadata documentation](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) supports this server boundary.

Server Components call request-scoped `getServerApi(): Promise<PawTrailApi>`. Client components call `getBrowserApi(): PawTrailApi`, which uses same-origin `/api/v1` route handlers. Those handlers are an explicit, allowlisted backend-for-frontend (BFF); no arbitrary URL proxy. Both paths select the same domain adapter and public/private projections. Server code does not make HTTP calls back to its own origin.

TanStack Query owns remote records, pagination, and mutations; Zustand owns only UI state such as selected marker and list width. Filters and durable tabs are URL-backed. Create a QueryClient per server request and a browser provider per session; never share an authenticated server QueryClient globally. Query keys include a non-secret viewer cache scope and serialized filters. Logout and actor switches clear the query cache. This follows the isolation and hydration concerns in [TanStack's App Router guidance](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr).

## 3. Mock persistence and deployment boundary

Default mode: `NEXT_PUBLIC_USE_MOCK_API=true`. Fixtures are deterministic and versioned. Mutations go to a server-only local demo repository, scoped by an unguessable HttpOnly demo-session cookie. Store overlays in ignored `.pawtrail/demo/` JSON files using serialized transactions and atomic rename. The initial supported demo host is one local Node process with writable disk. This is not suitable for stateless/multi-instance hosting; such hosting requires Django or a replacement shared demo repository.

The initial anonymous request can render base fixtures without creating a session. A same-origin initialization/login endpoint establishes a session before mutations. New demo content, role selection, and resets apply only to that demo session; other browsers see their own overlays or base fixtures. Both server-rendered detail reads and browser requests use the same overlay. After refresh, newly created detail routes must still resolve in the creator's session. Explain this behavior in the demo banner/help. All mock public pages are `noindex`; fixture activity is never presented as a real community record.

Persist server state, not private payloads in localStorage. Client drafts may use sessionStorage only for non-sensitive text and must be cleared on logout/reset. Adoption answers and evidence documents remain server-side. An environment-gated reset restores only the current demo session. Schema versions trigger a recoverable reset prompt, never silent deletion or cross-session fallback. Do not cache authenticated or demo-overlay reads in a shared Next data cache.

In real mode, the BFF calls the configured Django origin. Access/refresh tokens remain in server-managed HttpOnly session storage; never expose JWTs in `NEXT_PUBLIC_*`, browser storage, or serialized React props. Serialize refresh and replay a failed request at most once. Mutating requests require same-origin/CSRF validation. Enforce permissions in server services and rely on Django authorization as final authority. Demo actor endpoints are disabled in real mode. Private routes and queries are `no-store`; genuinely public, context-free real records may revalidate after 60 seconds. Invalidate affected public paths after successful mutations.

## 4. Shared types and invariants

Core types in `src/types/common.ts`: `Id = string`, `ISODateTime = string`, `MoneyMinor = number` (safe integer centavos), `EntityKind = 'animal' | 'horde' | 'fundraiser' | 'mission' | 'event' | 'user' | 'shelter' | 'post'`, `ResourceRef = { kind: EntityKind, id: Id }`, `Page<T> = { items: T[], count: number, nextCursor: string | null }`, `ListQuery = { q?: string, cursor?: string, limit?: number }`, `ModerationState = 'pending' | 'published' | 'rejected' | 'removed'`.

Every domain owns its Zod schemas and inferred TypeScript DTOs in `src/features/<domain>/schemas.ts` and `types.ts`. The API boundary validates external data. Public DTOs are explicit allowlists; never strip a few fields from a private object and assume the remainder is safe. IDs are stable, slugs are unique, timestamps use ISO offsets, images include meaningful alt text, and records identify fixture/demo provenance.

Money stays in centavos. Parse decimal input strictly with at most two decimal places, reject negative/NaN/infinite/unsafe integer amounts, and format with PHP/en-PH. Campaign goals are positive; donation demos are at least ₱1.00. Donation presets are ₱100/₱250/₱500/₱1,000. Repeated submissions use idempotency keys. Demo contributions are a separate illustrative ledger, not financial receipts or actual payments. Recorded expense history is append-only with correcting entries; financial totals derive from ledger entries.

Public animal/sighting locations are neighborhood centroids with an approximate radius of at least 500 m. Exact submitted coordinates live only in a private sighting DTO. Do not send exact locations to a public map then hide them with CSS. Geolocation is user-initiated; use it in memory for nearby queries. Public event venues may be exact when intentionally published by the organizer; animal homes remain private. Sensitive media is gated behind a warning; private evidence has authorized download handlers, not public static URLs.

Default pagination: 12 records, maximum 50. Stable order uses timestamp plus ID as tie-breaker. Empty pages, invalid cursors, denied permissions, missing records, timeouts, cancellation, and malformed responses have explicit error handling. `ApiError` has `code`, `message`, `status`, `fieldErrors?`, `requestId?`; never expose raw upstream error bodies.

Default discovery decisions: “Nearby” uses a user-selected area or consented current position with a 5 km radius; “Recently Seen” means an approved sighting within the preceding 24 hours on the injected clock. “Nearly Funded” means at least 80% and below 100% of the goal on an active campaign. Urgency order is critical/high/normal, then newest timestamp/ID. “Most Recent” is descending createdAt/ID. These are initial product settings, not claims from the original brief. Allow users to change area/radius explicitly.

## 5. API contracts and ownership

All methods return promises. Domain type names below are defined by the package that owns them; shared names are from section 4. `RequestOptions = { signal?: AbortSignal, idempotencyKey?: string }` is the final optional argument on mutation/request methods. Filters extend `ListQuery` where pagination applies. `void` mutations still return an HTTP 204 or equivalent adapter result consistently.

| Domain | Public interface on `PawTrailApi` | Owning task |
| --- | --- | --- |
| auth | `session(): Session`; `login(input: LoginInput): Session`; `register(input: RegisterInput): Session`; `logout(): void`; `selectDemoActor(actorId: Id): Session` | F4 |
| media | `upload(input: MediaUpload): MediaAsset`; `remove(id: Id): void` | F5 |
| animals | `list(filters: AnimalFilters): Page<AnimalSummary>`; `get(slug: string): AnimalProfile`; `report(input: AnimalReportInput): AnimalProfile`; `update(id: Id, input: AnimalUpdateInput): AnimalProfile`; `setSaved(id: Id, saved: boolean): void` | F2 contracts, S1/D3 implementation |
| community | `list(filters: PostFilters): Page<Post>`; `get(id: Id): Post`; `create(input: PostInput): Post`; `update(id: Id, input: PostInput): Post`; `remove(id: Id): void`; `setReaction(id: Id, active: boolean): Post`; `setSaved(id: Id, saved: boolean): void`; `comments(ref: ResourceRef, query: ListQuery): Page<Comment>`; `comment(ref: ResourceRef, input: CommentInput): Comment` | S2/S3 |
| follows | `set(ref: ResourceRef, active: boolean): void`; `list(query: FollowFilters): Page<Follow>` | S4 |
| users | `get(username: string): PublicUser`; `update(input: ProfileInput): PrivateUser`; `settings(): PrivacySettings`; `updateSettings(input: PrivacySettings): PrivacySettings`; `summary(): DashboardSummary` | S4/S5 |
| notifications | `list(query: ListQuery): Page<Notification>`; `markRead(ids: Id[]): void`; `unreadCount(): number` | S4 |
| moderation | `report(input: ReportInput): Report`; `queue(filters: ModerationFilters): Page<ModerationItem>`; `review(input: ModerationDecision): ModerationItem` | S3 |
| sightings | `list(filters: SightingFilters): Page<Sighting>`; `create(input: SightingInput): Sighting` | D3 |
| discovery | `searchAreas(q: string): GeoArea[]`; `nearby(input: DiscoveryQuery): DiscoveryResult` | D1/D2 |
| hordes | `list(filters: ListQuery): Page<HordeSummary>`; `get(slug: string): HordeProfile` | D4 |
| search | `query(input: SearchQuery): SearchResults` | D5 |
| adoption | `preferences(): AdoptionPreferences`; `savePreferences(input: AdoptionPreferences): AdoptionPreferences`; `discover(filters: AdoptionFilters): Page<AdoptionCandidate>`; `setInterest(animalId: Id, interested: boolean): void`; `interested(query: ListQuery): Page<AdoptionCandidate>`; `saveDraft(input: AdoptionApplicationDraft): AdoptionApplicationDraft`; `apply(input: AdoptionApplicationInput): AdoptionApplication`; `applications(filters: ApplicationFilters): Page<AdoptionApplicationSummary>`; `application(id: Id): AdoptionApplication`; `withdraw(id: Id): AdoptionApplication`; `resubmit(id: Id, input: AdoptionApplicationInput): AdoptionApplication`; `review(id: Id, input: ApplicationReviewInput): AdoptionApplication` | A1–A4 |
| fundraisers | `list(filters: CampaignFilters): Page<CampaignSummary>`; `get(slug: string): CampaignDetail`; `drafts(query: ListQuery): Page<CampaignDraftSummary>`; `draft(id: Id): CampaignDraft`; `saveDraft(input: CampaignDraft): CampaignDraft`; `create(input: CampaignInput): CampaignDetail`; `update(id: Id, input: CampaignUpdateInput): CampaignDetail`; `addUpdate(id: Id, input: CampaignStoryUpdateInput): CampaignStoryUpdate`; `addExpense(id: Id, input: ExpenseInput): ExpenseEntry`; `close(id: Id): CampaignDetail`; `simulateDonation(id: Id, input: DemoDonationInput): DemoContribution`; `supporters(id: Id, query: ListQuery): Page<PublicSupporter>`; `dashboard(): FundraisingDashboard` | R1–R4 |
| missions | `list(filters: MissionFilters): Page<MissionSummary>`; `get(slug: string): MissionDetail`; `create(input: MissionInput): MissionDetail`; `participations(filters: ParticipationFilters): Page<MissionParticipation>`; `accept(missionId: Id): MissionParticipation`; `submit(participationId: Id, input: MissionEvidenceInput): MissionParticipation`; `review(participationId: Id, input: MissionReviewInput): MissionParticipation` | W1 |
| kibble | `wallet(): KibbleWallet`; `transactions(query: ListQuery): Page<KibbleEntry>`; `leaderboard(period: 'month' \| 'all', query: ListQuery): Page<LeaderboardEntry>` | W2 |
| shelters | `list(filters: ListQuery): Page<ShelterSummary>`; `get(slug: string): ShelterProfile`; `dashboard(id: Id): ShelterDashboard` | W3 |
| events | `list(filters: EventFilters): Page<EventSummary>`; `get(slug: string): EventDetail`; `create(input: EventInput): EventDetail`; `update(id: Id, input: EventInput): EventDetail`; `setRsvp(id: Id, attending: boolean): EventDetail` | W4 |

Nonproduction demo lifecycle is separate from `PawTrailApi`: private BFF `POST /demo/session` initializes an isolated overlay and `POST /demo/reset` resets that overlay. Both are disabled in real mode. Draft application IDs appear in private application summaries, and `adoption.application(id)` returns the actor-owned draft for resume; campaign drafts use separate owner-only methods so their private evidence never enters `CampaignDetail`. `EventInput` accepts scheduled/cancelled state, enabling W4 cancellation via `events.update` without an undefined API method. All user content is plain text rendered with React escaping; no raw HTML execution or unsanitized rich-text path is introduced.

F2 defines signatures and schemas sufficient to implement subsequent packages, but it does not create fake success implementations for unfinished features. A not-yet-implemented adapter method throws a typed `NOT_IMPLEMENTED` error and is not exposed as a working UI control before its owning task lands. I1 finalizes the proposed Django endpoint mapping, DTO serialization, pagination normalization, and conformance suite. These endpoints are a proposed contract until accepted by backend engineers.

## 6. Feature behavior and states

Social: feed tabs For you / Following / Nearby, seven source content types from the brief, paging, pet/group/help links, image composer, edit/delete ownership, comments, share, report, reactions, and saving. “For you” initially means chronological public posts; it must not imply a trained recommendation model. New ordinary-user content enters pending review and appears to its author with a clear status. Published content is public; removed/rejected content cannot be retrieved through direct public IDs. Moderation changes produce in-app notifications. Sharing falls back from Web Share to clipboard to a selectable link.

Animal profiles: identity, species, age/gender, neighborhood, status, verification provenance, photograph gallery, appearance, condition, personality, behavior, characteristics, badges, activity, time-filtered sighting map, help links, wall of helpers with anonymity, discussion, and sticky actions. Descriptions distinguish observation from diagnosis. Basic pet records can be reported by members; edits to managed records require the responsible owner/shelter. Community corrections use reports/review. No private applicant data appears here.

Discovery: map/list synchronization, accessible selection, cluster/marker differences for species/Hordes/urgent missions/fundraisers/events, geography search, explicit “Search this area,” zoom controls, user-initiated nearby search, collapsed/resizable desktop list, mobile draggable sheet plus open/close controls. Google supplies geography visualization only; PawTrail supplies records and bounds filtering. Without a key, blocked script, failed load, denied geolocation, or quota error, keep a usable list and an honest map-unavailable message. Never render a fabricated map as Google Maps. Marker clustering follows the [vis.gl example](https://visgl.github.io/react-google-maps/examples/marker-clustering).

Adoption: pass/right-interest/up-profile gestures with equivalent buttons. Interested never means approved. Preferences use six illustrative weights: species 20, home 20, lifestyle 20, experience 15, other pets 15, distance 10. Missing/unanswered dimensions are excluded and the remaining weights renormalized; if all are absent, show no numerical score. Hard incompatibilities produce a clear advisory, not a guaranteed welfare judgment. Explain scores and keep deterministic evidence for each component. Applications have draft/submitted/needs_information/approved/rejected/withdrawn states; approved means permitted next steps, not finalized adoption. Only applicant and responsible shelter staff can view answers. Multi-step forms collect basic identity/contact, animal, living situation, care experience, motivation, and agreement. Sensitive drafts stay in the server session.

The exact initial scoring matrix and examples are in [adoption-compatibility.md](../../contracts/adoption-compatibility.md). A valid application input may include an actor-owned `draftId`; submission updates that draft in place, rather than producing a second application ID. Campaign creation likewise accepts an actor-owned `draftId` and expected version.

Fundraising: medical/food/rescue/shelter/community categories; urgency, nearly funded, new, nearby, completed filters; stable sorting; story, gallery, organizer, provenance, updates, target, supporters, expenses, balance, and payout-status disclosure. Campaign states draft/pending_review/active/completed/closed/rejected; publication review does not automatically confer verification. Simulated donations are possible only in mock mode and on active demo campaigns. UI says “Demo contribution recorded — no money was transferred.” Presets, strict custom amount, message, anonymity, summary, and confirmation are required. Real-mode payment controls remain disabled until a separately authorized payment integration exists.

Funding progress and campaign lifecycle are distinct: reaching the goal derives a fully-funded label but does not itself close the campaign. `close(id)` explicitly closes support; a campaign at/above its goal becomes completed, otherwise closed. The operation and totals are audited. Publication decisions and verification decisions have distinct moderator permissions: verification/revocation requires evidence references and a reason, and cannot be performed by the record's creator. In demo mode verification remains explicitly illustrative.

Missions: open → accepted → submitted → approved/rejected; rejected evidence may be resubmitted before the deadline. Store participation separately from the mission so multiple volunteers cannot overwrite each other. Kibble is appended once per approved contribution, keyed by contribution ID; acceptance/submission alone never awards it. A “Create Quest” action creates a mission with `kind: 'quest'`, reusing this evidence/review flow; there is no second quest economy. Animal naming awards in the wallet are sample ledger entries, not a separate unrequested naming contest feature.

Groups, organizations, events: Hordes link member animals, shared sightings/feeding/help and contributors. Shelters publish managed animals, fundraisers, events, and community updates; their dashboard links application, animal, mission, fundraiser, event, and volunteer management. Events support filters, public venue/schedule, attendance, and idempotent RSVP. Closed/full/past events cannot accept new RSVPs; repeat RSVP does not inflate counts. Public profile privacy controls cover voluntary location, contribution visibility, and profile discoverability. Private dashboards cover every destination listed in the brief, plus saved posts/animals and notifications.

## 7. Route inventory

All route paths below map to `src/app`; parentheses designate groups and never appear in URLs. Static `create`, `preferences`, and `interested` routes take precedence over dynamic slugs. Each data-heavy route group has `loading.tsx` and `error.tsx`; record detail routes call `notFound()` for absent/inaccessible public records without leaking their existence.

| Group | Routes | Delivery |
| --- | --- | --- |
| Marketing | `/` | F7 |
| Auth | `/login`, `/register` | F4 |
| Community | `/community`, `/community/[id]`, `/community/create`, `/users/[username]` | S2–S4 |
| Animals | `/pets/[slug]`, `/animals/report`, `/sightings/create` | S1/D3 |
| Discovery | `/explore`, `/hordes`, `/hordes/[slug]`, `/search` | D1–D5 |
| Adoption | `/adopt`, `/adopt/preferences`, `/adopt/interested`, `/adopt/applications`, `/adopt/applications/new`, `/adopt/applications/[id]` | A1–A4 |
| Fundraising | `/fundraisers`, `/fundraisers/[slug]`, `/fundraisers/create`, `/dashboard/fundraisers`, `/dashboard/fundraisers/[id]` | R1–R4 |
| Help | `/missions`, `/missions/[slug]`, `/missions/create`, `/dashboard/missions`, `/leaderboard`, `/dashboard/kibble` | W1/W2 |
| Organizations | `/shelters`, `/shelters/[slug]`, `/dashboard/shelter`, `/dashboard/shelter/applications`, `/dashboard/shelter/applications/[id]` | W3/A4 |
| Events | `/events`, `/events/[slug]`, `/dashboard/events`, `/dashboard/events/create`, `/dashboard/events/[id]/edit` | W4 |
| Account | `/dashboard`, `/dashboard/profile`, `/dashboard/animals`, `/dashboard/animals/[id]/edit`, `/dashboard/sightings`, `/dashboard/adoptions`, `/dashboard/saved`, `/dashboard/notifications`, `/dashboard/settings` | S4/S5, populated by owning packages |
| Moderation | `/dashboard/moderation` | S3 |
| Technical | `/api/v1/[...path]`, `/sitemap.xml`, `/robots.txt`, public OG images, 404 | F2/S1/I1 |

The top navigation retains Explore, Adopt, Fundraisers, Missions, Community, and Leaderboard, plus search, notifications, balance, Create, avatar. The signed-in logo/home action and post-login destination lead to Community. Mobile navigation remains Explore/Adopt/Create/Community/Profile, with extra routes in a drawer. Create contains Report Animal, Create Sighting, Start Fundraiser, Create Community Post, Create Quest. Do not ship dead links while dependent routes are unfinished; the final release exposes all entries.

## 8. SEO, privacy, and public caching

Use dynamic metadata, absolute canonical URLs from configured site origin, OG/Twitter cards, alt text, semantic headings, sitemap, robots, and proper 404s. Public profiles for animals, Hordes, shelters, events, fundraisers, and discoverable users are server-rendered. Use `WebPage` with a `Thing` main entity for an animal, `BreadcrumbList`, `Organization` for shelters, and `Event` for events when truthful. Do not invent an `Animal` schema type or pet-specific properties. [WebPage](https://schema.org/WebPage) and [Thing](https://schema.org/Thing) document these generic types. Escape JSON-LD against script termination; exclude private locations and documents from all metadata and images.

Mock mode: robots disallow indexing; each sample page has noindex metadata and sitemap is empty. Real mode: include only published, public, canonical records; private dashboards, auth, applications, drafts, and moderation never enter the sitemap. Paginated sitemap discovery must not silently stop at the first API page. Do not claim search visibility or rich-result eligibility merely because metadata exists.

## 9. Design and content commitments

Preserve the brief palette exactly: primary `#F97316`, primary dark `#EA580C`, teal `#0F766E`, green `#84CC16`, cream `#FFFBF5`, white `#FFFFFF`, text `#3B2416`, muted `#78716C`, border `#EDE5D8`. Orange remains a brand token; accessible action/foreground pairings may use darker combinations verified by contrast checks. Nunito headings and Inter body text, self-hosted licensed fonts, restrained motion, warm borders, real pet photographs, flat doodles. No finished logo or photo assets were supplied; record original/stock asset provenance and descriptive alt text, never invent testimonials or real rescues.

Before UI implementation, complete Impeccable's product/direction workflow within these pinned commitments and record `DESIGN.md` plus surface briefs for marketing (Persuade) and app flows (Operate). The current plan does not preselect an unreviewed visual composition or write a standing comp/code preference on the user's behalf. Read craft-floor immediately before UI edits. Component primitives live only in `src/components/ui`; use Shadcn controls and ButtonLink/ButtonAnchor wrappers. Keyboard alternatives are mandatory for swiping, dragging, uploading, and map/list selection. Include skeleton, empty, validation, permission, upload, offline/error, optimistic rollback, and completion states.

## 10. Fixtures and test boundaries

Seed exactly 20 animals including 15 adoptable animals, 5 Hordes, 10 fundraisers, 10 missions, 10 posts, 5 shelters, 5 events, and 20 leaderboard users; fixture relationships must resolve. Use a clock abstraction with demo reference `2026-11-02T00:00:00+08:00` so event/deadline and monthly leaderboard tests remain deterministic. Real mode uses current time. State-generated records may increase these counts after mutations.

Default verification is Vitest, React Testing Library, Node request/response tests, automated HTTP probes against `next dev`, TypeScript checks, format checks, and a TypeScript-AST UI boundary check. `npm run check:ui` is mandatory after frontend changes. No production build, screenshot, browser visual inspection, or manual check is authorized by this planning request. Automated tests cover behavior and privacy; they do not establish visual quality. If visual review is later requested, apply Impeccable's bounded desktop/mobile pass and at most one confirmation pass.

## 11. Open integration decisions and completion

No ambiguity blocks the mock frontend plan. Backend endpoint naming, production hosting/storage, real authentication provisioning, real payment provider, external notifications, final logo, and real operational content need owners before production integration. The plan supplies proposed contracts and explicit disabled/unavailable states where external services are absent. Google Maps requires a restricted browser key, enabled services, and map ID; without them the list remains functional, but live map integration cannot be claimed verified.

The frontend is complete when all seven work packages' acceptance criteria pass, every route/control in scope works with sample data, privacy/state transitions are tested, setup is reproducible, and external verification limits are recorded. Production launch requires the separate backend, secrets, hosting, and operational decisions above.
