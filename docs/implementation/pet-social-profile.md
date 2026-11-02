# Pet profiles: people-led community activity

The owner requested the supplied pet-profile screenshot's composition and clarified that animals cannot post. This replaces the old stacked animal story with a full-width social profile: a supplied illustration cover, overlapping photograph, Follow/Help/More actions, genuine public totals, Activity/About/Photos/Location navigation, wide activity feed and supporting rail. Human identity is always the source of stories, sightings and care. The pet is the shared subject.

## Feed and attribution

`features/animals/activity-service.ts` implements `animals.activity` from one current public snapshot. The typed BFF/client endpoint is `GET /animals/:slug/activity`.

- Published structured sightings, human-authored published stories explicitly tagging this animal, linked public help missions, active/completed/closed fundraisers and independently approved mission participations can appear.
- Care first orders open, unexpired missions and active fundraisers before sightings, approved help and typed care stories; closed/expired help follows; general tagged stories follow those. Within a group newest timestamp wins, then stable ID. Newest mode orders all records by date. No global community-feed ordering was changed.
- All activity, Sightings, Help and Tagged stories filters are real server filters. Help includes open/closed missions, independent help completion, fundraisers and tagged help/feeding/rescue stories. Sightings shows actual published observation records. Query/cursor state is preserved in page links; changing type/order resets the cursor.
- Every item names its human reporter, organizer, helper or story author when discoverability/contribution settings permit. Otherwise it uses Community member with no identifying ID, username, avatar or rank. Anonymous support never becomes attributed activity. Private evidence, precise sightings and applicant answers are excluded.
- Tagged stories retain canonical community PostCard behavior and seeded session-scoped queries for reactions/saves/edits. The current pet's tag is first in this context, including after query refresh. Non-published story results are hidden. Edits refresh their enclosing route after submitting for review. There is no pet account, pet-authored post or animal achievement wallet.
- The composer explicitly posts as the signed-in person and starts with the animal tag selected. The tag can be removed by the person; the interface explains that keeping it is what includes the story in this pet's feed. Submitting another update restores the initial tag. New stories remain private pending publication, following existing policy.

## Profile data and sections

Header counters are actual published tagged-story count, public sighting count, unique consenting helpers and unique consenting followers. The totals cover eligible records before paging/filtering. They do not copy screenshot values or infer rescues/adoptions. Missing activity data displays unavailable counters and retry/recovery while retaining the animal's public profile.

Photos aggregates deduplicated approved public imagery from the profile, sightings and tagged stories; it retains sensitivity/unavailable handling and source links/credits. Location preserves the existing period-filtered sighting history and lazy approximate BehaviorMap, with a usable list when Maps cannot load. Legacy `period` links still open Location. About retains descriptions, actual traits, verification provenance and the helper wall. Discussion/reporting, saving, sharing, adoption and discovery progress remain available.

The sidebar's Community care icons describe actual sightings, public helper links, active fundraiser links and an adoption listing. These are pet care facts, not achievement badges claimed by an animal, and they award no Kibble. Recent sighting artwork is explicitly labeled as an illustration rather than a real map snapshot.

## Cover ownership

Animals gain an allowlisted `bannerId` with the same supplied eight-banner collection and Meadow/Sunny companions default. Current-viewer `viewerCanManage` comes from owner/responsible-shelter checks and never supplies owner IDs publicly. The existing animal editor adds the shared banner picker, actor/resource-scoped form identity, and explicit publication-review copy. Updates remain versioned, permission checked and pending review; choosing a cover does not bypass review or silently publish other edits. Uploaded photographs keep existing review and retention behavior.

## Delivery and limits

Implemented directly in the main session, without agents, new image generation, automated tests/checks, builds, detectors or browser verification. Source was read and formatted only; runtime behavior and rendered layout remain unverified. The existing preview remains running. Local mock/BFF contracts are implemented; live Django conformance is separate work.

The existing Graphify repository map was a truncated locator (164 nodes, 96 reachable, four shown), supplemented by direct source reading; it does not describe the new activity service. Jev's synthetic attribution/priority judgment favored people-led, privacy-projected activity (424 input / 33 output tokens). No private records or secrets were sent; that judgment was guidance rather than verification.
