# PawTrail

![PawTrail logo](public/images/pawtrail/brand-mark.webp)

Every Paw Has a Story. Photograph neighborhood animals, connect familiar faces to real identities, and bring their stories together with nearby care, responsible adoption and community support.

## Real camera encounters

Open `/spot` to photograph a cat or dog, record an optional private location, compare existing real animal identities, or create a provisional record. `/spot/history` resumes saved encounters. Authorized independent reviewers use `/spot/review` to confirm identities, assess encounter evidence and curate reference photos.

The real Django backend is in [`backend/`](backend/README.md). Local CPU inference uses pinned DETR and DINOv2 ONNX models. Strong matches can be automatically accepted under an enabled, evaluated policy; uncertain matches remain reviewable. No calibrated policy is seeded, and no recognition accuracy is claimed. Accepted encounters now earn real, non-cash Kibble through an authoritative append-only ledger: 10 per animal per contributor per Manila day, up to 100 sighting Kibble daily. Withdrawn credit is reversed rather than deleted. View `/spot/kibble`; reviewers manage readiness and calibration at `/spot/setup`. See [automatic setup and reward policy](docs/implementation/automatic-identification-rewards.md).

The live platform now uses database records only. Runtime sample content and demo housing profiles have been removed. Generated illustrations are display fallbacks, never identification evidence; game-local rewards remain separate. See the [capture API contract](docs/contracts/capture-identification.md) and [backend setup](backend/README.md). No automated tests or browser verification were run for this feature.

## Frontend requirements

Use actual **shadcn/ui components from the official registry**, installed through its CLI and maintained in `src/components/ui`. Hand-written lookalike primitives do not satisfy this requirement. Product-specific behavior composes the official components.

Use **Tailwind CSS first** for routine layout, spacing, typography, colors, borders, responsive behavior, and interaction states. Reserve `.css` for theme tokens, fonts, browser-specific rules, and genuinely complex animations or effects that are impractical to express clearly with utilities. Do not recreate ordinary page styling in separate stylesheets.

These rules apply across the social platform and management dashboard while preserving their distinct layouts. See [Design guidance](DESIGN.md) and the [official shadcn/Tailwind migration record](docs/implementation/shadcn-tailwind-migration.md).

Typography uses self-hosted **Saira Condensed** for primary headings and names, and **Instrument Sans** for secondary body text, controls and dialogue. The game uses the same pairing. Font sources, subsets and OFL licenses live in `public/fonts/pawtrail`; the shared declarations are in `src/styles/pawtrail-fonts.css`.

## Run locally

Use Node 24 from `.nvmrc`:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The default is `NEXT_PUBLIC_USE_MOCK_API=false` with `DJANGO_API_BASE_URL=http://127.0.0.1:8002/api/v1`; start the real backend and set a private `SESSION_SECRET` of at least 32 characters. Register a real account. The current worktree preview uses http://127.0.0.1:3000. Populate development records with `backend/.venv/bin/python backend/manage.py seed_community --skip-checks`. Fixture accounts and records live in the database with internal origin markers; recognition evidence and authoritative balances are not seeded.

## Implemented journeys

| Journey                                                                                                         | Entry points                                                                                    |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Community stories, photos, reactions, saving, following and comments                                            | `/community`, `/pets/[slug]`, `/users/[username]`                                               |
| Approximate geographic discovery, map/list fallback, sightings, Hordes and public search                        | `/explore`, `/animals/report`, `/sightings/create`, `/hordes`, `/search`                        |
| Optional compatibility, swipe/button discovery, interests, private drafts and adoption applications             | `/adopt`, `/adopt/preferences`, `/adopt/interested`, `/adopt/applications`                      |
| Reviewed campaigns, Horde beneficiaries, estimated budgets, simulated support, updates and transparent spending | `/fundraisers`, `/fundraisers/create`, `/dashboard/fundraisers`                                 |
| Evidence-reviewed missions, immutable earned/reversed non-cash rewards, wallet and leaderboard                  | `/missions`, `/dashboard/missions`, `/dashboard/kibble`, `/leaderboard`                         |
| Shelters, independent evidence review, events and transactional RSVPs                                           | `/shelters`, `/dashboard/shelter`, `/events`, `/dashboard/events`                               |
| Private activity, profile/privacy choices, organization application review and moderation                       | `/dashboard`, `/dashboard/settings`, `/dashboard/shelter/applications`, `/dashboard/moderation` |

