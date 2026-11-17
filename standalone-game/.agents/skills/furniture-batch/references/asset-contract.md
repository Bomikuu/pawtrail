# Furniture contract

Use the host project's existing schema. The following are requirements to map,
not a second catalog to introduce alongside it.

- Stable catalog ID, source files/hashes and representation (`sprite` or authored
  model with rendered sprites). Retain original front/reference provenance.
- Native frame, anchor, alpha, filtering and supported facings/rotations.
- Per-facing ground and placement shapes, reachable approaches and safe exits.
- Seat IDs, point, facing and elevation where applicable; reserve/release through
  the existing controller and server authority. Use the actual native-scale actor.
- Foreground/occlusion pixels that share the base frame/anchor; draw the body,
  actor and foreground in the correct order. Source RGBA must remain intact.
- Existing durable state fields (`lit`, `open`, food/water counts), matching art
  and optional state-specific geometry. An open door retains its frame collision;
  a light toggle leaves its solid body intact. Existing state defaults apply.
- Semantic material masks protect non-recolored regions. Body and foreground
  use the same palette, with independently owned mutable textures per placement.
- Temporary visual reactions (sway, fish motion, footprints) have bounded areas,
  reduced-motion behavior and cleanup; they do not authorize durable world writes.
- Recipes, timers, costs, inventory, occupancy, revision conflicts and rewards
  stay in the existing server service. Never promote preview data to account data.
- Review evidence distinguishes source/art review, local interaction and real
  authenticated persistence. Retain pending states instead of claiming completion.

For a fixed-facing candle, reuse original on art and produce proper unlit pixels.
Retain the existing `lit` default, toggle permission and collision. Test only the
new state visuals and the affected state-selection path when authorized. No
turnaround, seat pose, mesh or broad editor/mobile review is justified by that item.
