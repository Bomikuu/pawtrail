# Action-driven creator portraits — 10 November 2026

The human and cat creator portraits now follow the presented body action through
the shared `actor-rig/action-portrait.ts` mapping. Amber and Yae use their existing
Refined cel collections and authored emotion/blink/breathing artwork; no portrait
images or procedural facial patches were generated for this change.

| Action intent | Portrait |
| --- | --- |
| Idle/walk/run, completed or cancelled action | Neutral |
| Pet/feed/water, wave/clap, gifts, gentle interaction | Smile |
| Happy/laugh, dance/cheer/play, hovering flight | Happy |
| Sad/cry, sick or tired | Sad |
| Angry, power-up/run or rescue dash | Angry/focused |
| Surprised or jetpack takeoff | Surprised |
| Sleep/lie down | Neutral authored closed-eye frame |

The comparison scene publishes a separate `portraitAction` after resolving
flight stages and actual clip timing. It returns to idle when a one-shot's
displayed clip finishes, when an action is explicitly ended/replaced or when a
timed ability expires. It does not alter selected actions, server authority,
ability timers, movement or care rewards. Looped actions retain their emotion
while moving. Actor-preview initialization resets the portrait driver to neutral.

`CreatorPortrait` selects the expression/blink for `LivingPortrait` and labels
the current treatment. Its renderer/cache is reused across emotion changes.
The first rendered frame now honors the requested view rather than forcing
neutral while the renderer opens. Expanding the inspector starts with the
current expression and eye state; manual expression controls then override it
and release a held sleep blink. Talking remains dialogue/manual-driven rather
than being faked for every action.

Legacy generic portraits and cat packs may have fewer expressions than the
six-expression authored human collections. They use a supported fallback and
label it as the closest available artwork. A missing emotion is not claimed
to have been authored or verified. Existing independent gallery and dialogue
expression controls retain their own inputs; this integration is the creator's
action-to-portrait binding, not a global override of every NPC portrait.

The actor skill now includes an explicit action acceptance step after body/face
and portrait creation. It covers all supported actions, props/garment fits,
movement persistence, sound/effects/shadows, portrait emotion and return behavior,
with pass/fail/pending outcomes. The portrait skill links the same integrated
review. Current workspace verification permissions still apply.

Source was reviewed and mirrored to the integrated application and archived
standalone source. No agents, automated tests/checks/builds, asset generation or
browser verification ran. Visual acceptance of these transitions remains pending.
