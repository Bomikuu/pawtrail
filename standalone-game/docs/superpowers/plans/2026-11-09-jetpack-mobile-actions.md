# Jetpack and persistent actions

Add an astronaut jetpack with temporary nozzles, pixel flames, takeoff, hovering
and landing. Keep physical navigation/collision on the existing ground plane.
Allow movement throughout the cosmetic action; its timer or explicit End/Land
starts a short landing phase before restoring normal appearance.

Apply movement persistence to every authored action, including future entries
from actions.json. Grounded gestures layer their upper body/props over shared
walking legs. Sitting, sleeping, floating, vehicle and flight poses retain their
full pose while translating. Preserve timers, effects, heading and stride until
completion or an explicit replacement, without cancelling real care workflows.

Use shared action policy and one flight playback state machine in the preview
and normal actor renderer. Reuse the canonical rig and existing effect layer.
Register the reaction for multiplayer. Export/inspect the astronaut's new native
body clips, then sync only scoped game files/assets. No agents, automated tests,
checks, builds or running-app browser verification.

Delivered the shared all-action policy, walking-leg composition, flight playback,
jetpack geometry/effects, preview controls and multiplayer reaction registration.
Exported and visually inspected 304 astronaut body frames. Scoped frontend
integration and housing service restart complete; no app verification run.
