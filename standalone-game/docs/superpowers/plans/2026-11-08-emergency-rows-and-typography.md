# Visible emergency rows, persistent animal actions and typography

**Goal:** Make urgent cases obvious in the directory, expose animal actions immediately, and adopt the requested Saira Condensed / Instrument Sans pairing throughout PawTrail.

**Design:** Saira Condensed is the primary heading/name face, Instrument Sans is the secondary body/control face. Keep existing role tokens, use real local font files and swap loading, and preserve readable body sizing. Urgent rows get a full red tint/outline plus an icon status, concerns remain amber, and ordinary help stays neutral. An animal's popup keeps Create sighting, Help & missions and Report concern visible in a non-scrolling action bar; existing real/sample permissions and routes remain unchanged.

**Constraints:** Direct work, no agents or automated checks/tests/builds/browser verification. Actual shadcn components and Tailwind. CSS only for font/theme declarations. Preserve unrelated social-worktree changes. Font files and licenses are sourced from the official Google Fonts distribution and self-hosted; do not substitute lookalike fonts or apply artificial condensation.

- [x] Add real self-hosted font assets/licenses and update game/platform/canvas role mappings and loaders.
- [x] Strengthen source-driven urgent/concern sidebar states with clear icon labels.
- [x] Make animal actions persistently available and put modal reports before long facts.
- [x] Synchronize source, record the typography preference, and document unverified runtime status.

Source and assets are installed into the platform through `sync:app`. No automated tests, checks, builds or browser verification were performed. See `docs/implementation/emergency-rows-typography.md` for delivery scope and font provenance.
