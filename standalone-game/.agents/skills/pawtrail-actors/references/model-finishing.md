# Reference-specific pixel-RPG model finishing

The owner approved Amber's curved narrower face, layered pointed hair, stronger
texture detail, rounded/tapered shoulders and fuller body/hair volume. Carry those quality
improvements into future model work while adapting the shape to its reference.
This concerns articulated 3D gameplay bodies rendered to native pixels, not the
separate illustrated dialogue-portrait pipeline.

## Adapt each character deliberately

Build after the approved animated illustration, using its full-body still as
the primary anatomy, silhouette and material reference. The separately selected
portrait may use Refined cel even when the illustration uses Painterly anime
fantasy; do not let that rendering difference replace the model's construction
reference. Where the hero pose leaves depth or back construction unclear,
generate matching static views for the necessary front/three-quarter/side/back
angles. No extra animation is required for those reference views. Reconcile
inconsistent proportions, clothes or accessories before using them for geometry.

Before changing geometry, identify the reference's face width and jaw, head/body
ratio, hair volume and parting, shoulder slope, sleeve shape, costume layers and
accessory clearance. Separate identity features from art-style treatment. Use
Amber's techniques for a matching pixel-RPG direction; preserve a different
explicitly chosen style or body type. A broad character should not acquire
Amber's narrow face or shoulders simply because that example was approved.

Reuse shared joints and action functions. Adjust visible meshes, cross-sections,
UV placement, colors, accessory offsets and small garment pose corrections for
the actual character. Existing slots can suffice for a simple variation; an
elaborate silhouette needs new shaped pieces rather than only a new skin. Keep
adjustments local to the requested model unless a shared change is authorized.

## Faces

- Use curved cross-sections or an equivalent shaped surface for a face visible
  from multiple headings. Avoid a flat front extruded into a thick slab with
  vertical side walls. Texture alone cannot repair a box-shaped profile.
- For the approved anime direction, narrow the cheeks relative to head height
  and taper into a readable chin. Tune forehead, cheek and jaw depth together;
  judge the three-quarter and side silhouette as well as the front. Fit ears
  and neck to those proportions. Keep the no-modeled-nose preference.
- Map character-specific whole open/half/closed face artwork to the curved face.
  Match eye spacing, lash shape, iris and mouth placement across those states.
  Do not reuse incompatible blink patches or stretch another actor's face atlas
  onto a new head without adapting it. This body texture workflow does not
  replace the separate portrait skill's authored emotion/speech-frame rules.

### Face-shape review

Treat face silhouette and its separation from adjacent skin as explicit review
points. A pleasing UV patch does not establish that it fits the actual head.
When the owner explicitly selects an existing actor's face shape, reuse that
actor's actual geometry/profile and UV convention instead of approximating its
proportions independently. `actor-rig/anime-face-geometry.ts` shares Amber's
approved profile with Yae's Amber-style trial. Preserve the new character's own
eyes, expression, palette and hair; matching a face style does not mean copying
the reference actor's identity. Keep this an explicit style selection rather
than changing all actors to the same face by default.
The owner subsequently retained the earlier per-character implementation:
Yae's own profile with a soft jaw contour is the preferred default. The
Amber-profile transfer remains an optional experiment, not a new global standard.
Before changing proportions, check whether similar-colored cheeks, neck and
shoulders merge because an internal jaw contour is missing. The owner preferred
Yae's original shape once this distinction was identified; narrowing it had
addressed the wrong cause.

1. Before generating or fitting face artwork, record the intended cheek-width to
   face-height relationship, where the lower jaw starts tapering, chin width,
   eye spacing and hairline for this reference. Use visible skin landmarks;
   exclude the hair/ears from facial width. Compare matching headings and account
   for head tilt or perspective. If the reference does not establish a proportion,
   label the choice as an interpretation rather than claiming a measured match.
   Amber's proportions are not a substitute for doing this for Yae or another actor.
2. Inspect generated open/half/closed artwork together for consistent eye/mouth
   positions and expression. Prompt for the character's eye spacing and jaw style,
   but recognize that the outline and depth of a 3D face come from the mesh, not
   the rectangular UV patch. Regenerating textures alone cannot narrow broad cheeks.
3. When visual review is authorized, inspect the assembled head at front,
   three-quarter and side, at native scale and an enlarged nearest-neighbor view.
   Compare face width/height and jaw taper against the intended shape, then assess
   cheek depth, exposed skin beside the eyes, chin profile and eye spacing after
   UV projection. View open/half/closed eyes and representative idle/walk frames;
   clothing or a beautiful hair texture must not distract from a poor face fit.
   Keep the eyes, full jaw and chin inside inspection crops. If hair or accessories
   obscure a view, record that limitation or use an authorized inspection view;
   do not mark an invisible profile as a successful shape match.
