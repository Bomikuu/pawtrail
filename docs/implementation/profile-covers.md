# Public profiles and selectable covers

The owner requested the supplied profile screenshot's composition and a banner selector equivalent to the avatar collection. The implementation keeps the platform's full available width, with a compact illustrated cover, overlapping portrait, current all-time rank crown, level/progress, contribution totals, About/impact sidebar, URL-backed activity navigation, opted-in achievement showcase, animal links and story previews. Canonical controls, image sensitivity handling, follow actions and existing privacy gates remain in use.

## Covers and saving

- Four presets: Meadow companions, Garden nap, Coastal wanderers and Starlight friends. Stable IDs are `meadow`, `garden`, `coast`, `starlight`; old accounts default to Meadow.
- `BannerPicker` provides a selected preview, descriptive buttons, visible/announced pressed state and pending/disabled treatment. It shares the existing profile form save operation, inline errors, idempotency receipts and success feedback. Unsaved selection is not published.
- `profileInputSchema` validates the optional preset ID before any mutation. Omission preserves the current banner. Stored URLs, arbitrary uploads and client-authored crop positions are not accepted. The server resolves display assets from the allowlist.
- Banner ID is included in the existing persisted user record and public/private DTOs. No destructive session reset or unrelated migration is introduced. Form identity is keyed by user ID.
- The current owner's public profile has Change banner and Edit profile actions. The management form has View public profile when discoverable. Other visitors retain the real follow action. No placeholder messaging/menu or invented online presence is added.
- Twelve small WebP derivatives (384/768/1440 pixels for each preset) total 634,664 bytes. Only the chosen responsive cover and lazy picker thumbnails load as needed. Source PNGs remain in the generation directory; provenance and full prompts are recorded in `docs/assets/profile-banners.md`.

## Recorded data and privacy

The existing user service produces an allowlisted public activity stream from published sightings, independently approved public missions and non-anonymous support for distinct visible campaigns. The sighting view links to the relevant public animal; the mission view contains its title and approval status, without evidence; the support view contains campaign context without private donor information or amounts. Story previews use existing public media/sensitivity handling, reaction/comment counts and current rank crowns. No private proof text, media IDs, applicant answers or exact locations are added.

Level progress uses actual net non-cash Kibble: one level per 100, starting at 1. It is not a newly invented XP system. Sidebar values are distinct public animal associations, visible-event RSVP count and elapsed membership days; RSVPs are not attendance, elapsed days are not activity streaks. Fundraiser summary counts distinct campaigns, matching the label. The animal total does not certify rescue or adoption outcomes. The sample provenance label remains visible.

Contribution-private profiles return null rank/impact, no activities, no showcased badges and no animal associations. The view shows a private-contributions state while still respecting separately shared bio and location. Missing legacy impact/activity fields default to unavailable rather than fabricated values. All activity navigation remains server-rendered via `?tab=`; no client-only profile page replaces the public content.

## Delivery limits

Implemented directly, without subagents. No automated tests, type checks, UI/format checks, detectors, builds or browser inspections were run, as explicitly requested. Source was read and formatting edits applied. Runtime, persistence and rendered responsive behavior remain unverified. The development preview was left running.

Graphify's existing repository graph was used as a capped locator (164 total nodes, 96 reachable; four shown), supplemented by source reading; it does not describe this new feature. Jev favored an allowlisted, privacy-preserving implementation using a synthetic brief (424 input / 35 output tokens); no secrets or private records were submitted. That judgment was guidance, not verification. Live Django integration remains separate.
