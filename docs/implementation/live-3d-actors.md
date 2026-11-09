# Live 3D characters and cats

The owner approved replacing visible player/cat sprite animation with adjustable 3D models. `src/game/models3d/model.ts` constructs original articulated, softly beveled low-poly Three.js meshes with native sprite UV skins and palette-matched materials. Existing character hair colors, outfits, backpacks, glasses, hats and cat coat identities are design references; the player head and torso use separate front/back/side crops of the original native idle frames as nearest-filtered UV skins. No full animation sheet is wrapped around the body and no billboard stands in for geometry. Rigged legs, arms, head and tails respond to walking, sitting, care and sleeping poses. Coat markings are geometry.

The shared Phaser actor configuration binds these rigs in Explore, Home, yards and companions. A shared small orthographic WebGL renderer projects each live mesh into a nearest-neighbor canvas texture, composited at the original actor's depth and foot position. These are runtime mesh views, not generated sprite sheets or fixed directional exports. Phaser's original invisible actors retain collision, input targets, navigation, identities and network behavior. Existing native art remains loaded for compatibility/fallback. The world/furniture remains 2D; this does not convert the entire map to a 3D physics world. Dogs retain native artwork.

Settings → Your character → Adjust 3D models opens the shared workshop. Drag/rotation slider turns the mesh continuously. Character/cat selection, hair/outfit/coat colors, head/body proportions and action previews work on geometry. Apply saves cosmetic overrides per identity in this browser only, with no database, animal ownership, welfare or reward changes. Reset preview restores authored defaults; Apply commits that reset. NPCs sharing a character appearance share its cosmetic override. Customizations are not multiplayer-synchronized.

Moving/turning mesh views can refresh on each 60 Hz game frame, with 20 Hz idle updates and offscreen culling; gameplay retains its existing simulation cadence. No FPS target is claimed. Unsupported WebGL retains native actors. Each destroyed actor removes its mesh view, materials and scene listener. The workshop releases its renderer and animation loop when closed.

Only scoped model/actor/picker files and package dependencies were installed into the social worktree, without the broad sync script or discovery changes. No automated tests, type checks or builds were run. Requested Firefox visual confirmation covers Explore and workshop previews; authenticated Home/Yard and multiplayer are not visually verified in this delivery.

Actual Firefox screenshots are under `output/playwright/`: `pawtrail-3d-explore.png`, `pawtrail-3d-workshop-player.png`, and `pawtrail-3d-workshop-cat.png`.


## 9 November character refinement

The owner found the initial block models awkward and asked for closer 2D color fidelity and smoother walking/turning. `models3d/skins.ts` samples the actual native idle frames through the existing manifests, separates the head/torso and front/back/left/right regions, and maps those pixels to 3D surfaces. Original files are not edited. Default rescuer now keeps the source's brown hair/jacket, teal shirt/backpack, orange shorts and boots; it has no invented sunhat. A low-poly hair crown, rounded head/body, shorter legs and palette-controlled materials replace the block silhouette and overexposed lights. MeshBasic materials, explicit sRGB textures, nearest filtering and no tone mapping preserve painted colors. Runtime skin fallback has an expressive pixel face; missing assets do not make the entire character disappear. Overrides still apply by identity and old saves remain readable.

Stride phase follows accumulated distance, rather than elapsed time. Left/right legs oppose one another and arms counter-swing. Gait intensity eases into/out of walking. Shortest-arc exponential yaw damping avoids angle-wrap spins, mirrored left/right turns and snapping a stopped diagonal heading to a cardinal direction. Reduced motion removes incidental bob/tail sway while retaining essential walking and orientation. Source sprites keep their alpha/visibility/hit tests; their native draw functions alone are suppressed. Foot placement is computed from the 3D camera projection. Physics, route finding, network positions, game identities and verified platform data are unchanged.

The automatic source-region mapping is a compatibility skin pass. A dedicated pixel-painted UV atlas remains the best long-term option for exact seams and art-directed side/back detail. It is not claimed to be a finished custom atlas or a production frame-rate benchmark. No automated tests, checks or builds were run for this refinement. Requested Firefox captures are in `output/playwright/character-refined-workshop-final.png`; authenticated Home/Yard were not exercised.


## Current v2 default

The dedicated authored UV atlases and rounded character/cat rigs supersede the automatic source-frame skin pass above. They include standing breathing/blinking and species-specific idle details. See [dedicated UV skin delivery](dedicated-uv-skins.md).
