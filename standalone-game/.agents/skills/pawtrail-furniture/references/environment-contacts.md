# Actor and environment contacts

## Working surfaces

- `/play?compare=furniture` compares the original sofa and Trail couch at the
  same native scale. Both use the current character creator appearance. The
  original now has four authored sprite views with seat points and foregrounds.
  The separate source-model couch keeps its own docking, layers and collision.
- The **Interaction field** uses WASD/arrows or held direction controls;
  Shift/Run enables running. It has explicit geometry overlays, garden rain,
  shovel/mower selection and a local reset. Its resources/soil are preview
  state only. No authenticated room or player inventory is changed.
- Live **Inventory** and the **Workshop** expose server-owned garden tool
  purchase/equipment. The shovel uses E or Dig facing tile; the mower changes
  eligible grass under accepted movement. Put the shovel away to restore the
  usual E interaction priority. Only the owner's yard can be changed.
- The installed **Curtained opening** now has actual 3D timber posts, a clear opening and pleated cloth geometry. **Aquarium** has a 3D cabinet, glass/water volume, plants and fish. Both have four facings and native motion frames. **Soft garden bush** and the separate legacy bamboo-window decoration still use their existing 2D art.

## Source map

- `src/game/furniture/contacts.ts`: swept soft sensors, bounded damped sway,
  spaced/fading footprints, solid movement with short running recoil, and
  bounded fish paths. The comparison and Homes share these mechanics.
- `interactions.json`: item/profile bindings, local sensor/cloth/water bounds
  and the five interaction contracts. `reactive-items.json` supplies the two
  legacy-art contact examples. Merge only those IDs when installing.
- `comparison-field.ts` and `src/components/game/furniture-comparison.tsx`:
  the local playable field and original/current native couch previews.
- `room-reactions.ts`: Phaser cloth/fish/tool/soil/footprint layers.
- `src/game/housing/{scene,outdoors}.ts`: actual local/remote actor movement,
  contact observation, scenery sway, equipment and digging controls.
- `backend/housing/environment.py`: server wet status, owned equipped tools,
  terrain eligibility and durable soil writes. `live.py` only mows from
  accepted movement and broadcasts changed cells. `service.py` owns purchases
  and equipment through the existing idempotent player transaction.
- `src/components/game/housing/garden-tools.tsx`: actual inventory/workshop
  controls, not authoring-only ownership.

## Author a contact contract

Choose the needed responses for the piece; not every item needs every response.

1. **Solid:** author ground/placement shapes separately from image alpha.
   Preserve frame posts, tank bases and structural walls. Use the same foot
   body and swept clearance in client/server navigation. Running collision
   may recoil along the blocked normal; recoil must itself obey clearance.
   It does not deal damage, bypass collision or award resources.
2. **Soft contact:** define a local sensor for cloth, leaves or grass. Detect
   the actor's swept feet, including a fast crossing, then apply a bounded
   impulse. Ease back to rest, scale the response by walk/run and keep the
   sensor/collision independent of the visual spring. Move the curtain mesh
   or cloth layer, never its rigid frame. Reduced motion settles the spring.
3. **Ambient:** define water/animation bounds independently from collision.
   Fish swim without needing an actor nearby and stay in the tank. Keep
   existing static art provenance clear; a moving overlay does not turn the
   original sprite into a rigged 3D aquarium. Author a real model when that is
   requested. Reduced motion uses a stable arrangement.
4. **Status response:** take the actor's effective status as input. Rain
   exposure carries wetness for 45 seconds after leaving rain. Indoor floors
   emit footprint marks at traveled-distance intervals; marks fade within
   12 seconds and are capped at 100, rather than creating a sprite per frame.
   Wetness is temporary game state, not an identity attribute. Do not keep
   refreshing its lifetime merely because a renderer still displays it.
5. **Tool response:** specify ownership, equipped tool, action/accepted motion,
   eligible surface, range, permission and resulting surface. Current example:
   shovel digs nearby grass on explicit action; mower changes grass under
   movement to soil. Grass-to-soil is deliberate for this owner's brief.
   Do not silently replace it with mowing-to-short-grass behavior.

For native rotated views, rotate/project the sensor, rigid collision, cloth
hinges and ambient bounds together with the model. The legacy bush and bamboo-window examples support only their authored front facing. Do not add arbitrary
sprite rotations to imply missing model facings or contact metadata.

## Authority and lifecycle

Visual sway, fish phases and footprints are temporary client presentation.
Live movement carries server wet/equipment information for remote actors;
clients may predict rain footprints but cannot authorize inventory/terrain.
Wetness uses an expiring game-server cache, so a server cache reset clears it.

Tools are reusable game supplies bought with game Kibble. Equipment is a
`garden-tool:<id>` fact allowlisted against owned supplies. Yard soil lives in
`PlayerHouse.object_states` under `yard:terrain:<x>,<y>` and is exposed to that
room as `terrain:<x>,<y>`. Keep this namespace separate from furniture IDs.
Terrain writes lock the player and house, validate the actual room position,
reject nonowners/paths/buildings/occupied ground and are idempotent for an
already-soil tile. Do not accept a client claim that it owns a tool or is wet.

Room changes/reset/shutdown clear transient object pools, input handlers,
animation frames and renderers. Teleports should not drag a sensor sweep or
footprint trail across a whole map. Keep comparison changes separate from the
actual yard, and report verification honestly under the workspace rules.

## Native model update

The curtain and aquarium now use generated `reaction` and style/view `motion` metadata. Resolve it with `furnitureAt` before transforming a sensor or selecting a motion texture. Curtain response samples signed deflection around the rest frame; aquarium playback loops its authored fish poses. Native foreground frames share the base frame dimensions. The local contact field uses the same installed native assets and projected collision, not its former cloth/fish overlay drawings.

Legacy bamboo-window and garden bush profiles remain 2D. Do not describe those as rotatable models or change their advertised support. The old front-only restriction applies only to those legacy pieces.
