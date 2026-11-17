# Actor representation comparisons

Compare the existing approved character without silently replacing its live rig
or saved appearance. Reuse the model, identity, palette and companion portrait,
icon and illustration. A focused comparison is not a new-actor creation request.

- **Full 3D:** real articulated geometry with lighting and unfiltered rendering.
  Textures are valid on a 3D model; preserve important painted eyes/face/outfit
  details rather than stripping them and losing the actor's identity.
- **3D + 2D:** the painted rig rendered into the established native pixel frame,
  or explicitly identified baked exports. Label live versus baked accurately.
- **Native 2D:** separately authored, transparent sprite frames or cutout layers.
  Do not relabel a 3D rendering as native 2D art. Retain source and prompt.

- **Part-built 3D → baked 2D:** a separately authored mesh, exported offline to
  native animation sheets. Retain the model source and show its actual views.
  Playback loads sprites only; do not keep a hidden live rig behind the sheet.

Use the same frame bounds, feet anchor, approximate character height, heading,
action intent and cycle duration. Offer the common supported actions/directions;
never pretend a reused stride or mirrored angle is separately authored. Keep
unsupported diagonal, sprint, prop or interaction states explicit. A small native
2D comparison does not complete the full actor action acceptance requirement.

Separate pose playback from actual gameplay movement/abilities and server state.
Visible mode, pause, restart, loading and errors should match the real result.
Keep a grounded shadow and reduced-motion pause. Preserve required contact
sprites and actual applied damage when the comparison includes combat; an idle /
walk pose study need not invent combat or new rewards.

Prefer one selected version loaded at a time, on request. Reuse bounded frame
buffers; do not cache every possible phase/direction or mount a second GPU
renderer for a preview modal. Native sprite-only mode should not instantiate a
hidden 3D rig. Record compressed/decoded asset size and dispose owned resources.

Respect workspace verification permissions. Inspect generated/native artwork,
then review alignment, seams, all offered actions/headings, interruption/reset and
resource ownership when authorized. Source inspection does not prove smooth
motion. Record unperformed tests and live acceptance as pending.

Amber's scoped example is `/play?compare=amber-representations`. The comparison
uses four cardinal directions and idle/walk/run. Its native sprite manifest
records whether Run has dedicated artwork or reuses the stride at faster cadence.
