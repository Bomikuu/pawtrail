# Natural fast run — 10 November 2026

The owner selected a natural fast run: forward lean, bent elbows, clear push-off
and landing. The shared human `createRescuer` pose now has a 38% contact interval,
a 4.2-unit fore/aft stride, toe-off roll/lift, early heel/knee recovery and
heel-first arrival. Run body compression/rise is accounted for by the leg IK
target, rather than adding an independent root bounce after solving the feet.
Opposing arm swing uses a continuous cosine phase with roughly 60-degree elbow
bend. Compatible run/power/dash layers restore that same computed arm pose;
ordinary running keeps relaxed hands while powered actions retain their fists.

This is a shared pose update, not a speed/ability rewrite. Walk pose branches,
run clip metadata (12 frames at 18 fps), timers, cooldowns, collision, sound
lifecycles and server movement budgets remain unchanged. Live human appearances
inherit the updated run; previously baked sprite sheets remain unchanged until
explicitly re-exported. Cat locomotion is outside this change.

The Amber/Yae study toolbar now includes **Running**, using the run clip's
metadata duration. Both studies recognize running as locomotion for blinking
policy and secondary hair/garment motion. Their continuous wind clock remains
independent of action changes. Native comparison capture uses the same run
phase and gait as the live field. Both live rig renderers retain their bounded
cache and shared offscreen stage.

The owner retained reference-specific faces with a soft jaw contour. Yae defaults
to her own profile again; the Amber-profile experiment is preserved as the
optional left-hand comparison, with the preferred Yae profile on the right.
The actor skill records this face policy and the natural-run direction.

Source was reviewed and scoped copies were mirrored to the integrated app and
archived standalone source. No agents, automated tests/checks/builds, browser
verification or sprite export ran for this revision. Review **Running** at
`/play?compare=amber` or `/play?compare=yae` before accepting its visual result.
