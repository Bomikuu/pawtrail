# Goku and astronaut appearances

Add two creator templates using PawTrail Actors and the approved classic-RPG
style reference. Interpret Goku as his classic black-haired orange-and-blue gi
appearance; interpret the astronaut as a white padded suit with a gold visor,
sealed helmet, gloves, boots and life-support pack. These are new modular shapes
on the existing skeleton, not recolors of its vest.

1. Add hero hair, gi, spacesuit and helmet geometry. Extend the shared allowed
   slot contract so both configurations remain editable and saveable.
2. Add a 24-frame looping power_up pose with braced knees, clenched fists and
   chest/head motion, plus native-pixel aura, rising particles and arcs in the
   existing effect layer. Expose it in creator actions and in-game reactions.
3. Export only the two new appearances through the isolated Firefox art exporter;
   inspect the produced artwork. Do not run project tests, checks, builds or
   running-game browser verification. Preserve existing approved exports.
4. Integrate templates, scoped frontend files and generated assets into the
   running worktree. Restart only the housing service for the extended cosmetic
   contract/reaction allowlist. Update the skill and implementation notes.

Delivered both preview templates, full native exports and editable new slots.
Power up is available in the creator and in-game reactions. Scoped game files
and versioned assets were copied into the running worktree; housing was
restarted on port 8001. Native artwork inspected; no project verification run.
