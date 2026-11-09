# PawTrail character creator

The requested outcome is an editable version of the actor preview: choose real geometry for hair, clothes, headwear, wings and held items; edit the palette; inspect every existing human action and facing; name and save personal characters. The existing approved characters and shared animation poses remain authoritative.

Implementation is direct, without agents, automated checks, builds or browser verification, as required by AGENTS.md.

1. Share the authoring rig with the application. Preserve old export imports through compatibility wrappers. Use native-resolution rendering, the same camera, palette quantization and outline treatment, and integer display zoom. Appearance edits update the existing preview rather than navigating or baking a new atlas.
2. Add a versioned, strictly validated appearance configuration and named personal library. Persist signed-in saves in the housing database with owner checks; retain an explicitly labeled device-only option. Store no uploaded references or executable assets. Add migration and API routes using the existing account bridge.
3. Replace the preview route with a responsive creator. Compose installed shadcn controls, grouped equipment tabs, color controls, templates and a saved library. Preserve the old comparison route and reusable preview timing, movement, emote and direction controls. Add loading, save failures, dirty-state protection and accessible labels.
4. Let saved characters be selected deliberately for play using the same canonical rig. Keep cosmetics separate from authoritative rewards, care and animal data.
5. Update actor skill/documentation and copy only scoped game files into the running social worktree. Apply the requested database migration and restart only the affected housing service. Review source without running prohibited verification.

Delivered: shared rig/pixel renderer, editable preview, validated local/account
libraries, JSON backup/import, explicit game selection, account-only home
selection, migration 0011 and scoped running-app integration. Housing service
restarted on port 8001. Source review only; no automated or browser verification.
