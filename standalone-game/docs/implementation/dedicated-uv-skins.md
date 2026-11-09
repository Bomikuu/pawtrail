# Dedicated character and cat UV skins (v2)

The owner approved replacing the automatic sprite-region mapping after the model still looked awkward. The default is now a complete authored atlas set for ten character appearances and ten cat coats. The native reference sheets were inspected together before painting so the Trail rescuer keeps a teal shirt/brown vest/orange shorts, the jacket rescuer has the dark jacket, the braided rescuer has the cream sunhat, the glasses family keeps green outerwear with its brown/blonde/violet/red hair, and the three male variants keep their blue/mustard/olive outfits. Coat variants retain tabby stripes, calico patches, tuxedo blazes, Siamese points and white/cream/gray markings. These are game artwork, never real identification references.

## Authored assets

Run `python3 scripts/author-actor-uv-skins.py` to export the fixed-grid surfaces. The script contains the actual pixel paint definitions; it does not crop or resize animation frames. Each identity has a 256×128 PNG, a role mask and a manifest entry. Six 16px face tiles are assigned independently to head, blink, half-blink, torso, arms, legs, hair, feet, tail, ears, backpack and hat. The role mask keeps hair/outfit/coat recoloring separate from faces and markings. Runtime assets are under `public/pawtrail-game/game-assets/actor-uv-v2`; dimensions and source design references are in its manifest. The whole export directory is roughly 176 KiB on this filesystem.

`models3d/skins.ts` loads these dedicated atlases and masks. All source-sprite sampling/cropping has been removed from the model runtime. It converts PNG row orientation once for DataTexture use and applies nearest filtering, explicit sRGB and no mipmap filtering. Atlas UVs stay a half texel inside their tiles. Head blinking uses a second texture view, not geometry replacement or new material allocation on every frame. Assets are cached by identity. Skin colors remain editable, and prior local appearance saves/coat aliases stay readable.

## Geometry and idle motion

The box-shaped head and separate flat cap are replaced by an ellipsoid with a sculpted cap following the same contour; front fringe and longer side locks are actual geometry. Eyes, smiles, glasses, clothing seams and markings occupy their own authored surfaces. Cats use a rounded head/body, triangular ears and a two-part tail. Torso, limbs and foot proportions stay close to the native small RPG silhouettes. This remains genuine adjustable 3D rendered into the shared Phaser world.

Standing characters breathe, blink, shift their upper body slightly and make restrained head/arm movements. Cats add independent ear twitches and tail-tip sway. Identity-based phase offsets prevent synchronized idles. Breathing moves the upper body while the foot anchors and physics actor remain planted. Reduced motion removes spatial idle sway/bob and ear/tail loops; blinking remains. Sleeping retains breathing with closed eyes. Existing distance-driven walking, opposing limbs and short-arc turning remain shared between Explore, Home and Yard. Offscreen actors skip rendering; idles refresh at the existing lower rate. No measured FPS claim is made.

## Delivery boundary

Only model/skin/workshop source, dedicated game assets and documentation were copied to the social worktree. No broad sync, platform data change, agent delegation, automated tests, checks or production builds were used. Requested Firefox visual captures cover the workshop and existing game entry. Authenticated housing and all twenty variants have not been exhaustively exercised in game.


Firefox capture files: `output/playwright/uv-v2-rescuer-final.png` (Trail rescuer), `uv-v2-player-first.png` (Copper gardener), `uv-v2-cat-front.png` (orange tabby front), and `uv-v2-mobile.png` (mobile cat preview). These are actual rendered captures, not concept renders. Capture automation encountered unstable pointer actions after live reload; keyboard activation completed the final character capture. Agent-created capture browsers were closed afterward; the project development servers were left running.
