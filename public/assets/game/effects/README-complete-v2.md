# PawTrail social effects v2

Built-in imagegen produced twelve emotes and nine special effects. Each has four distinct generated frames in native32×32 strips: 21 animations /84frames. `complete-effects-manifest.json` records real file locations, frame rectangles and timing suggestions.

Original eight-column source sheets contain two four-frame sequences per row. Actual source cell rectangles are preserved in metadata; the intentionally empty final source group was not assigned a fake animation. Grid-edge artifacts were excluded during cell extraction. Native preparation removed soft alpha, retained deliberate motion marks, centered each icon and used crisp limited-palette pixels. All four native frames are distinct for every effect.

`emotes/complete-review-v2.png` and `particles/complete-review-v2.png` are integer-scale cream-backed review sheets; individual PNGs remain truly transparent. Transparent previews can be displayed with misleading debug colors by some image viewers; their visible RGB palette was checked and the cream composites show the real artwork.

Frame timing/loop quality is not playback-certified and productionReady remains false. No sound files, UI components, networking, gameplay or wallet effects are implemented by these visual assets.
