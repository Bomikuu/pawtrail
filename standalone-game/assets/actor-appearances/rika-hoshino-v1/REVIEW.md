# Rika Hoshino + Peony-7 acceptance

Owner approved both normal/attack designs and selected **Refined cel** for Rika’s dialogue portrait. Voices explicitly omitted. Original fictional adaptation: Rika, 24, is a confident, inventive rescue pilot; Peony-7 is her articulated rescue walker.

## Delivered

- Normal and attack illustrations in the approved Refined cel + painterly direction, with semi-bold edges, continuous pinned ponytail motion, repaired underlays, separately controlled quiet hangar background and teal aura. The attack illustration has its own pose and moving teal facial energy.
- Rika’s own three-angle, six-emotion portrait. Full authored frames supply open/half/closed eyes and mouth states; no generic runtime facial patches. Whole style: **202,880 bytes**, under 300 KB.
- Separate 40×40 three-quarter pilot and mech icons using the existing wood border and active glow.
- Illustration-led pilot geometry: curved face/jaw, fitted suit, white armor, magenta piping, headset fins, layered volumetric ponytail and distinct rear materials.
- Separate vehicle geometry on the shared articulated rig: rounded cockpit and canopy, rear thrusters, forearm housings/grippers, armored legs and wide feet. Wave opens the canopy; Rika supplies its dialogue portrait.
- Both are in the actor preview, stage play selector and actual neighborhood character picker. Stage Play offers Enter Peony-7 / Exit cockpit, preserves the handoff position where clear, and finds a safe spawn if the larger footprint does not fit. Mech foot collision is 24×8 versus the normal 10×6. Human furniture is disabled for the mech in stage play; Rika can sit/rest using existing interactions.
- Shared actions and movement remain the common animation system. Mech rest poses use an upright parked posture. No speech cues, new combat moveset, destruction behavior, account writes or authoritative Kibble rewards were added.

## Live Firefox review

Focused visual review, no automated test suite, typecheck or build; no agents.

- Both models: all 34 supported actor-preview actions captured at two moments. Four headings (front, three-quarter, side, back) captured while walking. Native/cropped boards reviewed against the illustration and turnaround: ponytail/headset, fitted suit, rounded canopy, rear thrusters and leg/arm volume remain readable. The world-scale model deliberately has smaller stylized proportions than the adult illustration.
- Rika: visible food/water/care props, seated and curled sleep poses, clouds/rain/emotes, flight props, run/dash, clap/cheer/inspect and return to idle. Movement while feeding and pause/resume also reviewed. The detailed face inspection uses her own maps and a separate curved face, without a 3D nose.
- Peony: shared action set retained with vehicle geometry, gripper motion and canopy opening. Initial sit/sleep/ride/float captures revealed missing legs from a string used as a numeric side multiplier. Fixed to explicit ±6.2 positions; all four poses recaptured and visually reviewed with both legs intact.
- Portrait: all 3 angles × 6 emotions captured at rest and three speech/blink/breathing moments. Source sheets and native face states reviewed too. No mismatched patches or tearing seen. Dialogue uses the selected angle and Rika’s identity, including while Peony is selected. Live feed→smile, cry→sad, power-up→angry, sleep→authored closed-eye resting states observed together with the body.
- Illustration: 10 phases each for normal and attack over multiple cycles, background/aura hidden. Hair tips move while face, grip, rigid armor and feet remain stable. Attack energy changes shape from its anchored face origin. Independent layers, pause/resume, restart and reduced-motion still reviewed. Background remains quiet after restoring layers.
- Ground circle: detailed drawn sigil visible below the feet in the actor preview, including during floating/flight; contact shadow remains separate.
- Room: Rika walking/running, cockpit entry and exit, Peony running into the bed boundary with visible contact status, disabled human-furniture prompt, Rika sleeping/waking on the bed, and return to Edit observed. No stage save was written.
- Explore: selected Rika and Peony through the real settings picker in an isolated Firefox guest save. Both move in the actual neighborhood, use correct appearance/portrait and return to idle. Depth sorting around trees remains intact. These choices did not alter the owner’s browser profile.
- Narrow viewport: 390-pixel preview captured; document width also 390, no horizontal overflow. Portrait, controls and model remain usable with vertical scrolling.
- Clean review session: zero browser console errors. Firefox emitted existing WebGL deprecation/viewport warnings and font-preload notices. Action SFX reuse existing paths; this run did not separately audition every procedural sound, and no voice acceptance is claimed.

Evidence: `output/playwright/rika/final/` contains action matrices, four-heading board, portrait boards, illustration motion phases, room/main-game captures and delivery preview. The earlier `output/playwright/rika/face-*` captures are preliminary; use the final captures for acceptance.

## Size and boundaries

Runtime asset files total **625,238 bytes in 37 files**: portrait 202,880; both illustration variants/layers 324,426; model maps/profile/sigil 89,973; pilot icon 4,358; mech icon 3,601. Shared JS/engine/rig code and authoring/reference images are outside this asset-only total. See `delivery-sizes.json`.

Static generated turnarounds guide construction; they are not gameplay sprites. The game renders real textured geometry to native pixels. Illustration/portrait artwork has deliberately finer adult anatomy than the small world model. Canopy opening is a preview action; stage boarding is a functional actor swap with loading feedback, not a new cinematic boarding sequence. Existing room-art placeholders and unrelated object metadata were not rebuilt in this actor task. Fully playable here means walking/running, collisions, depth and supported shared interactions, not a new mech-specific combat system.

Preview: http://127.0.0.1:3000/play?preview=actors&skin=rika-hoshino&art=illustration
Mech: http://127.0.0.1:3000/play?preview=actors&skin=peony-7
Room: http://127.0.0.1:3000/play?preview=stage&actor=rika
Explore: http://127.0.0.1:3000/play?explore=1 — Settings → Your character.
