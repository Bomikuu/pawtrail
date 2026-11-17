# Request furniture: references before the model

Use this workflow when the owner requests furniture, converts an illustration into a rotatable asset, or substantially changes its shape. Generate the missing angles before modeling, even if a front view already exists. This corrects the demonstrated failure of copying a front painting while inventing unsatisfactory sides and rear.

## Create one coherent reference set

Inspect the original at integer nearest-neighbor zoom and record its source/checksum, silhouette, component counts, proportions, palette and identifying details. Count small divisions before prompting: generated fronts must not silently replace source door, cushion, foot or fish counts. If a generated sheet conflicts with a canonical front, resolve and disclose that hierarchy before the 2D review. Preserve an existing original front image as the canonical source. Use the imagegen skill and built-in image tool to generate a coordinated turnaround with front, left, back, right and front/rear three-quarter views. A single sheet is useful for keeping the views consistent; save its cell order. Use a top view too when it resolves construction or contact depth.

Request matching scale, orthographic projection, game-compatible pitch, a shared floor/pivot, the same pixel/paint style, and transparent backgrounds. Identify which images are authoritative originals and which are generated design references. Preserve upholstery colors, cushion/pillow/foot counts and distinctive patterns. A rear reference should show the rear construction, not duplicate front decorations onto it.

Save selected generated images, exact prompts, tool mode and a small reference-set manifest in `assets/furniture-studio/references/<item>/`. Keep project assets in the workspace and preserve their alpha. Do not replace original artwork with a generated reinterpretation. Read imagegen's guidance for saving its output and for an unavailable tool; do not silently substitute procedural placeholder references.

## Review references before implementation

Inspect every view together. Check total width/height/depth, component counts, profiles, thickness, recesses, rear support/frame, feet, pattern visibility and palette. Ensure adjacent and mirrored views describe one constructible object. Generated images are design proposals, not evidence of the original hidden geometry. Correct clear inconsistencies before presenting the set as the modeling target.

## Show the 2D set and ask

Show the selected generated sheet inline and identify the unchanged original versus the generated angles. Ask whether this set is good enough to proceed to 3D. State the response window: **60 seconds by default**, unless the owner specifies another duration. The owner explicitly requested that no response should mean proceeding.

Use an asynchronous question when available, with proceed/revise choices. Start the window only after the image and question are visible. Yes advances immediately. No or requested changes mean revise the 2D set and show the replacement before dependent modeling. If no answer arrives by the stated deadline, announce that work is continuing under the no-response default, then proceed. Record `explicit_yes`, `revision_requested`, or `no_response_default` with the sheet revision and timing; never describe silence as an affirmative user approval.

While the window is open, save provenance, inspect existing code and prepare independent work. Do not change the dependent 3D model before yes or the deadline. Use bounded waits when needed, keep the turn active, and do not end the task solely to wait for this optional response. A later correction still steers the ongoing task. This default applies to the 2D furniture design review; other authorization and workspace limits still apply.

## Build coherent volume

Model real shared geometry from the agreed dimensions. Use source-painted unlit textures and shallow details to preserve illustrated character, while allowing the model's silhouette and construction to work at all required angles. Do not solve the front with camera-facing extrusion and assume arbitrary sides/back are acceptable. Do not substitute unrelated flat sprites for the structural object. Keep a centered rotation pivot, native frame, nearest filtering and actor scale. Use the standard camera by default; an explicit reference-matching camera calibration must be recorded per facing, with updated contacts and native actor pelvis docking. Image stretching does not establish a matching 3D model.

Retain physical actor sockets, floor collision, approach/exit, style IDs, foreground layers and construction rules. Confirm seat support and breathing/clothing allowance with the actual shared rig in each seat and with both seats occupied. Transform contacts/collision with the same model pivot; never shrink the actor to disguise a mismatch.

## Compare all required views

At each supported facing, show the corresponding reference and actual render at compatible scale and camera. Review silhouette, component landmarks, material regions and visible details. Use overlays/differences where the artwork and projection permit meaningful pixel comparison. A perfect front-view pixel score is only a front-view result. A substantial mismatch at another required angle remains unfinished work.

When visual review is authorized, inspect the real creator in Firefox, rotate using the above-item control, test each seat/both seats/standing and styles, and confirm the model stays inside the frame. Save comparative evidence and update only the relevant item, assets and catalogs. State remaining limitations and distinguish generated reference artwork from an implemented 3D asset and from authenticated interaction testing.
