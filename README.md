# PawTrail

![PawTrail logo](public/images/pawtrail/brand-mark.webp)

Every Paw Has a Story. A pet community application connecting stories with nearby care, responsible adoption and practical animal welfare support.

## Frontend requirements

Use actual **shadcn/ui components from the official registry**, installed through its CLI and maintained in `src/components/ui`. Hand-written lookalike primitives do not satisfy this requirement. Product-specific behavior composes the official components.

Use **Tailwind CSS first** for routine layout, spacing, typography, colors, borders, responsive behavior, and interaction states. Reserve `.css` for theme tokens, fonts, browser-specific rules, and genuinely complex animations or effects that are impractical to express clearly with utilities. Do not recreate ordinary page styling in separate stylesheets.

These rules apply across the social platform and management dashboard while preserving their distinct layouts. See [Design guidance](DESIGN.md) and the [official shadcn/Tailwind migration record](docs/implementation/shadcn-tailwind-migration.md).

## Run locally

Use Node 24 from `.nvmrc`:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Keep `NEXT_PUBLIC_USE_MOCK_API=true` for the sample community. Choose Sample member, Sample shelter staff or Sample moderator on Sign in. The current worktree preview uses http://127.0.0.1:3000.

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

Public stories render on the server. Maps, charts and gesture interactions are separate client islands. Private documents, exact sightings, applicant answers and drafts stay behind the service and BFF boundaries. The demo uses one Node process with private writable disk, isolated by an HttpOnly browser cookie. It does not perform real authentication, payments, adoption arrangements or accreditation.

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