4. Distinguish a shape mismatch from a missing separation edge. When proportions
   already match, preserve them and use a thin warm contour along visible cheeks
   and the jaw, lighter and less bold than the outer sprite silhouette. Tune at
   native size; avoid black double-width borders, halos or strokes across the
   eyes/mouth. An appropriately colored expanded back-face shell can provide
   this contour on the actual model without new face-atlas generation. A thin
   surface-bound jaw seam can strengthen separation from adjacent neck skin
   where the shell alone disappears at native pixel size; the
   shared `actor-rig/face-contour.ts` helper is the Yae implementation. Its width
   and color need fitting to each model and pixel density, not blind copying.
   When a real shape mismatch remains, correct cheek/temple/jaw sections and depth; refit ears,
   fringe, cheek locks and headwear around the corrected face. Avoid squeezing
   the entire head indiscriminately or hiding a wide mesh behind thicker hair.
   Recheck the silhouette and facial features after those adjustments. Keep a
   synchronized before/after with the same costume to make the change assessable.
5. Record the outcome and remaining uncertainty before expanding the character
   to other looks or promoting it into the roster. A source-code ratio, generated
   atlas inspection or owner approval of a different actor is not visual
   verification of this assembled model. Respect current review permissions;
   if they exclude browser work, leave that status explicit rather than claiming
   a pass or adding unauthorized automated checks.

Yae's original 10.5-by-13.1 face is retained. A temporary 8.4-wide revision was
superseded by the owner's diagnosis: restore the original shape and separate the
face from the shoulders with a softer internal contour, as in Amber. Neither
ratio is a universal target or a measured ratio from the tilted illustration.

## Hair and headwear

- Build a rounded crown plus distinct fringe, temple/cheek locks and the long
  side/back sections the reference actually has. Use swept paths and tapering
  volumes with pointed, staggered ends to change the real silhouette. Avoid a
  solid helmet, rectangular curtain or a collection of identical straight rods.
- Give crown, swept fringe and long locks appropriate directional UV maps.
  Use coherent dark separations, grouped highlights and smaller sheen clusters
  that follow strand direction. Tune their density at native resolution so
  detail reads as pixel clusters rather than smooth plastic or noisy speckles.
- Fit accessory geometry to the new head. Amber's old rectangular goggle band
  exposed a flat top that made even the rounded hair look boxy; a curved fitted
  strap fixed that. Examine bands, hoods, hats and goggles as possible causes
  before repeatedly changing the skull or adding more texture.
- Attach roots to Head. Long sections use delayed, restrained secondary motion
  appropriate to their length and weight; short hair should not swing like a cape.
- Inspect the crown and every lock in profile. Give them actual front-to-back
  thickness and overlap, with pointed tips and visible separation between layers;
  a rounded frontal outline can still conceal a flat side silhouette. Expand
  rear volume around the existing head rather than inflating the approved face.
  Refit straps/headwear around the fuller crown, keeping their identity features.

## Body depth and volume

The owner accepted Amber's fuller-volume variant at `/play?compare=amber-volume`
as the new construction-quality direction. Use its techniques for matching
pixel-RPG models while fitting the actual reference's body type and costume.

- Build torso, waist/hips and relevant sleeves with rounded, tapered sections
  and intentional front/back depth. Avoid slab-like extrusions, cylindrical
  stick limbs or oversized spherical padding. Chest, waist and hips need
  distinct profiles and continuity at the shoulders, elbows and wrists.
- Preserve approved facial proportions, eye artwork and front-view identity.
  For an existing-actor depth revision, primarily reshape the depth axis;
  don't widen the head, enlarge the whole actor or alter feet to imply volume.
  New characters still need their own reference-specific facial construction.
- Keep original front artwork where it fits. Give exposed side/rear cloth
  surfaces suitable UVs and small painted seams, folds and highlights instead
  of stretching or repeating the front decoration around the entire body.
  Use the established palette, nearest-neighbor maps and discrete upper-left
  shading so added geometry retains the pixel-art look.
- Fit garment layers, belt, trims, cuffs, gloves and headwear to the new volume.
  Clear the back for a moving cape and the neck/shoulders for long hair. Preserve
  the existing secondary animation; adjust clearance deliberately rather than
  flattening the body or suppressing motion to hide intersections.
- Keep the same skeleton, joint identities, shared poses, feet anchors, movement
  parameters, tile size, collider and camera/native resolution. Geometry depth
  and texture density are separate decisions; increasing pixels alone does not
  repair volume, and fuller geometry alone does not repair an awkward gait.
- Compare before/after at front, three-quarter and true side in idle, walking
  and running with identical scale, anchor, camera and phase. Inspect the side
  silhouette, UV seams, arm/torso overlap, hair/cape clearance and ground contact
  at native size and integer enlargement. Follow the existing verification
  permissions; then review affected care/rest/emote actions before promotion.

