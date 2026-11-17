# PawTrail game interface

Mode: Experience for the explorable world; Operate for inventory, journal, and dialogue. Preserve the generated 63-color art, upper-left light, native 32px terrain scale, 32×48 rescuer frames, and 32×32 animal frames. Render at integer zoom with nearest-neighbor sampling. The game fills the viewport below a compact cream toolbar. Restrained orange actions and brown text match PawTrail. Primary headings, names and world labels use Saira Condensed; secondary body text, controls and dialogue use Instrument Sans. Both are self-hosted, with matching roles in the social platform and dashboard. No animated decorative page hero.

The canvas is the primary surface. A small care objective sits in a corner; proximity reveals contextual actions at the bottom. Journal, backpack, and help use official shadcn Dialog/Tabs/Button/Progress components. Movement supports WASD/arrows, tap-to-walk, and a touch direction pad. Dialogue and menus pause simulation, and closing them restores control. Show genuine load progress, retryable loading failures, saved/local-only status, clear resource requirements and completed actions. Reduced motion disables camera smoothing and incidental tweens; it does not hide state feedback.

Routine presentation uses Tailwind utilities. CSS contains theme/font declarations and canvas browser behavior only. No hand-written primitive substitutes. No agents, tests, builds, or browser inspection unless requested. Browser links and automation use Firefox when needed.

## Living RPG refinement

Journal tabs group stories, daily tasks and community content with objective lists and explicit rewards. Inventory uses item grids. Conversations use the owner-provided parchment-and-wood reference: a centered, bounded panel, a large framed speaker portrait on the left, a wooden nameplate, a role label, an inset speech area and a golden action at lower right. Preserve typewriter/skip/continue and optional choices. The HUD shows clock, current objective and unobtrusive notices. Actual in-game photographs form the album. Audio controls use official Slider/Switch components. The day/night world changes smoothly; the operation UI stays readable. Route-scoped tokens reach portaled dialogs without changing the social application after leaving the game.

## Homes surface

Mode: Experience for the live Phaser home/hub; Operate for social/decoration/pet controls. Preserve the incumbent cream/brown/sage/orange world and existing generated art. The canvas fills the available width. Desktop social/inventory and pet/mission drawers float above it, have bounded heights, rounded borders and close controls, and start closed. Mobile uses the same full-width world plus touch controls and compact bottom dialogs. Keep My house and Animals directly reachable. Small rounded speech balloons have a tail and follow their speaker; the full text remains in chat history. A compact bottom toolbar owns Home/Friends/Chat/Decorate/Journal/React/Photo/Outside/Settings. Selection and proximity reveal context; the directory shows genuine profile details and clearly labels virtual care. The editor keeps unsaved state until save/discard and exposes conflicts. All standard controls compose canonical shadcn components with Tailwind utilities. No new visual identity or image generation is part of this extension.

## Character and portrait addition

The owner subsequently requested a selectable girl with glasses and conversation portraits. Retain the existing world: four visual character choices use native 32×48 sprite previews at 2× in a shared shadcn Button picker, with visible selected state and accessible pressed labels. Exploration stores the choice in local progress; Homes keeps its existing account profile action. NPC conversations pair text with an individual transparent 96×96 pixel portrait at 1× on mobile and 2× on desktop. Maya, Jo, and Lina have distinct faces, outfits, and speaker roles. Preserve typewriter/skip/continue behavior and animal care artwork; locations use a paw rather than pretending to be a human speaker. Missing portrait art has an icon fallback. See docs/implementation/character-portraits.md for generated artwork and scope.

The selectable cast subsequently expanded to seven with golden blonde, violet, and copper-red hair variants. Keep the same picker and native cell sizes; preserve the original character choices. Small dedicated hair ramps extend the incumbent palette so violet and blonde remain recognizable after native export. Each new variant includes the full existing action layout and a matching portrait. See docs/implementation/character-colors.md.

Three distinct male rescuers expand the cast to ten: blonde/denim, violet/mustard hoodie, and copper/green overalls. Keep the same shared picker and clear outfit names. Show a native 96px portrait beside the selected character's name and description; retain sprite previews for earlier appearances without dedicated portraits. Portrait previews reuse the conversation portrait component in its compact size. See docs/implementation/male-characters.md.

## Community discovery map

