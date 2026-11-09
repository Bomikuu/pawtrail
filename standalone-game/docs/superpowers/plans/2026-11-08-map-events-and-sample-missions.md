# Map events, sample mission flow and clear animal controls

**Goal:** Link nearby sample animals to usable sample missions, expose animal characteristics/report actions, improve icon badges/filters, add event discovery and remove basemap/zoom duplication.

**Architecture:** Keep deterministic local sample missions in a shared catalog and explicitly local session store, with real sample mission URLs handled by the existing Play route. The same sample offer state appears in help and mission views. Real mission APIs remain unchanged. Extend the public discovery projection with intentionally public scheduled event venues. Both map engines use one shared zoom-control component, with only the active renderer's controls mounted; preserve the camera across automatic fallback. The existing vector street style supplies more street/building detail at closer zooms, without a mode button.

**Constraints:** Direct implementation, no agents, automated tests/checks/builds/browser verification. Official shadcn/Tailwind with small action corners and neutral text. Do not write fixture offers/reports into real platform data or award Kibble. Keep provenance and missing public characteristics explicit. Report actions on actual animals use existing capture/private-review flows; sample reports are local practice.

- [x] Add local sample mission catalog/pages/shared offers and map animal characteristics.
- [x] Add reusable icon badges, characteristic facts and animal report actions to both pet/help views.
- [x] Add events to public projections, sample data, clusters, layers, filters and details.
- [x] Remove manual basemap switching and native duplicate controls; share zoom UI and preserve camera on automatic fallback.
- [x] Synchronize the app and document implemented behavior and runtime verification limits.
