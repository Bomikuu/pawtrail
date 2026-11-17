# Choose the representation before modeling

The playable Phaser scene uses native 2D artwork, including sprites rendered
from authored 3D sources. A source mesh is useful when it provides coherent
facings, volume, actor docking or animation; it is not required for every object.
Keep art representation separate from collision and interaction metadata.
Ask the owner for 2D sprites or 3D + 2D renders unless they already chose.
Actor fit, sitting and collision all work with sprites and explicit contact data.
For the current temporary catalog phase, apply [interaction-first scope](interaction-queue.md)
before this art decision: a piece that could benefit visually from 3D still stays
deferred unless it has a meaningful action or actor/pet contact.

## Retain native 2D

Use sprites for flat floor coverings, fixed wall graphics/lights/windows, candles,
state-only lamps/feeders/bowls/plants, tiny fixed-facing props and soft bush foliage.
On/off, filled/empty and watered states are sprite/state concerns, not reasons
to add a mesh. Preserve canonical art, native bounds,
anchors and existing inventory IDs. Use sprite states or small motion layers for
light toggles, sway, brush use and toys when these meet the interaction contract.

Rugs can rotate in their floor plane. A wall graphic must remain attached to its
wall orientation. A standing prop cannot gain a real side/back by spinning its
front image on screen: retain a deliberate fixed facing, draw required facings,
or promote it to a hybrid/3D route when that becomes a requirement. A static
window graphic does not implement an opening or passage.

Two-dimensional props may still block, trigger sensors, be picked up or respond
to an actor. Never erase existing collision/actions because an item stays 2D.
Conversely, retain-2D classification does not prove those actions already work.
Keep outline, alpha and state/contact review in a separate sprite-polish batch.
Do not apply a second contour to source art that already has the required border.

## Hybrid 3D

Use a meaningful structural mesh only where physical depth is separately needed,
and preserve painted layers where they save work without breaking the silhouette.
The existing aquarium is an example. Plants or lights may use this approach if a
later request explicitly needs their multiple physical views; their watering or
on/off states alone do not qualify. A sprite may have collision and sway without
modeling its pot. Flames need not become modeled particles.

These are still 3D conversion tasks. Generate/review coherent multi-angle
references for the whole item before modeling. Check silhouette and layer
overlap from supported angles. Do not call a single full-object billboard 3D.
Authored aquarium/couch/curtain models already exist; preserve them.

## Volumetric 3D

Use this route only when the owner chooses a source model. Seats, beds, cabinets,
shelves, tables, bowls, carriers, tunnels and climbing structures can also be
interactive sprites; contacts do not force a model. Source-painted materials and illustrated secondary contents remain valid;
this route does not require sculpting every painted ornament.

Inspect actual artwork before treating something as flat: the current mirror
has a standing frame/feet, blankets and towel are folded, and wall shelves have
projecting supports. These visual observations do not override a sprite workflow.

## Batch records

Read `assets/furniture-studio/batches/representation-plan.json` for item-level
decisions and `conversion-queue.json` for active 3D and sprite-polish batches.
Preserve completed batch history and route pending items without silently
counting retained sprites as converted models. Share actual matching model
families and material/state variants, retaining distinct catalog IDs.

The initial representation audit is historical. The owner's later interaction-first
scope supersedes its broad conversion counts; read the current queue and
`interaction-plan.json`. Entries describe planned work, not proof that declared
actions or new models have been implemented. Revisit a decision if gameplay
requirements change.
