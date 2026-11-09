# Zoomed-out city hover and transparent map artwork

This follow-up supersedes the lower boundary-visibility cutoff in `map-zoom-summaries-2026-11-09.md`. Thin city boundaries, fill hit targets and the named entrance hover preview now remain available from zoom 3 to below 13. The province count-circle threshold remains zoom 8, independently of boundary visibility. Street zoom 13 and above still hides city geometry, clears hover and prevents city-area click entry. Both MapLibre and the raster fallback use the shared range. Existing MapLibre layers also receive the range if they were created before the policy changed.

The city hover preview now has a city illustration and the same six database-derived circular counts as the city drawer: animals, events, homes, shelters, groups and help requests. The compact count presentation reuses the existing statistics request rather than fetching on pointer movement or counting a partially loaded marker set. Counts, home visibility rules, unknown/error/loading states, the keyboard city selector, route picking and shared-room entrances remain intact. Cached counts remain readable during refresh.

## Artwork delivery

Seven new illustrations were generated with the **built-in image_gen tool**, one call per category, using the actual transparent PawTrail brand mark as the style-reference input. Every final request explicitly used `transparent_background: true`. Subjects are animals, events, home, shelters, groups, help and city. The earlier opaque cream-background drafts are unused.

Final web assets live in `public/pawtrail-game/discovery/map-{animals,events,home,shelters,groups,help,city}-v1.webp`. Each is 384 × 384 with preserved alpha; all seven optimized files were inspected for an alpha channel spanning 0–255. No opaque backdrop or checkerboard was added. Their background comes from the existing themed UI surface, so the file itself does not impose a light rectangle in dark mode.

The original generated PNGs and complete final prompt set are saved in `output/imagegen/map-placeholders-v1/`. The shipping provenance/prompt manifest is `public/pawtrail-game/discovery/map-placeholders-v1.json`. The selected assets and originals are also present in the social worktree that serves `/play?map=community`.

`DiscoveryAvatar` composes the official shared shadcn Avatar. It prioritizes available photos, falls back to the relevant transparent illustration on missing/broken photos, and retains an unavailable icon if the local artwork itself fails. The standalone workspace's missing Avatar component was added through the official shadcn CLI; formatting alone was normalized, with no functional registry-source edits. The social app retains its already-installed official Avatar.

The shared fallback is applied to animal/place markers, member portraits, geographic clusters, city hover/drawer portraits and count circles. Province circles use the city illustration and illustrated category counts. Non-animal detail banners and the existing place preview use the matching artwork when photos are absent or broken. Real photos still win; collages use available member photos instead of presenting several generated faces as distinct photographs. Attention rings, counts, selection IDs and route-destination behavior are retained.

Artwork is generic display material. It creates no animal identities, identification evidence, locations, fixture records, rewards, verified Kibble, payments or inferred online presence. The coat-based illustration helper outside these shared map portraits remains untouched.

## Scope and review

Only the changed shared map files and these assets were mirrored into the social worktree, with its neighborhood import aliases. No blanket game sync or unrelated player/cat/profile work was changed. The preview services remain running; backend contracts and data were not mutated.

Source review covered the two renderers, shared count state, compact tooltip bounds, category mappings, missing/broken images, public-photo priority and street cutoff. A generic Jev design-policy judgment returned 0.8 and was treated as advisory; no private data was submitted. Asset alpha metadata was inspected as part of the requested image delivery. No automated application checks/tests, build, or new browser verification were run for this follow-up under the owner's standing instruction. Previous Firefox evidence predates these changes.
