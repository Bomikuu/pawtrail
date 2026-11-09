# Aquarium turnaround and furniture review workflow

The furniture skill now shows the selected generated 2D turnaround and asks whether it is good enough before dependent 3D work. The owner configured a 60-second optional response window: yes proceeds, no revises, and silence proceeds under the owner's default. Record those states separately; silence is not affirmative approval. Existing task scope and workspace execution limits still apply.

## Accepted references

The owner explicitly answered **“Good enough — proceed to 3D”** for the aquarium set. The raw sheets, exact prompts, selected revision, checksums, review response and implementation evidence are recorded in `assets/furniture-studio/references/aquarium/reference-set.json`. The canonical original is `public/assets/game/housing/furniture/cozy-room-v1/aquarium-v1.png`; it is unchanged. Its four cabinet compartments and two source fish take precedence over the generated two-door front proposals.

`prepare-aquarium-turnaround.py` imports six uniformly scaled views with nearest filtering and the source palette. Derived imports isolate alpha at 224 and retain the largest connected object; raw tool output is preserved unchanged, including its semi-transparent halo. The original front remains the creator's front reference. Other facings use their corresponding generated reference.

## Implemented model

Installed aquarium revision: **31b060873773**. The model has a closed beveled hood, cabinet sides and plain inset rear, finished corner feet, waterlines, inward-facing water backgrounds and two independently animated crossed fish profiles. Native exports include four quarter-turn facings, three existing wood styles and nine motion phases. The 45° and 135° renders are authoring evidence; live placement still uses four facings. The GLB stores the reference pose; code/native frames own animation playback.

The structural model rotates around the centered footprint. Native frame and game anchor remain 96×112 and (48,96); the canonical reference anchor is (48,60). Profiles use a documented 8° pitch, blended by sin(yaw)^2; shared actors retain their native camera. Collision and approach derive from the same physical pivot. The aquarium has no seat socket. The existing item/style IDs, price, timed build and timber/glass recipe remain intact.

Only the aquarium record/assets and required shared furniture helpers were mirrored to the social app worktree. The couch's existing installed revision is unchanged. Local housing was reloaded to pick up the catalog; no accounts, database fixtures or reward balances were changed.

## Visual review and limits

Reviewed in Firefox: four facings and matching references, the above-item rotation action, Honey oak/Walnut/Pale oak/custom wood colors, fish pause/play, the actual creator actor standing nearby, navigation to comparison, and the collision overlay. Native four-view, three-quarter and motion boards are saved under `output/playwright/aquarium-*review.png`. Creator screenshots and the comparison collision screenshot are listed in the reference manifest.

The review found and fixed a main-app integration failure: blindly removing semicolons joined the patch result to a following parenthesized material assertion. Direct mesh-material assignments preserve the correct expression boundaries, and renderer errors now retain useful development diagnostics.

The side hood is still boxier than the generated drawing, and generated hidden faces are approximate interpretations. Fish and plants intentionally use illustrated layers within the volumetric structure. The earlier exact front-only score belongs to a superseded model and is not a current fidelity claim. Authenticated placement, care/rewards and construction transactions were not exercised. No automated tests, checks or builds were run.

Open `/play?preview=furniture` or `/play?compare=furniture` and choose **Little reef aquarium**.
