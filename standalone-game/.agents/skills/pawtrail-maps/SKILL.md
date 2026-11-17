---
name: pawtrail-maps
description: Turn a description or reference into a PawTrail map concept for owner approval, then build the approved editable map with PawTrail Assets, animated scenery and 3D interactive props. Excludes geographic community maps and unrelated editor rebuilds.
---

# PawTrail Maps

Read the current workspace's `AGENTS.md` first. Creating or revising this skill
does not itself authorize map generation, runtime changes or installation.
Carry forward the owner's selected theme and representation. Work directly;
agents, automated checks/tests/builds and browser verification remain subject
to the current project's permissions. Prefer Firefox unless the owner requests
another browser. Complete authorized authoring work before requesting any
genuinely missing approval; keep unavailable visual review explicitly pending.
The concept approval below is an explicit owner requirement, not an optional
review timer.

## Visual contract

Use the existing **top-down three-quarter, textured 2D** world as the starting
point: native terrain, complete transparent scenery cutouts, warm material
shading, stepped outlines, contact shadows and grounded depth ordering. The
reference's dimensional appearance comes from its artwork and composition;
the whole map does not need rebuilding as 3D geometry. The owner's map-production
choice is **3D for player-interactive assets**, with illustrated textures where
appropriate; scenery can use animated 2D frames/layers. This is a workflow choice,
not a claim that interaction technically requires 3D. Retain the current actor
representation and shared movement/interaction systems.

**Default art direction:** the owner approved the Care Grove v5 finish and its
village reference. Carry its muted material colors, deep colored shadows, fine
pixel texture and restrained brown contours into future maps and new map assets.
Use the retained approved images in [reference and style](references/reference-and-style.md)
without reopening the settled darkness/outline choice. A new owner brief can
override it; the requested biome and content still determine what is drawn.

Read [reference and style](references/reference-and-style.md) when establishing
the composition or generating art. It retains the owner's style reference,
approved map and scenery examples, plus the earlier layout reference. Inspect
the relevant images and selected assets; screenshot HUD labels are not requirements.
A newer reference or map brief takes precedence over this retained example;
adapt the composition to the requested biome and purpose.

Read [workspace integration](references/workspace-integration.md) before writing
layout data. It identifies the real asset registries, stage schema, world-map
format, controller boundaries and current registration gaps. Refresh relevant
source definitions when they change instead of treating this snapshot as an API.

## 1. Turn the description or reference into an approved concept

For planning an entire themed floor with multiple stages, ecosystem, quests and
encounters, use [PawTrail Floors](../pawtrail-floors/SKILL.md) first. Consume its
reviewed stage graph, shared/local lobby distinction, content IDs and asset brief
for each map. Floor planning does not itself authorize map production or approve
unseen map concepts; keep this skill's image-review gate.

Accept a written description, one or more reference images, or both. A reference
is optional: infer a coherent composition from the description rather than
requiring the owner to find one. Reflect the setting, camera, lighting, main
route, landmarks, scale and intended interactions in a concise brief.

For a new map, use the available image-generation workflow to produce **one
complete concept image of the map you envision** before creating production
asset sheets, models, editable layout data or runtime changes. Show the generated
image, briefly explain the main route/landmarks and planned motion, then ask
whether to build this version. The image is a composition proposal, not proof
of gameplay, an installed map, or a reusable asset atlas.

**Wait for explicit approval of that concept.** No reply means keep the job
`awaiting_concept_approval`; do not treat silence, an old style approval or a
furniture art-review timeout as permission to build. If the owner requests
changes, revise the concept and show the revised version for approval. Record
the approved image/version and reply. Approval authorizes production within the
agreed map scope, not unrelated systems or extra verification permissions.

For an approved map's focused asset/animation repair, reuse its approved concept
when the composition is unchanged. A materially different layout, theme or
landmark requires a revised concept approval before dependent production.

## 2. Plan the approved map and its assets

Identify the requested operation: composition/plan, editable stage, playable
local map, existing-map revision, or connected world installation. Implement
only that operation. A stage PNG and an imported editor layout are distinct
from an installed world scene. A request for an authoring skill is not an
instruction to replace the current world.