Amber's implementation uses tapered elliptical garment sections, separately
painted side/rear surfaces and thicker crown/individual locks while retaining
her approved face, shoulder caps, feet and shared motion. Its roughly 20–28%
hair-depth changes and small rear cape offset are specific fitting examples,
not numeric defaults for Yae, other hairstyles, gowns or armored characters.
Her visual direction is owner-approved; the complete action set was not thereby
visually verified. Existing roster/saved appearances remain unchanged until a
requested installation applies the appropriate factory.

## Shoulders and garment shape

- Form shoulders with rounded/sloping caps and sleeve cross-sections tapering
  into the elbow, rather than an extruded polygon with a flat top and straight
  walls. Match the reference: fitted jackets, puff sleeves and armor need
  different profiles. Rounded does not mean oversized spherical padding.
- Tune shoulder-joint spread and resting arm angle where needed. Maintain
  torso overlap and elbow/wrist continuity during walking. Fit emblems, piping
  and cuffs to the garment instead of leaving them floating or protruding.
- Amber's example uses seven elliptical sections with sixteen radial segments,
  shoulder roots ±6.4 instead of ±7, and a 0.055-radian outward arm angle instead
  of 0.09. These are example measurements, not defaults for all characters.
- Preserve accepted feet, costume pieces and cape movement during a focused
  shoulder revision. Changing one region does not authorize a whole-body redo.

## Painted surface and motion continuity

For every model, inventory any long hair, robe, cape, scarf, ribbon or other
waving part and explicitly review its **texture and volume**, when present.
Use curved/tapered hair masses with layered locks; give cloth a shaped/draped
shell, folds, separated lining and suitable hem/edge thickness. Thin cloth may
remain thin, but its side silhouette and folds must describe a real volume.
Do not substitute a flat single-color plane, a rigid slab or a double-sided
material flag for authored shape and surface detail.

Map coherent texture onto every exposed direction, including cloth reverses,
linings, edges and hair undersides. Fit UVs so folds/strand direction follow the
form rather than stretching one front image around the whole piece. Inspect
front, three-quarter, side and back at rest and at maximum swing in idle, walk,
run and applicable attacks/care/rest actions. Repair disappearing backfaces,
unpainted reverse surfaces, paper-thin hair, seams, clipping and detached roots.
Keep the existing rig, pixel style and shared motion; this does not require
expensive cloth physics or a new skeleton for each costume.

Use distinct maps where surface direction or material changes. Geometric edges
establish volume; pixel seams, folds, edge shadows and clustered highlights
describe it. Nearest-neighbor sampling, no mipmaps and the existing bold native
contour preserve the 2D appearance. Fixed discrete vertex shading can add depth
without smooth realistic lighting. Keep the established upper-left light cue.
Reuse existing artwork/palettes when they fit; generate new UV artwork only for
a concrete missing surface and preserve its source/prompt and optimized export.

Keep cape and hair motion on a continuous secondary clock with an eased movement
weight, independent of clip changes. Preserve shoulder attachments and feet
anchors. Tune cloth motion for that costume instead of copying Amber's cape
amplitude onto every garment. Dispose replaced meshes/materials/textures through
the shared ownership path; ensure the base pose cannot reveal archived geometry.

## Focused review and implementation references

When review is authorized, compare front, three-quarter and side at native pixel
scale and an integer enlarged view, with idle and walking. Use the same camera,
ground anchor and phase for before/after; isolate the changed region by keeping
other approved features identical. Look for flat planes, unreadable eyes, hair
occlusion, floating trims and joint gaps. Review additional affected actions when
installing the model beyond the idle/walk study. Respect the workspace's limits
on browser verification, tests and builds; report what was actually reviewed.
Owner acceptance of Amber is not acceptance of every future adapted model.

In the PawTrail workspace, the concrete examples are:

- `src/game/actor-rig/amber-anime-head.ts`: curved face, layered locks and strap.
- `src/game/actor-rig/amber-study-rig.ts`: `createAmberHeadStudy` and
  `createAmberShoulderStudy`, shaped sleeves and continuous cape deformation.
- `src/game/actor-rig/amber-study-textures.ts`: face states and directional maps.
- `src/game/actor-rig/amber-volume-study.ts`: `createAmberVolumeStudy`, rounded
  garment sections, side/rear maps and fuller layered hair with the same rig.
- `src/game/runtime/amber-study-scene.ts` and
  `src/components/game/amber-model-study.tsx`: isolated synchronized comparison
  at `/play?compare=amber`, with angle controls and texture inspection.
- `src/game/runtime/model-studies.ts` and
  `src/components/game/amber-volume-study.tsx`: approved current-versus-fuller
  direction at `/play?compare=amber-volume`, including idle/walk/run views.
- `docs/implementation/amber-head-study.md` and `amber-shoulder-study.md`:
  implementation scope and revision-specific review records.
- `docs/implementation/amber-volume-study.md`: fuller-volume scope, owner
  acceptance and outstanding action-review status.

The integrated app mirrors these under `src/features/neighborhood/`; it is not
a second independent implementation to redesign. Neither these trial factories
nor this skill update promote Amber's geometry into all saved/game actors.
