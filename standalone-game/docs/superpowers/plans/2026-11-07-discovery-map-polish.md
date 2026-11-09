# Discovery map controls and state feedback

**Goal:** Give animals a legible photo preview, make common map actions directly discoverable, promote proximity results to a popup and restore recognizable PawTrail/account navigation.

**Architecture:** Compose the existing official shadcn layer into a separate discovery header, floating controls and nearby popup. Reuse the platform's public session projection for account links. Keep sidebar search/results and permissions unchanged. One contextual overlay is active at a time; the nearby trigger remains visible after dismissal.

**Motion thesis:** The focal change is the selected animal/nearby panel arriving from the map edge. Fast 180–220 ms opacity/translation transitions acknowledge selection, popup changes and filter panels; 120 ms exits release the map. Count/location updates receive a short local reveal and an accessible status message. Existing camera movement preserves spatial continuity. Reduced-motion skips animations and uses immediate camera changes. No dependency, layout-wide choreography or perpetual decoration.

**Constraints:** Direct edits without agents. No automated checks/tests/builds/browser verification. Official shadcn sources, Tailwind first. Preserve MapLibre, sample provenance and real/private backend boundaries.

- [x] Enlarge animal media and preserve full-photo framing; add panel entry/exit feedback.
- [x] Add branded header with Community, My home/yard, saved places, reports and account navigation.
- [x] Move common actions onto the map and make Nearby a visible, dismissible contextual popup with corrected wording.
- [x] Add accessible location/loading/status feedback, responsive placement and reduced-motion handling.
- [x] Synchronize the game integration and document the updated surface.
