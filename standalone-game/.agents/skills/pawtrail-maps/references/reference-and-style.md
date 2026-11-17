# Reference-led map direction

The owner approved the Care Grove v5 art direction on 2026-11-15 and asked to
remember it in this skill. This is the default for future PawTrail maps and map
assets unless a new brief changes it. Inspect the retained examples before
authoring rather than asking the owner to choose darkness or outline weight again.

| Retained image | Role |
| --- | --- |
| [Village reference](village-style-reference.png) | Owner's target for material values, shading, perspective and fine pixel detail |
| [Approved Care Grove finish](approved-care-grove-style.png) | Accepted application of that style to PawTrail terrain and scenery |
| [Approved scenery](approved-village-scenery.png) | Accepted timber, slate, masonry and prop rendering; separate transparent cutouts |
| [Original layout reference](reference-layout.png) | Optional woodland/landmark composition inspiration, not the current palette target |

The approval is for the visual art direction. Live navigation, contacts and
interaction playback retain their separate review status and permissions.

## What makes the reference work

- A top-down three-quarter view gives trees and architecture visible fronts and
  tops while keeping the ground easy to navigate. It is not a requirement for a
  true diamond/isometric tile grid.
- A substantial building anchors the upper-right edge. Trees, rocks and a rough
  boundary frame the left side. The center remains a readable activity space.
- A worn crossing route occupies the lower portion and connects smaller paths
  to destinations. Stone and dirt edges vary organically rather than forming
  one sharply stamped rectangle.
- Large and small foliage overlap in groups, with open pockets between them.
  Ground texture continues beneath the objects. Contact shadows connect the
  scenery to the terrain, while vertical silhouettes create depth.
- Warm ochre/brown earth, muted greens and material highlights provide richness.
  The ground is quieter than the player and interactable props.

Adapt those relationships into an original PawTrail composition. Preserve the
game's native asset design, palette, upper-left lighting and pixel texture.
The reference's title, HUD, reward icons, cemetery props and exact building
architecture are not automatically part of the map brief.

## Approved rendering characteristics

Use the approved map and village screenshot together for muted low-key daylight
and material values. The settled palette uses
weathered brown timber, grey-brown masonry, desaturated blue-grey slate roofs,
forest/ivy greens, deep colored recesses and restrained warm highlights. Keep
fine authored pixel texture and precise dark brown edges. Avoid chunky sticker
contours, broad flat cartoon pixel clumps, bright beige/yellow-green washes,
crushed black silhouettes and an indiscriminate global dark/sepia overlay.

Apply the finish to actual terrain/scenery assets. Do not grade the actor and
HUD until they disappear. Maintain readable ground routes and useful prop
separation. Terrain stays continuous, with organic dirt/grass transitions and
imperfect cobbles rather than grid lines or repeated square cell boundaries.
Separate props have genuine transparent alpha without haze/glow/matte halos.
The screenshot's health bars, combat actors, debris effects and UI are not
instructions to add unrelated systems.

Match value relationships through material shading: readable grass/earth
midtones, deeper mortar/wood/foliage recesses and selective lit edges. Keep
outlines fine at the asset's native gameplay size; use internal accents for
structure without turning every leaf or stone into a heavy black-bordered shape.
Choose the matching existing pack or generate a missing piece from these visual
references. A new map does not require regenerating approved reusable artwork.

Carry these rendering choices into the requested setting. This approval does
not require every map to contain a medieval village, cottage, stone hall or the
same woodland arrangement. Preserve the user's theme, layout and requested scope.

## Working with PawTrail's existing art

The inspected native pack uses 32px terrain cells, three-quarter buildings,
layered green foliage, terracotta/wood roofs, warm outlines and painted pixel
clusters. Start with those real pixels rather than generic blocks or an unrelated
realistic asset pack. The supplied game's mood can guide density and material
detail without globally darkening PawTrail until actors and routes disappear.

Give ground regions a hierarchy: broad calm grass, connected dirt/stone travel
surfaces, smaller worn edges, then occasional flowers/rocks. Preserve deliberate
empty space. Use grass variants in patches, break up long fence runs and place
flora in groups of varied size. Avoid a mathematical scatter grid unless a
planted bed, orchard or other deliberate structure calls for one.

Check consistent light, scale, outlines and ground anchors before mixing the
older native sheets, community cutouts and newer furniture art. Reuse an actual
bench's active facing and contacts. A front-only tree/building stays front-only
unless more views are authored; do not spin its screen-space picture to imply
geometry. Keep foliage, shadow and collision boundaries distinct.

## Example brief: Sampaguita Care Grove

This reusable composition brief led to the installed v5 stage. The retained
approved map shows its accepted finish; a new map can use a different theme,
composition and dimensions. See workspace integration for current installed paths.

- **Purpose:** a peaceful outdoor care and exploration space with one clear loop.
- **Starting size:** 32 × 24 native tiles, adjusted for the actual brief and
  supported authoring/runtime limits.
- **Upper-right landmark:** a PawTrail shelter or resting pavilion with a small
  arrival court, framed by warm roofs, signs and planted pots.
- **Left boundary:** clustered large/small trees, shrubs, rocks and short fence
  segments; keep a visible gateway where the route enters.
- **Center:** an open care garden with a feeding station, flowers and a bench
  pocket. Approaches stay clear, with a safe seat exit.
- **Lower third:** a branching dirt/stone path leading toward the landmark and
  around the garden; use authored connector/transition pieces at intersections.
- **Distinct identity:** a paw-sign wayfinding motif, clustered local planting,
  animal-care destinations and an asymmetrical loop with an optional quiet nook.
- **Gameplay:** use already supported seating/care behavior when included; connect
  any new exit/interaction explicitly. Animals/NPCs are added only when requested
  and through the correct local or platform data path.

Keep the resemblance in composition, depth and textured ground. Let PawTrail's
buildings, props, paths and destinations make the result its own place.

## Visual review prompts

At the intended integer zoom, inspect route readability, transitions/corners,
repeated texture patterns, lighting consistency and the actor against the scene.
Walk behind a tree, in front of a facade, through a gateway and around a corner.
Approach and leave each requested interaction. Inspect the focal landmark and
the quieter perimeter, not just a centered beauty shot. Confirm that ambient
movement is calm and bounded rather than pulsing the entire map.

Use live review only when permitted by the current project instructions. A source
sheet, generated map concept or exported overview alone cannot approve collisions,
movement, depth sorting or gameplay interactions.
