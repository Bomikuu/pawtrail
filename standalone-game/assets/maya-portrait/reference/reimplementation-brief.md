Rebuild our rotatable Three.js portrait so it faithfully reproduces Maya’s original pixel-art illustration while retaining real 3D volume, rotation and facial animation.

Treat the original illustration as the visual specification. The current renders demonstrate the implementation and its visual problems; they are not the design reference.

Our priority is likeness. Preserve Maya’s identity, proportions and painted pixel-art treatment before adding expressions or supporting other characters.

1. Diagnose the mismatch before editing

Inspect the supplied images and the existing portrait implementation.

Compare:
- Hair silhouette, side part, fringe, crown height and bob length.
- Head shape, cheek volume, chin and jaw.
- Eye contours, spacing, eyelids, pupils and painted highlights.
- Eyebrows, nose, mouth and resting expression.
- Skin palette, blush and placement of painted shadows.
- Neck length, shoulder angle, clothing cut and neckline.
- Camera angle, head tilt, framing and pose.

Explain the largest differences using specific features visible in the images. More texture detail alone will not resolve incorrect shapes.

2. Match the original camera and pose first

Create a fixed “reference view” that reproduces the illustration’s actual viewing angle, head tilt, shoulder pose, framing and scale.

Do not assume the illustration depicts a straight-on, symmetrical face.

Use an orthographic camera initially, adjusting the projection only if the reference requires it. Save this calibration so every comparison uses identical settings.

Render at 192×192 and compare at native size and integer nearest-neighbor enlargement.

3. Build the geometry around the drawing

Replace the procedural head and hair wherever they prevent a faithful match.

Use an artist-authored Blender bust exported as GLB, or equivalently controlled mesh authoring. Fit its projected silhouette and facial landmarks to the reference.

Author:
- A head with Maya’s specific proportions.
- Facial planes that support a convincing profile.
- Her asymmetrical, side-swept bob and distinctive hair masses.
- Neck, shoulders and clothing matching the illustration.

Stylized anatomy and deliberate asymmetry are appropriate. Preserve the drawing’s shapes rather than imposing realistic human proportions.

Use real geometry for the head, hair volume and important silhouette features. The face must have believable depth and occlusion during rotation.

4. Paint the textures directly from the reference

Use the original artwork as the authority for colors, feature shapes and painted shading.

Camera projection can establish the texture at the matched reference view. Then manually correct UV distortion, seams, stretched regions and surfaces hidden in the source image.

Author coherent textures for both profiles and the back. A frontal projection stretched around the entire head is insufficient.

Separate identity-bearing geometry and painted details:
- Geometry controls silhouette, depth, facial planes and occlusion.
- Textures control the exact drawn eyes, brows, lips, color clusters and painted shading.

Preserve intentional pixel clusters and the original palette relationships. Downsampling or palette reduction alone does not reproduce pixel-art craftsmanship.

5. Preserve the illustrated appearance during rotation

Use painted, unlit materials, with controlled color management and no unintended lighting or tone-mapping changes.

Avoid glossy skin, realistic eyeballs, strong specular highlights and automatic shading that conflicts with the painted shadows.

Keep the source’s selective outlines, warm shadow colors and restrained highlights. Do not add uniform black outlines to every feature.

Review both three-quarter views, both profiles and the back. Hair must retain a designed silhouette; eyes and facial features must become correctly occluded as the head turns.

If necessary, use subtle artist-authored view-dependent corrective shapes or texture variants. They must transition smoothly and preserve continuous geometry, depth and parallax.

Do not substitute a camera-facing portrait plane or rotating flat sprite for the bust.

6. Build facial animation after the neutral likeness works

Use a combination of:
- Hand-painted eye, eyebrow and mouth expression atlases.
- Subtle blendshapes for jaw opening, cheeks and eyelids where useful.

Derive expression drawings from Maya’s original facial design. Preserve her eye contours, feature placement and personality across neutral, blink, smile, happy and talking states.

Facial textures must follow the head’s UVs or conforming geometry and respect depth and occlusion. Prevent doubled features, floating facial layers and visible seams.

Keep talking driven by text reveal unless audio lip-sync is separately implemented.

7. Preserve customization through authored modules

Retain shared appearance data and reusable rigging, but allow character-specific head shapes, facial artwork and hair geometry.

Use:
- A common rig and compatible topology where practical.
- Character-specific shape presets.
- Individually authored interchangeable hair and clothing.
- Semantic color masks with coordinated highlight/shadow ramps.

Color changes must preserve painted contrast and material identity. Hair and clothing swaps must maintain believable fit and avoid intersections during animation.

Prove the approach with Maya before extending it to other characters.

8. Make visual fidelity measurable

Create a development comparison view containing:
- Original reference.
- Render from the calibrated reference camera.
- Adjustable opacity overlay.
- Silhouette and facial-landmark comparison.
- Difference image.

Measure hair outline, face outline, eye centers, brows, nose, mouth, chin and shoulders.

Aim for roughly 1–2 pixels of landmark alignment at 192×192 where the source is clear. Treat this as a calibration target, not proof of artistic likeness.

Review the eye shapes, hair silhouette, expression and color grouping by eye as well. Record remaining discrepancies explicitly.

Do not hide mismatches by changing the camera between comparisons.

9. Validate actual 3D behavior

Deliver:
- The calibrated neutral reference render.
- Front, both three-quarter views, both profiles and back.
- A continuous 360-degree turntable.
- Blink, smile, happy and talking examples.
- At least one hair/clothing/color variation.

Check for texture stretching, profile distortion, facial-layer artifacts, hair intersections, expression drift and distracting pixel shimmer.

Preserve the existing shared renderer, bounded caching, visibility pausing and 12 fps behavior where compatible with the rebuilt asset.

10. Be explicit about asset-authoring requirements

Inspect the available tools before claiming the rebuild can be completed.

If high-quality modeling or texture painting requires a character artist, provide a concrete Blender handoff: reference alignment, required meshes, UV layout, texture layers, expression atlas, blendshapes, material settings and GLB export requirements.

Implement the available integration and comparison tooling, and identify the exact assets still needed. Report fidelity based on rendered comparisons.

The finished result should look like Maya’s original illustration has acquired depth: the same character design at the reference angle, with coherent, carefully authored volume as it rotates.