Record the map's identity, purpose, mood, dimensions, entry/exit positions,
landmarks, main route, optional detours, intended interactions, actor scale and
delivery target. Infer routine choices from the reference and current game;
ask only when a consequential unresolved choice blocks the work. A supplied
camera/style choice does not need to be reopened for every map.

Inventory the relevant manifests once. Select actual asset IDs, source files,
native frames, anchors, footprints, available facings and supported actions.
Separate already registered assets, existing art needing registration, and
genuinely missing art. Reuse the first two groups before generating anything.
Use the current native tile size and lighting; do not size scenery against a
portrait or shrink the actor to fit an incorrectly scaled doorway.

Use [PawTrail Assets](../pawtrail-assets/SKILL.md) for new or revised map assets.
Pass the approved concept, relevant reference crops, native scale, actual asset
IDs, required actions/facings and animation plan. The map skill owns composition,
placement, navigation and installation; the asset skill owns the production
art/models, animation package and per-asset contacts/state contract. Reuse
approved complete packages rather than restarting them for each placement.

Every asset needs an animation decision. In cyberpunk maps, include actual
moving holograms, staggered building/window/sign lights and appropriate motion
for active equipment; use separate subtle reflection/emissive layers for ground
and structural pieces. Do not deliver the city as static PNGs alone. Motion must
be implemented and consumed by the selected renderer, not merely described in
a manifest or simulated by pulsing the entire map. Follow the asset skill's
[animation contract](../pawtrail-assets/references/animation-and-interaction.md).

Keep one durable job record with the brief, source/reference paths, declared
asset/layout inputs, destination, omissions, phase status, actual start/end
times, concept approval, asset representation, animation decisions, evidence and
review dependencies. Resume that record on later turns.
Use existing tooling only for operations it actually supports; the actor-job
CLI is not automatically a map-job CLI.

## 3. Build the approved editable composition

Place the focal landmark, perimeter masses, entrances and a connected primary
route first. Keep the actor's movement area legible. Then add secondary routes,
small destinations and resting/interaction pockets. Use asymmetry and intentional
clusters rather than distributing every prop at regular grid intervals.

The reference-led composition can retain an upper-right landmark, wooded/rocky
left edge, open central activity area and branching dirt/stone route below it.
Give the map its own paths, silhouette, destinations and environmental story.
Use the approved concept as the composition target, including when most assets
already exist. Do not replace its review with a finished-map screenshot after
production. Preserve route/landmark relationships while adapting exact spacing
to real actor clearance; show a revised concept if the necessary changes alter
the approved composition substantially.

Keep terrain and placements editable. Preserve spawn points, navigation blockers,
portals and interaction definitions as actual data. A flattened illustration is
a visual reference or backdrop, not a substitute for those gameplay contracts.

## 4. Produce and place the approved asset packages

Use compatible grass/dirt variants, connected path pieces, soft-looking authored
transitions and small patches of gravel or exposed soil. Derive connector frames
from the real manifest and adjacency, including corners and dead ends. Preserve
seamless joins and tile semantics; an attractive shore tile alone does not make
water impassable. Mix texture in coherent patches rather than noisy random cells.

Place large buildings/trees first, then shrubs, fences, benches, signs, care
stations and restrained ground clutter. Match the pack's light direction and
material divisions. Preserve alpha, native proportions and readable contrast.
Avoid broad texture stretching, photoreal surface substitutions, heavy global
brown tint, arbitrary sprite rotation and repeating obvious clusters everywhere.

Use the renderer's supported ground/world/foreground layers and ground-anchor
sorting. Tall art bounds are not walking colliders. Keep tree trunks/building
bases physically grounded while allowing correct visual canopy/roof overlap.
Front occluders and interaction-facing variants must use actual supported assets
or explicit renderer integration, not unused metadata. Elevation is not proof
of a walkable upper floor, bridge or staircase.