Mode: Operate. The owner selected MapLibre + OpenFreeMap without a key. Use a geographic map with warm home, teal shelter, and sage commons markers, clustered counts, a searchable place list, and inline preview/entry. Preserve the game's cream/brown interface; geographic basemap text uses normal rendering rather than pixel sampling. Desktop has a 22rem list beside a fluid map; mobile stacks the map above the list and keeps preview content scrollable within the map. Reuse official shadcn controls, honor reduced motion, and keep a functional list/preview when tiles fail. Show sample provenance and approximate/virtual pin meaning. Home listing is opt-in and respects existing access rules. See docs/implementation/community-map.md.

## World immersion expansion

Preserve the incumbent visual world. The physical roofed community board uses original 64px art and normal/available/new/nearby variants; its readable cork-and-paper interface uses pet portraits and canonical shadcn controls. Exploration has a compact right mission tracker and bottom icon toolbar; Homes reuses one Pets/Missions rail. Mobile tracker content opens in a bottom dialog. Categorized inventory uses 32px icons, quantities, details and protected-item messaging. Cat sounds use animated 32px faces and original synth audio with explicit volume, mute and effects controls. Weather stays in the Phaser canvas with pooled rain/splashes and low-opacity clouds/shadows. Night uses tile/sprite tinting and readable warm light zones, with no whole-world dark rectangle. Reduce effects and honor reduced motion; the React operation interface remains fully legible. See docs/implementation/world-immersion.md.

## Spacious community

Preserve the approved open neighborhood: 32px native scale, 80×56-tile world, four-tile main greenway, three-tile cross routes, five-tile gaps between 14×14 plots, quiet lawn between districts. Increase space rather than shrinking sprites. The yard editor is a current-space mode in the existing inventory, with a dynamic grid/footprint and a compact lower drawer on mobile. Public/private/empty plots and local draft versus committed yard state must remain explicit. New Imagegen props use the existing world palette and upper-left light after native export; no generation masters enter runtime.

The integrated `/play` route defaults to the shared community. Explicit `?explore=1`, `?scene=shelter`, `?shelterId=...` and `?animalId=...` retain exploration/profile-return entry. Keep the Phaser canvas mounted across property changes, and release external subscriptions on both scene shutdown and destruction. Geographic maps install places on style readiness rather than waiting for all provider tiles; a same-origin OpenFreeMap relay and a clearly labeled place-only fallback protect discovery.

## Property camera and room refinement

Use the full viewport host for home/yard rendering. Yard grass fills the surrounding view; physical plot/interior sizes remain native. Houses use a centered FIT stage with64 render pixels of total edge allowance, integer camera zoom and nearest-neighbor canvas presentation. Fit keeps every outer wall visible; manual zoom permits panning. Outdoor cropped framing never carries indoors. Keep explicit1×–4× zoom, Fit and Fill controls. World property plates stay small on screen across zoom levels. Interior walls have raised north faces, timber/plaster partitions, side frames and a cutaway doorway. Use docs/images/pawtrail-home-room-reference-v1.png as the original cozy room art reference, with opposing sage loveseats, woven rugs, a round flower table, sage bedding, aquarium, chaise and wicker cat stands. Place actual saved furniture only; atmosphere must not introduce furniture at fixed indoor coordinates. Detailed place discovery retains MapLibre; a normal-image street map supplies visible markers/clusters without WebGL while detailed assets initialize or fail.

## House layout gallery

Settings expands to a large responsive dialog for the owner’s preset choice: three previews drawn from actual room data, a larger selected-floor preview, per-floor room descriptions and a direct Apply action. Use compact Cozy Studio20×14, Connected Cottage24×15 with attic, and Companion House24×15 on two floors. Follow the concept's room connections, stair location and furniture groupings; retain the illustrations in an expandable art reference. Preview and live room share native coordinates and layers. Clearly distinguish preview selection from applying, show available furniture, the versioned one-time furniture pack choice, and five recent saved arrangements. Actual rooms use native furniture, partition walls, door gaps and aligned stairs; design PNGs stay out of gameplay rendering. The active-floor editor preserves shared inventory and protects doorways/landings. Keep custom rooms and old history under legacy contracts until the owner applies a compact plan.


## Community discovery

Preserve the MapLibre/OpenFreeMap surface and warm PawTrail identity. Keep the desktop map full-height beside a compact searchable directory; use a Map/List switch and expandable floating detail sheet on mobile. Photos and compact animal collages distinguish entity membership from geographic groups. Proximity circles represent a separate chosen center/radius, with one-shot opt-in location and a manual alternative. Contributions and welfare always appear in separate sections; never use a Good/Bad label or let green contribution areas imply safety. Empty, loading, unavailable and unreviewed states need explicit language. Compose the official shadcn layer with Tailwind utilities; no replacement primitives or routine page CSS. See docs/implementation/community-discovery.md.

