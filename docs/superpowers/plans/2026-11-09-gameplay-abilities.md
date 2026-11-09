# Gameplay abilities

Implement Goku's Super Saiyan power_up as a real 231 px/s speed boost for eight
seconds, with a dedicated run cycle. Rescue Dash propels at 340 px/s for 650 ms
and has a 6.5 second cooldown. Gentle Approach runs for ten seconds, moves at
58 px/s, suppresses footsteps and reduces the shy-animal flee radius. Existing
walk/run speeds are 105/155 px/s. Abilities replace one another and do not stack
with sprint. Ending/removing a modifier recomputes normal movement immediately.

Share action definitions, motion profiles, timers and cooldown UI across preview,
Explore, house and yard. Local/preview timers are clearly local; room activations
and cooldowns are stored in the actual housing database. The websocket server
validates ability eligibility and movement budgets/segments rather than trusting
client speed. Keep real care constraints and collision intact. Animate run/dash
and cautious movement on the existing rig, and expose all abilities with status,
remaining time, cooldown and cancellation.

Implement directly without agents. Export native action artwork in the isolated
Firefox authoring workflow; source/art review only. Do not run automated tests,
checks, builds or running-app browser verification.

Delivered shared movement modifiers, dedicated run/powered-run/dash/cautious poses,
quiet/shy-animal behavior, local/preview cooldowns, server-owned room grants and
movement budgets, status/cancel controls and migration 0012. Native Goku/Astronaut
action art exported and inspected. Scoped integration and housing restart applied.
No automated project or browser verification run.
