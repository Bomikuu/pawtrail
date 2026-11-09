# Movement abilities

Shared rules live in `src/game/abilities/definitions.json` and are consumed by the
frontend and housing backend. Normal walk/run speeds are 105/155 px/s.

| Action | Movement/behavior | Duration | Cooldown from activation |
|---|---|---|---|
| Goku Power up | Eligible gi + hero-spikes form runs at 231 px/s with golden hair, turquoise eyes and aura | 8 s | 12 s |
| Rescue Dash | Steerable 340 px/s burst, moving in the facing direction when no input/path is supplied | 650 ms | 6.5 s |
| Gentle Approach | 58 px/s, silent footsteps; Explore shy-animal flee radius falls from 45 to 22 px | 10 s | 12 s |

Abilities replace one another and do not multiply sprint. Expiry/cancellation,
replacement, appearance changes and scene exit remove the active modifier. The
controller then computes normal movement from the current input, including Shift
sprint if held. Saved character colors and base speed are never overwritten.
No action automatically completes animal care or creates verified rewards.

## Shared movement and presentation

`moveActor` accepts the resolved speed for keyboard, touch and click paths. It
normalizes direction, clamps arrival distance, and sweeps the navigation footprint
in small steps, including a minimum fixed physics step for Arcade actors. The
server retains its full segment/bounds checks. Dashes stop at obstacles rather
than teleporting through furniture. Existing care locks still apply.

The rig has separate walk and run cycles with stronger arm swing, knee lift and
forward lean. Stride uses actual travelled distance; powered moving Goku selects
power_run while keeping his temporary form. Gestures continue to layer over the
appropriate gait. Gentle Approach has a cautious pose and leaf effect. Dash has
its own leaning pose and pixel streaks. Footstep timing follows speed and is
suppressed during Gentle Approach. Actual animal trust/welfare data is untouched.

## State boundaries

- Explore uses local timers and device-persisted cooldowns. Leaving the scene
  clears an active ability; remaining cooldowns survive reloads.
- The actor creator has separate preview cooldowns and timed abilities. Its
  comparison field moves at a consistent quarter game speed so motion can be
  inspected inside each lane; relative boosts are the same. It returns to idle
  on expiry. New pose-only Run is available as a movement/animation preview.
- Homes/yards use authenticated websocket activation. Server-owned ability_state
  and cooldowns live in PlayerGameProfile (migration 0012). Player row locks
  serialize activation. Goku eligibility comes from the owner's equipped
  PlayerCharacter configuration, never a client speed multiplier. Movement budget
  integrates authorized speed over the actual interval, including expiry and
  replacements; the ordinary global limit is not increased for everyone.
- Reconnect/room switches/disconnect clear active grants while retaining database
  cooldowns. Room status uses server-supplied remaining durations. Client stops
  movement immediately on disconnect and cannot grant itself a room boost.

The shared floating ability panel displays mode, active time, cooldown and End.
Reaction buttons and creator choices also show cooldown availability. Generated
run/powered-run/dash/cautious clips were exported for Goku and Astronaut. The packer
uses deterministic whole-clip bin packing to fit each 4096×4000 atlas, preserving
horizontal clips and native character size. `pawtrail-actors.mjs pack --id ID`
can repack an existing matching export without re-rendering artwork.

Native art review: assets/actor-appearances/reviews/gameplay-abilities.png.
Source/art review only; no automated tests, checks, builds or running-app browser
verification were performed, per AGENTS.md.
