# Keep portrait styles distinct

Read the active workspace's `src/game/actor-rig/portrait-style-definitions.json`
and `docs/implementation/portrait-style-contracts.md` before generating a named
style. They pin original design references, hashes, dimensions and rules. Inspect
the actual reference image; its name and a palette count are not sufficient.

Sharp cel uses bold irregular stepped contours, angular flat shadow blocks,
narrow lids and restrained rectangular highlights. Compact fantasy uses compact
proportions, squared irises and choppy clusters. Sparse anime stays economical and
quiet. Console icon stays visibly coarse at 72×72. Rough manga retains interrupted
contours, controlled hatching and choppy highlights.

**Refined cel is a separate sixth type.** The owner identified the former Yae
Miko whole-frame V3 output as more refined, with rounder features, fuller shapes
and gentler shading. It was retained under `yae-miko-refined-cel`. Its historical
folder/prompts say Sharp cel because that was the request; they are not evidence
that the output matches Sharp cel. Never use that output as Sharp cel's anchor.

Before animation or a large sheet, compare one resting front pose with the
selected original at identical integer zoom. Check face/eye proportions, outline
weight, cluster geometry, shadow planes, hair highlights, ornaments and framing.
Treat **style fidelity**, **motion quality** and **pixel transport** as separate
gates. Passing one does not pass the others. Correct a drifted sample first.

Keep a stable style key. Do not silently replace an existing category with a
different drawing language to simplify motion. If the owner elects to keep that
different look, publish a separate name/ID and preserve the original references.
An original static reference and an animated pack may have different readiness;
label pending motion honestly and do not reactivate rejected effects as a fix.

## Painterly anime fantasy

The owner retained Sieghart's smoother portrait as another named style:
**Painterly anime fantasy**, separate from Refined cel and all five earlier
pixel styles. Its current example is
[Sieghart at three-quarter](../assets/style-examples/sieghart-three-quarter-left.png),
with project catalogue ID `sieghart-painterly`, style key `painterly-anime` and
smooth display metadata. Preserve adult facial proportions, painted hair/material
shading and clean anime contours. Do not pixel-filter this example or use it as
the Refined cel anchor. Inspect the actual source alongside its live export.

For new portrait work, **Refined cel is recommended**, with an explicit style
question and actual Amber examples from [style choice](style-choice.md).
The illustration may independently use Painterly anime fantasy. Register these
choices separately, without rewriting older style categories or assuming that a
style-definition file contains every later catalogue addition.