Discovery refinements use the existing PawTrail brand lockup in the header, explicit Community-feed navigation and compact home/account menus. Keep common map actions in a floating toolbar and help/report actions in a floating menu. Nearby results use the same contextual popup zone as animal details, with a persistent count/radius trigger after dismissal. Animal photography gets a 4:3 uncropped preview; place covers stay compact. Explain panel/state changes with fast bounded entrances/exits and local count feedback, honor reduced-motion, and preserve focus on close. Never let mobile map controls paint over the list overlay.

Animal help signals use one slow translucent expanding ring plus a steady status outline/icon. Red indicates an urgent published request or serious corroborated concern; amber preserves missing/under-review wording; routine help stays steady. Groups expose urgent members first. A single bottom-center help prompt is actionable and dismissible, follows the visible/nearby scope, preserves sample labeling, and never automatically pans or opens an animal. Reduced motion keeps the static cue. Do not infer danger from proximity or apply a place allegation to every resident animal.

Urgent directory rows use a red tint, outline, photo ring and an explicit warning-icon badge so urgency is readable without color alone. Concerns stay amber. Animal popups keep Help & missions, Create sighting and Report concern in a non-scrolling action footer beneath the scrollable photograph/details; the help modal places reporting before the longer fact list. Existing source status, authentication and sample-only behavior determine the action flow.

Discovery action buttons use compact six-pixel `rounded-md` corners, standard shadcn variants and neutral labels; avoid pill-shaped action controls. Avatars, geographic animal markers and their attention rings remain circular. Keep game navigation/portal titles neutral rather than inheriting the social platform's teal link accent. Check it out opens a focused help dialog: show the actual public animal, published needs and linked mission, offer private-request help or existing mission participation, and keep sample practice unmistakably local. Do not fabricate a mission or award Kibble when offering help.

Use icon/count discovery filters with compact rectangular shadcn buttons, including Events. Animal detail/help views share a fact panel for age, gender, size and coat/markings, trait badges and sighting/concern actions. Unknown facts stay explicitly unrecorded. Sample animals link to genuine local sample pages and share browser-session offer state; never imitate a real mission enrollment or identification record. Event pins use calendar icons and public venue/attendance metadata. Keep one zoom-control stack and automatic close-zoom street detail/fallback; do not restore a manual street-mode toggle.

## Physical world feedback

Use compact contextual shadcn action menus instead of opening a dialog for routine world actions. Show approach, alignment and action progress only at phase boundaries. The authored moment is a cat approaching, hopping onto a native perch, settling and descending with a grounded shadow. Respect reduced effects and reduced motion. Seats, contact points, collision and occlusion derive from catalog geometry, not transparent image bounds; preserve the existing room composition.

## Shared play shell

Explore is the incumbent visual authority for both story exploration and multiplayer Homes. Compose `PlayShell`, `PlayHeader`, `PlayFooter`, `PlayLoading`, `PlayViewControls` and `GameReactions` from `src/components/game/shared`; keep one control catalog and one reaction mapping. Preserve warm cream/brown tokens, Saira Condensed headings, Instrument Sans controls and rectangular shadcn buttons. Keep local exploration and server-saved housing currency/save provenance visible. Route feature handoffs to the actual world that owns them; never make story scenery appear editable or imply offline chat is live. See docs/implementation/unified-play-shell.md.

## Animal circle and live decoration

The animal circle sits above the lower-left touch controls and uses circular illustrated/photo portraits, clear selected/needs states and compact action menus. Keep other actions rectangular. Homes show actual present residents and visiting companions; away animals stay in the roster. Decoration uses one large shadcn dialog with vertical categories, a furniture grid, the existing live viewport and a stable bottom action bar. Native facings are explicit: disable unsupported directions instead of rotating asymmetric art sideways.


## Reference-led interaction panels

The 8 November dialogue reference now governs NPC conversation and Home pet/furniture action menus. Reuse `shared/interaction-card.tsx` around official shadcn Dialog/Button, with native transparent artwork from `dialogue-ui-v1`. Keep Saira Condensed names and Instrument Sans dialogue/controls. Desktop pairs the portrait and speech with a small garden vignette below; mobile places speech beneath the portrait/name row, hides the decorative vignette and scrolls within the viewport. Preserve keyboard focus, Escape, reduced motion, original dialogue facts and existing action handlers. Do not bake text or controls into raster artwork.