Generate only missing tiles, transitions, facings, landmarks or animation layers
through PawTrail Assets, using the approved concept and inspected native art.
Preserve transparent backgrounds for cutouts/overlays; terrain intended to fill
a cell should cover it. Keep sources/prompts, frame definitions and provenance.
The asset skill routes furniture, actors and monsters to their specialist skills
as needed; do not restart existing packages for placement. Newly authored
player-interactive map props follow the selected 3D requirement, including real
actor contacts and state motion. Passive collision or ambient animation alone
does not turn a scenery asset into a player-interactive prop.

## 5. Connect collision, animation and interactions

Use existing navigation and actor foot geometry to keep spawns, routes, gates,
doors and approach points reachable. Allow the actor's visible outfit and motion
appropriate clearance too. Distinguish solid trunks/walls/rocks, passable decor,
water/hazards and authored walkable surfaces. Prevent diagonal corner cutting
and spawns inside obstacles. Base interaction approaches and exits on the active
furniture facing's geometry; preserve sit/sleep/state behavior when applicable.

For requested doors, care stations, seating, harvestable plants or environmental
reactions, connect the real controller/event and visible state. Examples include
a bush responding to contact, a light changing its actual on/off state, or
footprints following an existing wet status. Reuse supported systems; a sprite
with a label is not an implemented interaction. Record missing contracts before
promising functionality. Do not add combat or every example mechanic by default.

Bind ambient loops and action/state clips to the actual map renderer. Use
elapsed time with bounded updates, per-instance offsets, offscreen culling and
pause/disposal on exit. Keep building geometry still while light layers change;
keep a hologram's base grounded while its projection moves. Reduced motion must
retain readable states without flashing or large continuous motion. A 3D source
baked to sprites is not live 3D: if the current renderer cannot meet the selected
interactive representation, resolve and disclose that gap before promising it.

Every action must visibly register pending, blocked, failed, completed or changed
state as appropriate. Confirmed fictional hits require animated contact sprites
at the affected target plus applied damage/status feedback. Sound, tint or a
console message alone is insufficient. Keep effects bounded and reduced-motion
feedback useful. Local progress, saves and Kibble remain explicitly local;
platform records/rewards still require their real backend authority.

## 6. Export and install the selected scope

Reuse the stage editor and current map loader instead of creating an editor per
map. Export versioned layout data, its asset/dependency list and a native overview
when included in the requested authoring scope. Preserve existing maps and saves.
Include consumed animation atlases/layers or model clips, per-asset frame/timing
metadata and references to any interactive 3D source models. A still overview
does not complete the animated asset delivery.
Register a connected world destination, its entry, return route and save/re-entry
handling only when that installation is requested. Report the actual working
entry point, not an invented scene URL.

Keep source sheets, reference images and job records out of runtime imports and
unbounded CSS scans. Share atlases/caches, load the selected map's assets, cull
offscreen scenery, index collision geometry and bound ambient effects. Dispose
map/actor resources on exit. Large worlds need an intentional chunking/streaming
plan rather than one huge stitched texture or preloading the whole collection.

## 7. Review, repair and hand off

Inspect the native overview against the reference and the selected PawTrail art.
When authorized, review the actual map with the real actor at native/integer zoom:
main route and detours, entries/exits, collision, foreground occlusion, interaction
approaches/results, texture seams and actor readability. Check the changed scope;
include loop seams/speed, hologram motion, localized lighting, interaction clip
transitions and reduced-motion presentation. Never infer animation quality from
one still frame or a generated concept.
Expand to dependent behavior when a renderer, registry, geometry or loader changes.
Reuse exact unchanged evidence and avoid unrelated mobile/couch/world-wide tests.

A capture, loading success or structural readiness is not visual acceptance.
Record concrete pass/fail/pending observations and repair failures at their source.
Do not disguise missing art with flat shapes, disable collision to hide bad routes,
or mark a PNG export as proof of gameplay. Keep unobserved required review pending.

Deliver the approved concept, actual layout/map files, asset/animation reuse and
gap list, representation of interactive props, available preview/entry, observed
checks and remaining limitations. Record real phase durations, separating
service wait from avoidable retries. Do not omit details or checks merely to make
a batch appear faster; subsequent maps should reuse the established production
path and regenerate/export only affected content.
