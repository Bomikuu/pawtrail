<p align="center">
  <img src="docs/images/pawtrail-logo.webp" alt="PawTrail cat and dog logo" width="148" />
</p>

<h1 align="center">PawTrail</h1>

<p align="center"><strong>Every paw has a story. Be part of theirs.</strong></p>

<p align="center">A cozy neighborhood to explore, animals to care for, and a community built around kindness.</p>

<p align="center">
  <img src="docs/images/pawtrail-banner.webp" alt="A happy cat and dog resting together in a sunny, flower-filled meadow" width="900" />
</p>

PawTrail connects an animal welfare community with a playable pixel-art world. Wander through a welcoming neighborhood inspired by small Southeast Asian towns, meet volunteers, earn an animal’s trust, and help make shared spaces feel like home. In the integrated platform, encounters lead to actual animal profiles, help missions, and adoption applications.

This workspace contains the **exploration game, multiplayer Homes service, and original game assets**. It runs on its own and also integrates into the separate PawTrail community application at `/play`.

The interface uses **Saira Condensed** for primary headings, names and world labels, paired with **Instrument Sans** for body text, controls and dialogue. Both fonts are self-hosted and shared with the platform and management dashboard. See the [typography and emergency actions guide](docs/implementation/emergency-rows-typography.md).

## A little care goes a long way

| Experience | What you can do |
| --- | --- |
| **Explore Sampaguita** | Walk through the neighborhood, shelter, hidden garden, and riverside; discover routes and restore community spaces. |
| **Make animal friends** | Feed, pet, photograph, and gradually build trust with animals that have their own routines and personalities. |
| **Help the neighborhood** | Follow volunteer-led stories, take on daily care tasks, collect keepsakes, and earn game Kibble and XP. |
| **Meet platform animals** | Open published animal details, follow or save profiles, find linked help missions, and continue into the platform’s adoption flow. |
| **Make a home** | Arrange furniture across a saved interior and yard, choose an exterior, and care for eligible cats linked to your owned platform profiles. |
| **Spend time together** | Visit friends’ homes, meet in a spacious six-district neighborhood, chat, react, exchange gifts, and leave guestbook messages. |
| **Find your community** | Discover animals, homes, shelters and Hordes through photo markers, independent proximity and geographic clusters; coordinate help and read separate contribution and welfare records. |
| **Follow the little adventures** | Accept pet missions at the wooden board, pin objectives, discover keepsakes, and use your categorized backpack. |
| **Feel the world change** | Enjoy rain, drifting clouds, night lights, and original cat sounds with animated reactions in shared rooms. |

Exploration has a gentle day/night cycle, original synthesized music and ambience, touch controls, and local save import/export. There are no missed-day penalties. Homes adds account-linked persistence, live presence, and visitor permissions.

Choose from ten player appearances in **Pause → Your character** or **Homes → Settings**. Alongside the original rescuers and glasses girl, blonde, violet-haired, and copper-red characters include three men with distinct outfits and matching portraits. The picker previews your selected character's portrait. Neighborhood conversations feature individual portraits for Maya, Jo, and Lina. See the [character and portrait guide](docs/implementation/character-portraits.md), [color variants](docs/implementation/character-colors.md), and [male rescuers](docs/implementation/male-characters.md).

The [world immersion expansion](docs/implementation/world-immersion.md) adds the community board, mission tracker, discoveries, Cat Soundboard, weather and tint-based night lighting in eight implementation phases. Shared conditions and pickup claims use the Homes server; exploration progress remains local.

The [spacious community expansion](docs/implementation/spacious-community.md) adds an 80 × 56-tile shared neighborhood with a park, care hub, plaza, market, four residential plots per block and a jeepney stop. Open **/play**, which now starts in the community, then approach a gate to visit its saved yard and interior. **Decorate** supports dragging and explicit nudge/place controls, shared furniture stock, independent yard saves and server-enforced entrance routes. The pet shop and workshop sell game supplies and garden pieces. Public animal encounters retain actual platform profile/help/adoption links.

