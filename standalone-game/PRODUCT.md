# PawTrail playable prototype

## Furniture comparison and reactive environment — 9 November 2026

Furniture has an original/current comparison and a local playable contact field at `/play?compare=furniture`, linked from the creator and game menu. Shared contact mechanics support cloth/bush sway, solid running recoil, aquarium fish and temporary wet footprints. Owned shovel/mower tools change eligible grass in the owner's yard to server-persisted soil; the comparison remains local. The furniture skill documents actor status/tool/collision/ambient contracts. Preserve native pixels, actor libraries and game/social authority boundaries. This extension is source-reviewed only; see `docs/implementation/furniture-reactions-2026-11-09.md`.

A cozy browser RPG where players explore a Southeast Asian neighborhood, meet animals, feed and pet them, coordinate rescues, and earn non-cash prototype Kibble. The owner approved direct implementation using the generated environment, rescuer, and animal animation packs.

This standalone workspace contains the game; the existing social application remains in its separate implementation worktree. First delivery: a neighborhood, shelter interior, eight animal identities, volunteer conversations, local progress, inventory, and a starter care quest. Phaser 4.2.1 renders and simulates the world; React and actual shadcn/ui components provide accessible controls. Tiled JSON maps and asset manifests are the data boundaries.

Game progress and rewards are local demonstration data. The integrated `/play` page connects to the social platform's public animal records, existing follow/save services, mission pages and private adoption workflow. Imported records retain their provenance; fictional care and rewards never create verified platform activity. The standalone preview remains a fictional world. No live Django deployment or cloud game saves are claimed. Work directly without agents, automated tests, builds, or browser verification under the owner's standing preferences.

## Living RPG expansion

The 7 November attached brief supersedes the initial narrow prototype scope. The first playable now includes data-driven story/daily/side/exploration/community quests, trust and routines, audio, time, photos, visible improvements and unlockable areas. The source remains in this workspace and is integrated at `/play` in the existing social application. The brief explicitly authorizes scoped system validation; production builds and browser inspection remain off. See `docs/implementation/living-rpg.md`.

## Multiplayer Homes

The account-linked housing service is now implemented locally using Django/DRF/Channels, with a PostgreSQL/Redis production configuration path. Next account assertions provision personal game homes without creating separate credentials. Homes has durable decoration, permissioned visits, friends, live room chat/movement/emotes, owned-cat references, virtual care and optional social quests. `/play` remains the exploration game; `/play?home=me` opens Homes. Virtual housing currency/rewards never credit verified platform Kibble. See docs/implementation/multiplayer-homes.md for the first-playable scope and explicit remaining expansion work.

## Geographic community discovery

The owner chose MapLibre + OpenFreeMap with no API key for `/play?map=community`. Players discover clustered public shelter profiles, opt-in accessible virtual homes, and the shared community hub; previews connect to profiles or existing game entrances. Home pins use chosen neighborhood centers with fictional offsets, never private addresses or device geolocation. Public shelter pins retain their existing approximate-location/provenance rules. Shelter entries use the shared exploration care interior with encounters filtered to that shelter's eligible public animals, not new multiplayer shelter rooms. See docs/implementation/community-map.md for the Davao home-area pilot and current limits.

## Spacious community and yards

The shared Homes commons now uses the approved 80×56 native-tile, six-district layout, four permanent 14×14 residential plots per block, generated transport/plaza props and public-profile animal encounters. Separate yard layouts/revisions preserve existing 24×18 interiors and share authoritative game furniture stock. Source, privacy and unverified runtime limits are documented in docs/implementation/spacious-community.md.

The owner refined the shared-world shell: `/play` opens the community by default; My house and public animal profiles are immediate shortcuts. The full-width canvas remains mounted across yard/interior visits. Social and resident controls are bounded floating drawers, and speech balloons are compact and attached to their speaker. `/play?explore=1` preserves the story exploration entry.

## Selectable house plans

