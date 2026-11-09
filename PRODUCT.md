# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

User-specified: Next.js App Router, React, TypeScript, Tailwind CSS, Shadcn UI, Lucide React, Google Maps with `@vis.gl/react-google-maps`, TanStack Query, Zustand, React Hook Form, Zod, Motion, and Recharts. The real capture/animal-identity backend is Django REST Framework, JWT, local ONNX inference, and persistent analysis jobs, with PostgreSQL/PostGIS/pgvector and Celery/Redis for production. SQLite and a database worker support local development. Missions, adoption, fundraisers, events, Hordes, shelters, leaderboard and supporting social records now use Django database services.

## Users

Pet owners, animal lovers, volunteers, rescuers, shelters, and prospective adopters. Initial sample locations are around Davao City, Philippines.

## Product Purpose

Help people photograph animals, identify familiar individuals, register provisional identities, and contribute trustworthy sightings. Camera-based encounters are the main entry point. Human-authored community stories, responsible adoption and practical care remain connected to each animal's identity.

## Positioning

An animal's public profile connects community stories, sightings, help requests, adoption, and fundraising. A single community identity connects contributors' activity and earned Kibble.

## Operating Context

Mobile-first consumer web application with desktop discovery and management layouts. Philippine peso amounts and Asia/Manila dates appear in initial demonstrations. Public animal profiles must work without signing in or loading Google Maps.

## Capabilities and Constraints

- Community posts, photographs, comments, sharing, reporting, animal profiles, and user profiles.
- Google Maps discovery, approximate locations, sightings, Hordes, and global search.
- Adoption interests, optional rule-based compatibility, private applications, and shelter review.
- Fundraiser discovery, creation, management, transparent expenses, and explicitly simulated donations.
- Evidence-reviewed missions, non-cash Kibble, leaderboard, shelters, and events.
- Server-rendered public content, metadata, sitemap, robots, accessibility, and responsive navigation.
- Configurable API adapters must allow replacing mocks with Django endpoints without rebuilding feature components.
- Exact sensitive locations and applicant details must not enter public responses.
- `/spot` is the camera-first real encounter flow, with private capture evidence, locally computed visual candidates, independent review and a calibrated automatic-decision policy.
- Animal presence, individual identity, and encounter authenticity are distinct. Location supports matching but does not prove identity. Public reported areas describe historical evidence, not live tracking.
- A real capture account is separate from the demo actor while the surrounding platform remains in mock mode. Sample photos and game progress cannot become reference evidence or verified real-world Kibble.
- Automatic identity acceptance requires approved calibration evidence and curated reference photos; no current accuracy claim is made. Real payments, other social backend domains and live external notifications remain separate integration work.

## Brand Commitments

PawTrail; “Every Paw Has a Story.”; “Discover. Care. Connect.” Warm orange and cream with teal and green accents. Friendly rounded headings, readable body text, restrained flat animal doodles, real animal photographs, and a consumer community feel. The brief supplies a cat/dog/paw-marker logo concept; a PawTrail illustration sheet with logo artwork has now been supplied for compact brand and empty-state use.

## Evidence on Hand

The original implementation brief is at `docs/requirements/pawtrail-original-brief.txt`. A PawTrail illustration sheet was supplied for this redesign. No real community records, testimonials, financial transactions or animal photographs have been supplied. Sample records and licensed stock photographs must be identified as illustrative.

## Product Principles

Pet profiles are community-maintained identities, not posting accounts. People author stories, report sightings, request help and tag animals. A pet's activity feed gathers its public sightings, help requests, approved help and tagged stories, prioritizing practical care while keeping human attribution and privacy intact.

1. An animal's story stays connected across social and welfare features.
2. Helping and expressing adoption interest have clear next steps and honest statuses.
3. Privacy and verification are enforced in data projections as well as the interface.
4. Demonstration behavior never implies a real payment, diagnosis, or approved adoption.
5. Features share typed services and reusable controls.

## Accessibility & Inclusion

Keyboard alternatives for every swipe or drag action, labeled controls, focus management, readable contrast, reduced-motion support, and accessible feedback. The plan targets WCAG 2.2 AA as an engineering baseline; conformance is not claimed before verification.

## Real encounter recognition and rewards

`/spot/setup` gives independent reviewers an explicit path from real reference enrollment to calibration-report import and guarded activation. Setup is ready for future captured photos; no synthetic accuracy result or enabled policy is seeded. `/spot/kibble` shows the real platform's ledger-derived non-cash balance and immutable contribution/reversal history. Accepted recent sightings earn 10 Kibble once per animal per contributor per Manila day, capped at 100 sighting Kibble daily. Publication, correction and credit reconciliation are transactional. Sample/game balances remain separate and cannot grant real rewards.


## Persisted social services (8 November 2026)

The owner authorized populating the database with fixtures and removing repeated Sample tags. Seven social domains and their supporting profiles/community APIs are implemented in Django; full platform and game interfaces use them. Fixture origin remains internal, with no reference enrollment, fabricated verified contribution credits or collected payments. Fundraising records pledges and independently evidenced external funds; it does not charge cards or send payouts. See docs/implementation/live-social-backends.md.

## Genuine database achievements

Achievements, private proofs, independent review, public showcases and non-cash milestone ledger rewards now use the Django database. The shared 45-badge catalog is static rule configuration, not seeded activity. Progress excludes fixture records/accounts; digital activity remains distinct from independently reviewed real-world help. See docs/implementation/real-achievements.md.


## Furniture comparison and reactive environment — 9 November 2026

Furniture has an original/current comparison and a local playable contact field at `/play?compare=furniture`, linked from the creator and game menu. Shared contact mechanics support cloth/bush sway, solid running recoil, aquarium fish and temporary wet footprints. Owned shovel/mower tools change eligible grass in the owner's yard to server-persisted soil; the comparison remains local. The furniture skill documents actor status/tool/collision/ambient contracts. Preserve native pixels, actor libraries and game/social authority boundaries. This extension is source-reviewed only; see `docs/implementation/furniture-reactions-2026-11-09.md`.


## Furniture model fidelity and rotation — 9 November 2026

The furniture creator/comparison selects the reference-guided couch, 3D curtained opening and 3D aquarium. Keep paired floral pillows, generated 96×112 facings/contacts, native cloth/fish frames and circular above-object rotation actions. See `docs/implementation/furniture-model-fidelity-2026-11-09.md`; application verification remains unrun.


## Furniture material depth and visual review — 9 November 2026

The couch now uses reference-sampled olive/cream colors, taller backs, visible timber feet and stronger cushion/arm/skirt divisions. Furniture has native fabric/wood grain and teal water depth; the mobile preview no longer overlaps controls. Firefox desktop/mobile creator visuals, rotation and seating preview were reviewed under explicit owner authorization. See `docs/implementation/furniture-material-depth-2026-11-09.md` for evidence and limits.