## Live 3D actor models

Players and cats now have procedural articulated Three.js meshes, projected live into the shared Phaser world with nearest-neighbor rendering. Open Settings → Your character → Adjust 3D models for rotation, action previews, colors and proportions. Existing portraits/world art remain in use. Overrides are device-local and never alter platform animal data, collision footprints or verified rewards. See `docs/implementation/live-3d-actors.md` for integration details and limits.


## Native-skin 3D refinement

Keep player silhouettes cozy and rounded, with the existing native sprites as the color/design authority. Player UV skins reuse original front/back/side head/torso pixels. Avoid block heads, invented hats/outfits, white studio highlights, bloom and tone-mapping shifts. Preserve sprite density and native world scale. Distance-based opposing steps and short-arc damped turns share the same runtime in Explore, Home and Yard. See `docs/implementation/live-3d-actors.md`.


### Dedicated UV skins and living idles

The active 3D actors now use dedicated pixel UV atlases for all ten character appearances and ten cat coats, with rounded heads, native outfit/coat palettes and subtle standing breathing/blinking. Avoid reintroducing the superseded runtime sprite-crop mapping or flat box heads. Authoring and verification scope: `docs/implementation/dedicated-uv-skins.md`.


## Zoom-aware city discovery — 9 November 2026

City navigation now has three scales: province/metro database-count circles below zoom 8; thin colored city boundaries and the entrance cue from 8 to below 13; no city geometry, entrance hover cue or city-area click at street zoom 13 and above. The keyboard selector remains available. City drawers show six circular image/icon counts from the real services. Animal totals are unique published profiles; open help and scheduled public events have time/state eligibility. Home counts respect the current viewer’s existing visibility/blocking/realm rules and stay unknown before authentication. Preserve the incumbent theme, official shadcn components, filtering/route priorities and whole-city-only entrances. Firefox desktop/mobile and scoped home counts were reviewed; UI boundary check passed. See `docs/implementation/map-zoom-summaries-2026-11-09.md` for source provenance, evidence and limits.


## Transparent map artwork and zoomed-out hover — 9 November 2026

This update supersedes the lower city-outline cutoff above. Thin city lines and the entrance hover card remain available from zoom 3 to below 13, alongside province count circles below zoom 8. Street zoom still hides lines, hover cues and city-area click entry. Hover cards now share six compact circular database counts with the city drawer. Public photos take priority; missing/broken images use the new transparent, logo-referenced animals/events/home/shelters/groups/help/city illustrations. Reuse the category asset map and shared official-shadcn Avatar composition across markers, summaries and empty banners. Generated art is decorative, never identity evidence or real location imagery. Alpha was inspected on all seven optimized assets; this follow-up is source-reviewed only under the standing no-application-check/no-browser instruction. See `docs/implementation/map-hover-artwork-2026-11-09.md` and `public/pawtrail-game/discovery/map-placeholders-v1.json` for final prompts, provenance and scope.


## Larger category thumbnails and restored animal portraits — 9 November 2026

Render the new transparent category artwork at 125% without extra avatar padding; keep real photos at their existing cover treatment. Individual animal identities again use the former species/coat illustrations. Category artwork belongs to map summaries, place/sidebar rows, map missions, non-animal popup headers and empty banners/help prompts. Use the shared EntityFace to preserve the individual/category distinction, with existing photo priority, count badges and quest state. This supersedes the previous generic category fallback for individual animals. No new assets or backend records were created. Source review only; see `docs/implementation/map-thumbnail-refinement-2026-11-09.md`.


## Selected map marker and closer focus — 9 November 2026

A selected marker uses a steady high-contrast outer ring and 125% scale. Apply the same state to the actual selected shared animal and raise its parent marker group above neighbors. Preserve attention/status cues and route-destination priority. Selecting an item focuses at zoom 16 in both renderers without zooming out from a closer view; follow-up focus shares the floor and respects panel padding/reduced motion. Keep the reverted typography/status-border update reverted. Source review only; see `docs/implementation/map-selected-marker-2026-11-09.md`.


## Painted 3D player portrait — 9 November 2026

