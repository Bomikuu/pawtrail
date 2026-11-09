# Portrait styles: references and design contracts

The owner identified the whole-frame Yae Miko trial as a style drift. Its rounder
features, fuller hair/ornament shapes and gentler shading are **Refined cel**, not
the original **Sharp cel**. The art is retained as a separate sixth option. An
animation/transport review did not establish a Sharp cel style match.

The catalogue now separates `yae-miko-refined-cel` from `yae-miko-style-1`.
Refined cel keeps the complete-frame player and existing artwork unchanged;
its complete pack is 246,528 bytes. Sharp cel now uses the independent
`yae-sharp-cel-rebuild-v1` complete-frame job based on its original design anchors.
Its rejected published exports and old runtime folders were deleted. The preview
retains the fresh Sharp cel option and Refined cel separately. See the
[fresh rebuild record](sharp-cel-fresh-rebuild.md) for provenance, size and review.

## Authoritative references

`src/game/actor-rig/portrait-style-definitions.json` records each type's original
reference file/hash, native dimensions, palette limit, design rules and short UI
summary. Existing five-style source prompts remain the authority for those five
designs. The reclassified trial is the reference for Refined cel only.

| Style | Required design language | Design anchor |
| --- | --- | --- |
| Sharp cel | Irregular 1–2 pixel contours; angular flat shadow masses; narrow lids; restrained rectangular highlights; 2–3 skin planes | `pink-shrine-portraits-v1/style-1-poses.png` |
| Compact fantasy | Compact adult facial proportions; squared irises; short choppy hair clusters; broad contours; flat skin shading | `pink-shrine-portraits-v1/style-2-poses.png` |
| Sparse anime | Thin stepped outlines; long simple planes; minimal face marks; small restrained eyes/lips; few quiet hair masses | `pink-shrine-portraits-v1/style-3-poses.png` |
| Console icon | Coarse squared pixels; bold silhouette; very few face planes; blunt eye clusters; simplified ornaments at 72×72 | `pink-shrine-portraits-v1/style-4-poses.png` |
| Rough manga | Interrupted contours; controlled hatch clusters; broad hard shadows; sharper lashes; choppy highlights and selective flecks | `pink-shrine-portraits-v1/style-5-poses.png` |
| Refined cel | Rounder features; fuller hair and ornament shapes; more elaborate highlights and gentler shading, still rendered as native pixels | `yae-sharp-cel-complete-v3/pose-0-complete-generated.png` (historical folder name) |

Paths in the table are under `output/imagegen/`. Character identity and clothing
can change, but the selected design language must remain recognizable. A shared
canvas size or palette count is not proof of a style match.

## Generation gate

1. Inspect the character reference and the selected style's original design
   anchor separately. Keep their roles explicit in the prompt.
2. Produce or reuse one front resting pose first. Compare it at the same integer
   native zoom beside the anchor: eye/face proportions, silhouette, contour weight,
   cluster geometry, shading planes, highlights and ornament simplification.
3. Correct style drift in that sample before generating expression/angle sheets.
   Do not let a mismatched regenerated face become the new style reference.
4. Only after that comparison, author compatible complete motion images and run
   the separate animation review. Keep all frames in the same design.
5. Keep the stable style key/name. Never overwrite an established option with a
   different look. Retain a different design as a new style only at the owner's
   request, as with this Refined cel classification.

The original classification split used existing art only. The subsequent fresh
Sharp cel job uses four new ImageGen sheets followed by native export and the
authorized Firefox visual review. It does not reapprove other legacy motion packs.
No agents or automated application tests/checks/builds are used.

Publication: `python3 scripts/publish-portrait-pack.py <job-folder>` publishes one
independent job and relevant portrait modules to the running integration worktree.
`scripts/separate-portrait-styles.py` publishes the two current canonical jobs.
The previous whole-frame install command redirects to that publication path so it
cannot silently replace Sharp cel again. Historical prompts keep their original
wording for provenance, accompanied by an explicit reclassification record.

Compact fantasy has since been rebuilt independently in
`output/imagegen/yae-compact-fantasy-rebuild-v1`, using its original style-2
reference. Its old published/local runtime was deleted, its own Firefox review
covers all four angles and six emotions, and the preview retains that style.
Exact sizes, prompts, review evidence and elapsed comparison are in the job records.

Rough manga has been rebuilt independently in
`output/imagegen/yae-rough-manga-rebuild-v1`, from its original style-5 references.
Native cells remain 120×120, with its own whole-frame source and performance data.
Its job records are authoritative for current publication, review status and timing.

Console icon is rebuilt in `output/imagegen/yae-console-icon-rebuild-v1` under
the updated owner defaults: 300,000 bytes and three poses (front, three-quarter,
head tilt). Its native grid stays 72×72 and its source palette stays unchanged.
Job-configurable importer poses/margins and byte guards now support these defaults.
The catalogue publishes pose IDs; gallery controls, compare canvases and decoder
validation follow each pack, preserving four-pose legacy collections. The preview
opens on the latest Console icon pack. See its review and timing records.