Owners can choose the approved studio, connected cottage/attic and two-storey house layouts from an enlarged Settings gallery. Preset application is explicit and reversible through recent layout history. Ground/upstairs saves and inventory validation use the housing backend, with native furnished arrangements, connected rooms and physical stair interactions. See docs/implementation/house-layout-presets.md for authority and unverified runtime limits.


## Database-only live data (8 November 2026)

The owner removed runtime sample data. Live discovery reads genuine published Django records only, without proximity fixtures or demo homes. Empty databases stay empty; do not manufacture real animals, locations, identities, rewards or adoption eligibility from game/sample content. Preserve authored game scenery and art as game content, separate from real identities. See docs/implementation/database-only-discovery.md for active routes and backend limits.


## Persisted social backends (8 November 2026)

The owner's latest request supersedes the earlier empty-database-only delivery. The platform now has seven Django social domain services and a populated, linked database fixture collection without repeated Sample tags. Internal seed provenance remains separate from identification evidence and authoritative rewards. See docs/implementation/live-social-backends.md. The full platform UI and game bridge load those APIs; genuine accepted camera sightings can publish located social profiles.

## Physical interactions

The owner-approved gameplay upgrade uses Phaser 4.2.1, native-pixel geometry and an 8px navigation grid, typed approach/alignment/action recovery, server receipts and seat leases, persistent furniture states and resident pet surface behavior. Preserve saved layouts and verified platform boundaries. See docs/implementation/physical-world-interactions.md for actual scope, art gaps and the intentionally unverified runtime status.

## Unified play controls

Explore, Homes and yards share one UI shell and responsive footer. Exploration keeps its preferred scene while gaining the Home controls; community social and home editing actions enter their actual authenticated world. Local photos and reactions work inside exploration. Keep their underlying save/currency authority separate. See docs/implementation/unified-play-shell.md.

## Unified gameplay and animal circle

Explore, homes and yards now share one Phaser session, native actor registry, movement and zoom preference. A lower-left animal circle provides companion commands and virtual needs; account pets and care-cycle quests are persisted in housing Django while fictional story progress remains local. Decoration uses a large category/catalog/live-scene dialog. Existing layouts and platform reward/evidence boundaries remain intact. See docs/implementation/unified-gameplay-companions.md for art gaps and unverified runtime limits.


## Whole-city communities (9 November 2026)

The owner replaced the local barangay/custom-zone community layer with unsplit whole-city communities. The active Davao Region coverage contains six sourced city polygons and one existing-service shared room per city, with distinct colored outlines, hover entrance cues, touch selection and keyboard selection. Smaller areas/room histories remain stored but are unpublished and closed. Existing account and routing boundaries remain; see docs/implementation/city-communities-2026-11-09.md.

## Nationwide cities (9 November 2026)

The owner's final scope is chartered cities only, nationwide. The sourced layer now publishes 149 whole-city communities across the Philippines, preserving the earlier Davao city identities and color choices. Municipalities, barangays and zones are excluded from active discovery and entry. See docs/implementation/nationwide-city-communities-2026-11-09.md for source dates, loading behavior and verification limits.


## Furniture model fidelity and rotation — 9 November 2026

The furniture creator/comparison now selects the reference-guided couch, real 3D curtained opening and real 3D aquarium. Preserve the couch’s paired floral pillows and rounded silhouette, generated 96×112 native facings/contacts, native cloth/fish frames and circular above-object rotation actions. Separate legacy bamboo-window/bush artwork remains 2D. See `docs/implementation/furniture-model-fidelity-2026-11-09.md`; application verification remains unrun.


## Furniture material depth and visual review — 9 November 2026

The couch now uses reference-sampled olive/cream colors, taller backs, visible timber feet and stronger cushion/arm/skirt divisions. Furniture has native fabric/wood grain and teal water depth; the mobile preview no longer overlaps controls. Firefox desktop/mobile creator visuals, rotation and seating preview were reviewed under explicit owner authorization. See `docs/implementation/furniture-material-depth-2026-11-09.md` for evidence and limits.