The owner clarified that the portrait needs genuine rotation with a painted 2D appearance. Use a separate, detailed 3D bust with wrap-around pixel textures and modeled hair; build only head, neck, shoulders and upper torso. Retain the saved appearance and no-visible-nose preference. Do not use a flat cut-out or enlarge the blocky world head. The shared LivingPortrait has drag/keyboard rotation and an expanded shadcn portrait studio for front, three-quarter, side/back views and idle/smile/happy/talking expressions. Talking follows dialogue reveal and ends with it. Preserve the portrait above Animal Friends, the separate Explore/account appearance sources, reduced motion, pause and local save status. Existing illustration assets remain style references/fallbacks. See docs/implementation/painted-portrait-bust.md.


## Maya reference-specific rebuild

Use Maya’s original image as the specification, not the procedural prototype. `/play?preview=portraits` exposes pinned-camera comparison, overlay, difference, silhouette and projected-anchor errors. It distinguishes baseline, missing authored asset and candidate states; camera drafts are explicit and never auto-fit independently. The Maya-only GLB slot preserves other avatars. Current baseline error is 11.05 px across available clear landmarks; the reference-specific asset is not complete. See docs/implementation/maya-reference-rebuild.md and the artist handoff for exact missing geometry/paint/expression assets.

## Current portrait direction: lightweight original 2D artwork

The owner approved true 2D portraits on 9 November 2026, superseding the rotatable bust/GLB requirements above. Preserve Maya's original illustration and native detail. Use small native eye/mouth atlases for independent blinking, smile, happy and text-reveal talking. No rotation controls. Dialogue, player HUD and creators share `LivingPortrait` with lazy Canvas 2D loading, pause, reduced motion, visibility suspension and neutral snapshots. `/play?preview=portraits` now opens the 2D studio. Cap each complete portrait artwork bundle below 500,000 bytes; current human bundles are about 9.5–31.5 KB. Existing custom silhouettes/accessories need authored 2D portraits rather than being advertised as exact automatic conversions. See `docs/implementation/layered-2d-portraits.md`. Gameplay rigs remain independent.


## Character studio vertex editing

The existing Geometry workspace owns Objects and Vertices modes. Keep the large
model viewport and bounded tool inspector; use official shadcn controls and the
existing model undo stack. Green points, an orange selected point and the shared
translation gizmo identify editable geometry. Preserve UVs, joint attachments,
blink-state geometry consistency and procedural animation by applying sparse
offsets to local clones after posing. Editing is local and reversible; file saves
include the edits. Do not silently turn this into a new rig or a gameplay skin
installation. See docs/implementation/skin-texture-studio.md.

## Item & Ability Studio

`/play?preview=items` expands the existing studio world in Operate mode. Keep the
bounded parts/library outliner, central actor or training canvas, property
inspector and bottom timeline. Use the official shared shadcn controls and
Tailwind utilities, Saira Condensed headings and Instrument Sans controls. On
mobile switch panel visibility rather than compressing all inspectors. Item
appearance, actor motion, ground queries and presentation remain independent.
Preserve local-save wording, cancellable effects/audio, silent timeline scrubbing
and existing E furniture interactions. See docs/implementation/item-ability-studio.md.

## Segmented weapon moveset pilot

Moonvine is a local reference-inspired chain-weapon pilot in Item Studio and
Stage play mode. Preserve J combo buffering, R running sweep, L extension and K
circular special; E remains furniture interaction. Named strike windows,
projected hand sockets, collision-clipped segmented trajectories, target recoil
and bounded impact pauses share the same runtime across both editors. Use the
existing shadcn inspectors and timeline lanes; preserve custom saved items and
legacy Primary/Special files. No live-world or animal combat installation is
implied. See docs/implementation/item-ability-studio.md.

## Body spiral and training camera

Orbit chains use two rising body coils and separate front/rear segment passes
around the actor, preserving Stage depth and ground collision. Effects/Area/Try
share integer 1×–6× zoom with floating small-radius shadcn controls, wheel and
+/−/0 keyboard actions. Zoom changes the camera, not model or tile dimensions.
Preserve projected-hand anchoring, cast state during zoom and custom saves.

## Chain default-state clarification

The chain's default equipped appearance continuously hovers around the body,
including while walking. Use the shared native 3D hover helper in both actor and
item previews, with slow rotation/bobbing, proper body occlusion and no idle hit
logic or sound. Equip exposes a saved toggle; legacy chain files default on.
Attack deployment gathers the idle coils and recovery restores them. Preserve
normal item geometry editing and avoid duplicate resting weights by default.