Open [the shared neighborhood](http://127.0.0.1:3000/play) or [database discovery](http://127.0.0.1:3000/play?map=community). Live rooms need a real platform account, the Next session bridge and housing service. The owner has removed demo profiles and proximity fixtures; only published database records appear in discovery. See [database-only discovery](docs/implementation/database-only-discovery.md) for the empty database and missing social backend domains.

## Start exploring

Use **Node.js 24 LTS** and npm. The standalone game does not require the community application or housing backend.

```sh
npm install
npm run dev
```

Open [the standalone game](http://127.0.0.1:5173/) in Firefox.

For a first quest, talk to **Maya** and accept **Welcome to PawTrail**. Collect a bowl near the feeding station, feed Mango, and return to claim your reward. Later, meet Jo for **The Missing Kitten** and Lina at the shelter for **A Home for Every Paw**.

| Action | Controls |
| --- | --- |
| Move | WASD / arrow keys, or click/tap clear ground |
| Run | Hold Shift |
| Interact | E / Space, or the visible action button |
| Journal / backpack / map | J / I / M |
| Pause or close a panel | Escape |

Smaller screens include a joystick and contextual interaction button. Audio begins after your first key press or tap; volume and mute controls are available in Pause.

## Play with the community platform

Open **Explore places** to browse the [community map](http://127.0.0.1:3000/play?map=community). It uses MapLibre + OpenFreeMap without an API key. Owners can opt into neighborhood home pins under Homes settings. See the [community discovery guide](docs/implementation/community-discovery.md) for photo markers, nearby filters, private reports, review and service boundaries, and the [original map guide](docs/implementation/community-map.md) for provider recovery and shelter visits.

Discovery reads the real platform database. The internally tracked development fixtures live in Django rather than an in-browser sample catalog; see the [live backend guide](docs/implementation/live-social-backends.md).

The existing Next.js application is maintained in a separate workspace. To install this game’s source, runtime assets, and integration routes into it:

```sh
npm run sync:app -- /absolute/path/to/pawtrail-platform
```

Start the platform using its own development instructions, then open [PawTrail Play](http://127.0.0.1:3000/play). **Meet animals** connects eligible public profiles to game encounters; the standalone world uses fictional neighbors. Profile and adoption handoffs preserve a return link to the game.

### Multiplayer Homes

Homes also requires **Python 3.11+** and **uv**. From this workspace:

```sh
uv sync --project backend
npm run dev:homes
```

Keep the Next.js application running, sign in through PawTrail, and open [your home](http://127.0.0.1:3000/play?home=me). The housing service runs on port **8001** and applies database migrations on startup.

Local development uses persistent SQLite with a single-process in-memory channel layer and cache. Production configuration supports PostgreSQL and Redis, a shared signing secret, and explicit allowed hosts/origins. See the [Homes setup and configuration guide](docs/implementation/multiplayer-homes.md) before deploying.

## Built with

| Layer | Technology |
| --- | --- |
| Game rendering | Phaser 4.2.1.90, pixel sprites, tile maps, and interpolated movement |
| Game interface | React 19, TypeScript, Vite 7, Tailwind CSS 4 |
| Shared UI | Official shadcn/ui registry components, Radix, and Lucide icons |
| Platform integration | Next.js 16 community application, session bridge, profile and adoption links |
| Homes backend | Django 5.2, Django REST Framework, Channels, and Daphne |
| Data and live updates | SQLite locally; PostgreSQL and Redis configuration for production; WebSockets for live rooms |
| Audio | Original procedural music, ambience, and effects through Web Audio |

Routine interface styling uses Tailwind utilities and the shared shadcn component layer. Pixel-art assets use nearest-neighbor rendering to preserve crisp edges.

## Project map

```text
src/
  components/game/        Game panels, dialogue, journal, and Homes UI
  components/ui/          Shared shadcn/ui components
  game/
    data.ts               Animals, quests, items, and NPC content
    systems/              Care, behavior, time, saves, and audio
    world-scene.ts        Exploration world and interactions
    housing/              Homes scenes, client, and runtime catalog
backend/                  Django housing API, persistence, and live rooms
integration/              Next.js entry points and signed session bridge
public/pawtrail-game/     Exploration runtime assets and maps
public/assets/game/       Housing sprites, catalogs, and reference sheets
assets/                   Source artwork, exports, manifests, and prompts
scripts/                  Asset preparation, app synchronization, and launchers
docs/                     Content guides, implementation records, and briefs
```

Useful maintenance commands:

| Command | Purpose |
| --- | --- |
| `npm run sync:app -- <platform-path>` | Copy game source and runtime assets into the existing community app |
| `npm run assets:housing:runtime` | Prepare runtime definitions from the existing housing asset catalog |
| `npm run assets:prepare` | Regenerate exploration assets and maps; **overwrites generated maps** |

## Current scope

**Exploration is playable; Multiplayer Homes is a first playable implementation.** Homes includes persistent decoration, virtual care, social features, and live rooms. Expanded room/garden maps, party and playdate orchestration, dogs as home residents, and a moderation review dashboard remain future work. Animation polish and a full signed-in multiplayer browser walkthrough are still outstanding; the housing backend has not been deployed to production.

Exploration progress stays in browser storage and can be exported/imported through Pause. Different local ports have separate saves. Homes progress persists in its backend and uses the existing platform identity. The wider community application currently uses its demo API; published sample records remain labeled as samples.

Game care and Kibble are virtual. They do not create verified rescue records, change the platform’s verified wallet, or have cash value. Adoption applications continue through the platform’s existing flow.

## Explore the documentation

- [Exploration implementation](docs/implementation/living-rpg.md)
- [Adding animals, quests, and other game content](docs/adding-game-content.md)
- [Connected animal profiles and adoption handoffs](docs/implementation/platform-encounters.md)
- [Multiplayer Homes: setup, permissions, and limitations](docs/implementation/multiplayer-homes.md)
- [Exploration game brief](docs/requirements/cozy-rpg-brief.md)
- [Multiplayer Homes brief](docs/requirements/multiplayer-homes.md)

---

<p align="center"><em>Good deeds leave pawprints.</em></p>

The integrated `/play` entry opens the new community by default. **My house** and **Animals** stay close at hand; social, decoration and resident controls float above the full-width world. Use `/play?explore=1` for the earlier story exploration game.

The [cozy home refinement](docs/implementation/cozy-room-and-map.md) adds an original walled-room reference, four native furniture choices (bed, aquarium and two cat stands), small property labels and integer Zoom/Fit/Fill controls. The community directory includes a simple street map fallback with interactive markers/clusters when the detailed renderer is unavailable.

House Settings now includes a [layout gallery](docs/implementation/house-layout-presets.md) with large thumbnails for Cozy Studio, Connected Cottage with attic, and the two-storey Companion House. Apply a furnished preset or start with empty rooms; recent arrangements remain restorable. Walk through connected rooms and press E at the stairs, or use the floor buttons.


## Connected platform services

The integrated app now uses Django for missions, adoption applications, fundraiser records/pledges, events, Hordes, shelters and leaderboard. Linked fixtures are stored in the real database with internal seed keys, without repeated Sample tags. Game discovery and animal actions use those APIs. Recognition references, verified rewards and collected funds are not fabricated from fixtures. See [live services and local access](docs/implementation/live-social-backends.md).

### Physical world interactions

Phaser 4.2.1 powers fine-grained walking collision, approach-and-act controls, reserved seating, cat perches and persistent furniture care across homes, yards and the shared community. Click an object, choose its action, and your rescuer walks into place. Move or press Escape to cancel or stand. See the [implementation and current limits](docs/implementation/physical-world-interactions.md).

### Animal companions and a shared world

Explore and Homes share one Phaser session and actor/movement systems. Select a cat’s lower-left portrait to follow, stay, move or offer game care; build 20 trust with story cats first. Residents and companions expose food/water reserves and care missions. Decorate opens a large live editor with catalog categories and supported rotation controls. See the [gameplay guide and current limits](docs/implementation/unified-gameplay-companions.md).


## Cat appearances and actions

Open the [cat creator](http://127.0.0.1:3000/play?preview=cats) to choose breed,
coat, tail, accessories and colors beside the approved tabby. Start from a tabby
scout, Persian, Siamese, or bobtail witch, then save your own named cat on this
device or in your private PawTrail account library. JSON backups are supported.
All share 33 feline actions in eight directions, contextual soundboard audio,
ground shadows, fur patterns and modular hats, boots, collars and wings.
Use `$pawtrail-cats` for reference-guided cats and shared feline actions.
See the [cat creation guide](docs/implementation/cat-creation.md).

## Live 3D actor models

Players and cats now have procedural articulated Three.js meshes, projected live into the shared Phaser world with nearest-neighbor rendering. Open Settings → Your character → Adjust 3D models for rotation, action previews, colors and proportions. Existing portraits/world art remain in use. Overrides are device-local and never alter platform animal data, collision footprints or verified rewards. See `docs/implementation/live-3d-actors.md` for integration details and limits.


### Dedicated UV skins and living idles

The active 3D actors now use dedicated pixel UV atlases for all ten character appearances and ten cat coats, with rounded heads, native outfit/coat palettes and subtle standing breathing/blinking. Avoid reintroducing the superseded runtime sprite-crop mapping or flat box heads. Authoring and verification scope: `docs/implementation/dedicated-uv-skins.md`.

### Create your own character

Open **[Character creator](http://127.0.0.1:3000/play?preview=actors)** from
Your spaces. Combine hair shapes, outfits, headwear, glasses, wings, a backpack
and equipped gear; tune colors and preview all 34 shared human actions in eight
directions. Save named looks to your PawTrail account or this browser, export a
JSON backup, and explicitly choose a saved character for play. Account looks
work in Explore and multiplayer homes; device saves are local Explore only.
See [the creator guide](docs/implementation/character-creator.md) for persistence
and rendering boundaries.
