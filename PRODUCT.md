# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

User-specified: Next.js App Router, React, TypeScript, Tailwind CSS, Shadcn UI, Lucide React, Google Maps with `@vis.gl/react-google-maps`, TanStack Query, Zustand, React Hook Form, Zod, Motion, and Recharts. Future backend: Django REST Framework, GeoDjango, PostgreSQL/PostGIS, JWT, and Docker. The current implementation scope is the frontend with mock services.

## Users

Pet owners, animal lovers, volunteers, rescuers, shelters, and prospective adopters. Initial sample locations are around Davao City, Philippines.

## Product Purpose

Help people share animals' stories, discover animals nearby, find companions responsibly, and coordinate practical animal welfare support. The user's direct emphasis is social media for pets.

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
- The planning baseline is social-first. Following pets/people, post reactions, and saved posts are explicit proposed social features derived from that emphasis, rather than verbatim requirements from the attached brief.
- Production backend operations, real payments, and live external notifications are separate integration work.

## Brand Commitments

PawTrail; “Every Paw Has a Story.”; “Discover. Care. Connect.” Warm orange and cream with teal and green accents. Friendly rounded headings, readable body text, restrained flat animal doodles, real animal photographs, and a consumer community feel. The brief supplies a cat/dog/paw-marker logo concept; no finished logo asset has been supplied.

## Evidence on Hand

The original implementation brief is at `docs/requirements/pawtrail-original-brief.txt`. No real community records, testimonials, financial transactions, photographs, or final brand assets have been supplied. Sample records and licensed stock photographs must be identified as illustrative.

## Product Principles

1. An animal's story stays connected across social and welfare features.
2. Helping and expressing adoption interest have clear next steps and honest statuses.
3. Privacy and verification are enforced in data projections as well as the interface.
4. Demonstration behavior never implies a real payment, diagnosis, or approved adoption.
5. Features share typed services and reusable controls.

## Accessibility & Inclusion

Keyboard alternatives for every swipe or drag action, labeled controls, focus management, readable contrast, reduced-motion support, and accessible feedback. The plan targets WCAG 2.2 AA as an engineering baseline; conformance is not claimed before verification.
