# Character action acceptance

Always pair this action pass with
[live visual acceptance](visual-acceptance.md): compare the actual model to its
own illustration, inspect head/cloth motion and face visibility from multiple
angles, and verify action-linked portrait states at real UI sizes in the browser.

After reference/shape/texture work, portrait, icon and animated illustration
creation, review how the assembled
character performs the shared actions before calling it ready or installing it.
Idle/walk approval alone does not establish feeding, sleep or emote compatibility.
Preserve the full appropriate action selector; don't hide actions to avoid this
step. Work within the requested scope and current verification permissions.

## Review the actual character

- Confirm that every human action in `actor-rig/actions.json` remains reachable
  in the actor preview. Check all supported actions at least once, including
  entry, representative motion and return/settle. Concentrate extra headings and
  native-pixel close-ups on actions affected by its geometry or costume.
- Locomotion: idle, walk/run, turning, opposing limbs, ground contacts and return
  to idle. The chosen natural run retains toe push-off, knee recovery, bent
  elbows and landing. Keep existing foot anchors and shared movement.
- Body-depth revisions: compare front, three-quarter and side at the same
  camera/phase. Inspect rounded torso/hip sections, sleeve continuity, arm
  clearance, side/rear UV seams and fuller hair/cape overlap. Owner approval
  of the fuller Amber direction is not a pass for another actor's fit or its
  complete action set; re-review care, rest and emotes affected by added volume.
- Care/gestures: feed, water, pet/play, cleaning, item pickup/holding/gifting,
  waving, clapping and cheering. Props must be visible, follow the right joint
  and disappear when appropriate. Custom shoulder offsets must not overwrite
  action arm rotations. Verify the motion reads as the intended gesture.
- Rest/airborne: sit, sleep, floating, rooftop ride and staged jetpack takeoff,
  hover and landing. Inspect closed eyes, pillow/blanket/flight equipment,
  gathered sleeves/skirts/cape, long hair, body/ground intersections and shadows.
- Emotes/abilities: sad/cry, happy/laugh, angry, surprised, tired/sick, dance,
  power-up and applicable run/dash/approach abilities. Keep sound, effects,
  appearance eligibility and cooldown/lifetime behavior on their shared paths.
- Movement while acting, direction changes, pause/resume, explicit replacement,
  one-shot completion, timed expiry, scene exit and cleanup must preserve the
  existing action lifecycle. Do not restart sounds or discard the selected
  action just because the character begins walking.

## Feedback and layered presentation

Use [feedback and layered effects](feedback-and-effects.md) as the production
contract. Review applicable requirements on the actual actor/encounter:

- Click/open acknowledgement is visible and tactile, with keyboard/touch
  equivalents; pending, failure, disabled and cooldown states do not fake success.
- Basic attacks, normal skills and special items have their intended cast,
  trail/contact and recovery effects. Relevant slashes use animated 2D pixel
  artwork. Successful-hit impacts follow confirmed contact, not just a cast.
- The magic/sigil circle stays on the ground under the highlighted actor,
  distinct from its shadow and attack telegraphs, including during flight.
- Actor illustration, context background and aura can play independently and
  together. Inspect their loop seams, depth, anchored motion, visibility controls,
  reduced-motion fallback and complete runtime size; retain the separate assets.
- A boss uses dedicated enraged artwork in a centered cut-in on its real enrage
  transition. It triggers once, restores the HUD and cleans up on exit/defeat.
  Default portrait tinting is not acceptance of the special portrait requirement.

Keep irrelevant boss/combat checks out of a friendly actor-only task. A narrow
skill edit does not authorize generating all these assets or testing the game.

## Check portrait emotion with the body action

For characters with the new story/voice package, also review the profile's
dialogue tone and up to six short cues using
[identity and voice](identity-and-voice.md). Check the intended voice/text pair,
pronunciation, speaker consistency, portrait speech/rest, user-gesture playback,
interruption and mute. Record audio generation and listening acceptance separately;
existing procedural action sounds do not establish that speech clips exist.

The creator's illustrated portrait follows the presented action, not merely the
last dropdown choice. Use the shared `actor-rig/action-portrait.ts` mapping:

| Body intent | Existing portrait treatment |
| --- | --- |
| Idle, walking, running, finished/cancelled action | Neutral |
| Petting, feeding, watering, gentle interaction, wave/gift | Smile |
| Happy, laugh, dance, cheer/play | Happy |
| Sad/cry, sick, tired | Sad |
| Angry/power-up/dash | Angry or focused interpretation using the angry art |
| Startle or flight takeoff | Surprised |
| Sleep | Neutral closed-eye authored frame |

Adapt the intent when a character/action calls for it. Select that character's
own authored emotion, blink, breathing and speech frames. Do not reuse another
character's eyes, paint patches or force speech when there is no dialogue.
Respect the current portrait skill's style/angle and complete-bundle budget.
If a legacy/cat portrait lacks an expression, select a supported fallback and
expose the limitation; that is not a pass for the missing emotion. Generate new
art only within the user's requested scope.

During authorized review, inspect the body and portrait together through action
changes, blink/breathing within each emotion, one-shot completion and return to
neutral. Expansion of the portrait inspector must preserve the character and
current expression; its manual expression controls may then override it for
inspection. A correct mapping in source is not proof of natural rendered acting.

## Record the outcome

Review the actor's dialogue through the shared HUD preview: the portrait must
belong to the selected actor, use its approved style, speak while text reveals
and return to rest afterward. Keep the portrait left and text/actions right in
the bottom-centered wood frame. Preserve pause/restoration, page/choice behavior
and reduced-motion handling. Follow [PawTrail HUD Creator](../../pawtrail-hud/SKILL.md)
for interface work; a new actor reuses the existing HUD instead of creating one.

For a new actor, also confirm delivery of its own matching animated illustration
after the portrait/icon stages. It must be selectable in the actor preview's
Illustration tab, play the authored hair/cloth/accessory loop, support pause and
restart, and retain the resting fallback for reduced motion and failed loads.
Include its direct preview URL, pixel-style comparison, actual bundle bytes and
motion-review status. A generated file, another actor's artwork or a still-only
preview does not complete that stage. Keep preview installation distinct from
promotion into real loading screens or gameplay ability overlays.

Record pass/fail/pending for body action, props/garment fit, portrait emotion,
sound/effects/shadow, click/open response, illustration/background/aura composition,
foot circle and applicable boss-enrage presentation, and return behavior. Fix affected states and re-review them
before promoting a character; retain unrelated approved features. Distinguish
live-model updates from baked sheets that still need explicit re-export.

Do not run tests, builds or browser review when the workspace disallows them.
If the request authorizes only implementation/skill changes, do source review
and mark visual action acceptance pending. Never relabel unreviewed actions as
verified, nor expand this review into unrelated backend/application testing.