## Weapon preset selection

The Item Studio header has an official shadcn Sword/Chain Select next to the
character Select. Switching presets retains each preset's current-session draft
and preserves workspace/character selection; saving remains explicit. Custom
imports are labeled Custom item. Keep artwork provenance clear: current presets
use code-created geometry/material colors, native 3D hover links and procedural
2D deployed effects, not generated texture skins.

## Generated texture hammer preset

Ruby hammer uses generated red/gold 2D texture art wrapped onto 3D geometry, with
portable box-2x2 UVs and native indexed PNG exports. Preserve real skin artwork,
large back-carried silhouette, shared body/hand attachment logic and editable
carry transforms. Keep character scale and foot collisions unchanged. The
Sword/Chain presets retain their original material provenance; do not label
those textures as generated. See the item studio guide and asset manifest.

## Human locomotion rebuild

The owner rejected the old stiff movement; the shared human gait now uses
coordinated pelvis/torso counterrotation, heel/toe foot contact, a stronger run,
relaxed bent arms and delayed forearm/wrist motion. Use actor-rig/human-gait.ts
across all human factories and native preview/runtime sampling. Reference-specific
shoulder/hip widths must preserve gait offsets instead of erasing motion.
The previous retain-old-steps brief is superseded. Keep existing character
geometry, skins, joint identities, collision scale and tile sizes. New configured
base speeds are 128/208 px/s; online authority must use the shared rules. See
docs/implementation/human-locomotion-rebuild.md for scope and pending visual review.

Human idle now follows a continuous 2.5-second relaxed breathing cycle through
actor-rig/human-idle.ts. Keep its fixed foot targets, gentle bent knees, staggered
toe-out stance, small hip counterbalance and relaxed arms. Character factories
provide sole heights and preserve the shared motion when adapting proportions.
Do not replace planted-leg balance with a whole-character vertical bob. Live
saved appearances inherit this pose; baked reference sheets remain separate.

## Spectral weapon production

New usable weapons follow `.agents/skills/pawtrail-weapons/SKILL.md`: base actor,
fast front/side concept, actual geometry with generated 2D texture skin, three
regular abilities plus one ultimate, and four matching compact pixel icons.
Reuse the Item Studio and its actual shadcn controls, existing ability runtime,
sound mixer, local saves and stage movement/collision. Spectral companions keep
independent visual rigs, shadows and enlarged render bounds without changing
the player's collider. Preserve spectral alpha and bound pixel-frame caches.
Show generated icons in the action list/hotbar with real cooldown/active states.
See docs/implementation/spectral-swordsman-and-weapon-skill.md for scope and
pending visual acceptance of the first Spectral swordsman preset.

Ability tooltips use the existing dialogue-v2 wood/parchment panel texture through
shared/dialogue-frame.ts and GameTooltipContent, keeping compact sizing, an 8 px
frame and warm brown text. Reuse that helper for future game ability hovers.

Weapons may define their own upper-body idle/carry stance when their grip or
silhouette needs it. Preserve shared breathing and planted feet; blend carries
with walking/running and recover to the correct stance after actions. Paired
equipment reuses the edited geometry/skin with separate hand transforms and
fits the full visual bounds without increasing player collisions. Ivory twin
scythes are the first data-driven carry example; see their implementation guide.

Actual accepted ultimate casts briefly show the selected character's matching
animated illustration on the left through the shared UltimateCutIn. Reuse
existing illustration frames/cache; keep the overlay click-through and about
one second, respect reduced motion and clear it on lifecycle changes. Failed
input and silent scrubbing never trigger it. Chain skills have their own
generated compact icons and authored mechanics-based descriptions.

Every new weapon needs its own compact equipment-selection icon, separate from
its four ability icons. Use the shared WeaponIcon in selectors, equipped
headers and saved inventory. Preserve the validated weaponIcon field in local
packages; reuse existing icons for focused mechanics revisions.

## Amber depth trial

`?compare=amber-volume` compares the approved Amber with an isolated fuller
variant: rounded torso/hip/sleeve cross-sections, native side/rear cloth maps,
and deeper layered hair. Preserve her approved face, front-view identity, feet,
rig/action paths, pixel resolution and game collision scale. The cape keeps its
existing motion with additional rear clearance. This remains a review-only
variant, not a roster replacement. The owner accepted its visual direction as
the actor skill's baseline; broader action acceptance remains pending. See
docs/implementation/amber-volume-study.md before any wider promotion.
