# Database-only discovery and illustration cleanup

The owner removed the sample-data workflow on 8 November 2026. Current/default application configuration now selects the real Django API at port 8002. No fixture animal is promoted into the real database and no generated image becomes recognition evidence.

## Assets

All 45 achievement badge exports and both UI brand-mark copies have border-connected pale backgrounds removed. Enclosed whites, original outlines and artwork remain. Transparent RGB is normalized; WebP exports retain alpha. Pre-edit originals are preserved outside runtime in the ignored `assets/source-backgrounds-v1` folder.

The existing transparent cat/dog illustrations now have black, white, gray, brown and cream variants alongside the original warm-colored art. `animalPlaceholder` selects by recorded species and coat/markings. Unknown coats use the neutral gray illustration. Real photographs always take priority. A fallback is explicitly an illustration, not an identification result. `scripts/prepare-animal-placeholders.py` records the authorized derivative process.

## Real data

- Discovery no longer loads starter/example places, demo room JSON, local sample missions or animals synthesized around a proximity center. Sample entities are excluded even if returned by an old source.
- The integration bridge reads published real animals through the capture gateway and uses accepted approximate locations only. Animals with no accepted public location stay in Explore without fabricated pins.
- `/community`, `/explore` and public `/pets/[slug]` use database projections. Community activity is active, published sightings with actual contributors and public photo derivatives. Missing facts remain unrecorded; pet records do not claim age, size or adoptability without evidence.
- New public Django reads: `/api/v1/community` and `/api/v1/animal-profiles/<slug>`. Sighting pagination uses `approved_at`; animal pagination keeps `created_at`. Only public photographs/confirmed identities are returned.
- The source runtime fixture seed is empty. Existing local demo session stores are removed. The 23 persisted sample housing profiles and dependent records were deleted (113 profile/dependent rows), including 28 sample pets. Auto-seeding and sample tickets are disabled. No genuine account or record was deleted.
- Identity contribution is not evidence of ownership: housing does not automatically claim animals reported by a contributor as that person's pets.

## Actual limits

At implementation time the real platform database had zero accounts, zero animals and zero published sightings. No real data was supplied to import. Empty views are intentional; create a real account, capture an animal, and follow the review/publication flow to populate them.

Real camera, identity/review, sightings and authoritative Kibble exist. Mission, adoption, fundraising, event, Horde, shelter and leaderboard social services are not connected to this backend yet. Their primary public lists display explicit unavailable states rather than fixtures or invented empty database claims. This change does not assert those missing backend domains are implemented. Game scenery, player art, furniture catalogs and authored fictional story/NPC content remain game content rather than database identities.

Implemented directly with authorized local image processing. No automated tests, checks, builds or browser verification were run. Development backend processes are restarted to load the new view code.
