# Animal help dialog and neutral small-radius controls

**Goal:** Open an actionable help dialog from Check it out, showing the actual animal, published help needs and related mission, and replace pill-shaped action controls with standard compact shadcn styling.

**Architecture:** A composed official Dialog resolves the attention source, optionally fetches the existing public animal/mission projection, offers private local-request help through the existing housing API, and joins missions through the existing platform acceptance API. Animal/view-on-map/report handoffs keep their current permissions. Standalone fixtures support an explicitly local practice offer; no fictitious real request or mission is created.

**Visual direction:** Preserve PawTrail's brand and animal circles. Routine action buttons use rounded-md corners, neutral foreground labels, existing orange/brown primary accents, standard shadcn borders, focus and disabled states. Neutralize the host application's teal link token only while the game route is active; give portaled menus/dialog titles explicit foreground color. Keep animal markers and avatars circular.

**Constraints:** Direct implementation, no agents, automated checks/tests/builds or browser verification. Tailwind first; CSS limited to route theme tokens. Do not award Kibble or manufacture a participation on the client. Real mission participation remains authoritative through the existing API.

- [x] Add public mission-detail and offer/join methods to the platform bridge, with identity/open/deadline validation.
- [x] Compose the help dialog, animal/need details, local-request offer form, mission actions, sample practice and missing-source states.
- [x] Connect Check it out and map/detail/report handoffs without stacking modals or losing the intended source.
- [x] Replace action-pill classes, neutralize game link color and give portal/text compositions explicit foreground styling.
- [x] Synchronize the integrated app and document changes and verification limits.