Public stories render on the server. Maps, charts and gesture interactions are separate client islands. Private documents, exact sightings, applicant answers and drafts stay behind the service and BFF boundaries. Authentication, camera encounters, identity review, accepted sightings and Kibble use Django. Missions, adoption, fundraiser pledges/records, events, Hordes, shelters and leaderboard now use Django services and persisted fixtures. No real payments or accreditation are claimed.

## Delivery and validation status

The owner requested direct implementation without subagents and explicitly stopped automated testing. The remaining production workflows were implemented in the main session. No new automated tests, type/UI checks, builds, browser inspections or live backend conformance checks were run. Historical foundation/social test results do not certify the later tree. See `docs/implementation/native-delivery.md` and `docs/quality/verification-matrix.md`.

Google Maps needs a restricted browser key; lists work without one. Real mode needs a separately implemented matching Django backend and private session configuration. The real adapter has source implementation but no live conformance evidence. No real payment processing or external email/messages are included.

## Documentation

- [Setup and sample personas](docs/setup.md)
- [Architecture and privacy boundaries](docs/architecture.md)
- [Django integration contract](docs/backend-integration.md)
- [Demo limitations](docs/demo-limitations.md)
- [Native implementation record](docs/implementation/native-delivery.md)
- [Release checklist and explicitly optional checks](docs/quality/release-checklist.md)
- [Asset provenance](docs/assets/credits.md)

Existing validation commands remain available only on explicit request. CI has no push, pull-request or schedule trigger; its manual workflow also requires the validation flag. No deployment has been performed.

## Database social services

The [live services guide](docs/implementation/live-social-backends.md) documents migrations, the linked database fixtures, API permissions and workflow entry points. Full platform pages and game discovery now use these services. There are no repeated Sample tags.

Sign in at `/login` as `manager@pawtrail.local` or `reviewer@pawtrail.local`; private generated credentials are in `backend/.data/local-operator-access.txt`. Register a separate member account to try adoption applications and mission evidence. Fundraiser pledges do not take payment; actual collected funds require independent evidence review. No fixture-earned Kibble or leaderboard rank is fabricated.

No agents, automated tests, check commands, builds or browser verification were used for this delivery. Migrations and the fixture-population command were applied to the local database.


### Organization websites and Pixelcore Studio

Explore `/websites/templates`, then manage assigned shelter websites at `/dashboard/pages`. Three responsive designs open in the actual shared Pixelcore Studio editor. Drafts, revisions, uploaded images and published pages are stored by PawTrail’s Django backend; public websites live at `/sites/[shelter-slug]` alongside existing shelter profiles. Saira Condensed and Instrument Sans stay consistent with PawTrail. See [integration and verification limits](docs/implementation/organization-websites.md).

Local isolated landing API, sharing the platform database/auth/storage: `cd backend && uv run manage.py runserver 127.0.0.1:8003 --settings=landing_pages.local_settings --skip-checks`. Production uses the normal Django API and requires the shared Studio Python package dependency.


## Standalone game and asset authoring

The complete standalone game source, multiplayer Homes backend, asset catalogues,
authoring scripts and design notes are preserved in [standalone-game](standalone-game/README.md).
Its `public` directory shares this repository's runtime art instead of duplicating it.
Local databases, credentials, browser recordings and generated export intermediates
are excluded from version control.

From `standalone-game`, run `npm install` and `npm run dev` for the standalone
preview. The directory's README covers the Homes service and game controls.
When explicitly installing game changes into this app, pass the repository path:
`npm run sync:app -- ..`.

The newest reference-guided character is [Amber](docs/implementation/amber-outrider.md),
with modular costume geometry and a three-angle Refined cel portrait pack.
