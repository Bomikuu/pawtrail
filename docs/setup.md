# Running PawTrail

Use Node 24 from `.nvmrc`. From the repository root:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The current worktree preview runs at http://127.0.0.1:3000 with explicit demo mode. A local `.env.local` has been created from the example when none existed; it is ignored by Git.

Keep `NEXT_PUBLIC_USE_MOCK_API=true` to try the local sample community. On Sign in, select Sample member, Sample shelter staff, or Sample moderator. They share only the current browser's isolated demo overlay, allowing you to submit as a member and then review as staff or moderator. Separate browsers or cookie jars have separate overlays. Demo passwords are not real authentication.

The member can publish stories, report animals and sightings, save profiles, follow people and pets, apply for adoption, simulate support, join missions, submit evidence, and RSVP. Staff manage assigned organizations, adoption applications, mission evidence, campaigns and events. Moderators publish submitted stories/photos/sightings and independently review verification evidence. Verification is illustrative, never real accreditation.

`NEXT_PUBLIC_SITE_URL` supplies canonical URLs. Maps need a restricted `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` is optional. Without a key, discovery lists and detail pages remain available. Maps and charts load only from their feature islands.

`DEMO_DATA_DIR` optionally changes the private writable storage directory; the default is `.pawtrail/demo`. Do not serve or commit this directory. `DEMO_ALLOW_RESET=true` enables the existing same-origin `POST /api/v1/demo/reset` endpoint for resetting only the current demo cookie's overlay. Leave it false to protect your local work. Schema-incompatible sessions return a recoverable reset-required error; the new optional workflow store preserves version-7 overlays.

The demonstration clock is fixed at 2026-11-02 00:00 in Asia/Manila. Sample events and deadlines are fictional. Use the supplied past observation time for demonstration sightings, or another time before the demo clock. Display dates use Asia/Manila; money is integer PHP centavos.

Automated testing remains disabled by the owner's explicit instruction. No validation command is part of starting the app. Existing optional commands are documented in the release checklist and must be explicitly requested before an agent runs them.
