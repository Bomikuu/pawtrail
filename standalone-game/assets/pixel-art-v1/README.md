# PawTrail pixel-art collection v1

Original AI-generated artwork for PawTrail's cozy Southeast Asian neighborhood exploration/rescue setting. Generation used the built-in imagegen tool, followed by the owner's explicitly approved image-processing export pass. No existing game's assets were used as input.

## Deliverables

Use **`native/`** in a game. The `sheets/` directory preserves raw generated masters, including their original imperfect packing and partial alpha; these are not the production atlases.

| Atlas | Entries | Native cell | Packing |
| --- | ---: | --- | --- |
| `native/terrain.png` | 127 | 32×32 | 16 columns, no padding or spacing |
| `native/buildings.png` | 9 | 128×128 | 3 columns, 2px margin and spacing |
| `native/environment.png` | 36 | 64×64 | 6 columns, 2px margin and spacing |
| `native/animals.png` | 88 | 32×32 | 8 columns, 2px margin and spacing |
| `native/items.png` | 64 | 32×32 | 8 columns, 2px margin and spacing |
| `native/building_tiles.png` | 132 | 32×32 | 16 columns, no padding or spacing |

There are **456 exported entries**, including animation frames and building chunks, with an individual PNG for every entry in the corresponding `native/<category>/` directory. The exact atlas rectangles, IDs, file paths, native dimensions, anchors, palette, and animation conventions are recorded in **`manifest.json`**. Empty trailing atlas cells are not entries.

- Terrain includes eight compatible grass variants, dirt, stone, brick, concrete, asphalt, sand, gravel, flower grass, water, 16 connection masks each for dirt/stone/brick/gravel paths, 16 water shoreline masks, four inner water corners, 16 road masks, and nine grass/dirt transition tiles.
- Buildings include three colorful homes, a rescue shelter, veterinary clinic, pet supply shop, sari-sari store, bamboo house, and shaded resting pavilion. Doors remain visible. `entrance` coordinates are suggested interaction points; adapt them to gameplay collision footprints.
- Environment includes tropical trees, bushes, flowers, pots, fence sections/gate, bench, lamp, rocks, sign, bin, mailbox, bowls, boxes, beds, animal houses, feeding station, kennel, and shaded resting structures. Small props are scaled within their transparent 64px cells; the cell is not their physical footprint.
- Animals include orange tabby, black, white, calico, gray, and Siamese cats; Aspin, brown puppy, white puppy, black dog, and spotted dog. Each identity has south/west/east/north poses with two frames per direction. These are short two-frame cycles, not extended run/eat/sleep animation sets.
- Items include food bags/tins/portions, fish treats, bottles, bowls, medical supplies, carriers, toys, and rescue supplies. The last two rows contain eight coin frames and eight paw-indicator frames.
- Building chunks reconstruct the supplied buildings at their recorded offsets. They are useful placement modules, not a universal architectural roof/wall autotile kit.

## Rendering

Base terrain and character/item cells are **32×32 native pixels**. Buildings span up to 4×4 tiles, and large environment objects up to 2×2. Draw at integer coordinates and integer zoom factors, with canvas `imageSmoothingEnabled = false` or CSS `image-rendering: pixelated`. Do not use bilinear filtering, mipmaps, or fractional scaling for pixel-perfect display.

Read source rectangles directly from the manifest. Non-tile object atlases have **2px spacing and 2px outer margin**; setting an engine's cell width alone will cut the wrong rectangles. Terrain and building chunks have zero spacing.

```js
const sprite = manifest.sprites['animals/orange_tabby_south_0']
ctx.imageSmoothingEnabled = false
ctx.drawImage(atlases[sprite.sheet], sprite.x, sprite.y,
  sprite.width, sprite.height, x, y, sprite.width * zoom, sprite.height * zoom)
```

Connection masks use north=1, east=2, south=4, west=8. For a path, choose the bitmask from adjacent matching path tiles; 15 is a crossroads, 5 north/south, 10 east/west, and two adjacent bits form a corner. Water mask bits mean adjacent water. Road/shore decisions must use consistent neighbor information. The nine-slice grass/dirt tiles form a separate transition family; avoid mixing unrelated mask systems at arbitrary boundaries.

Ground textures were resampled with nearest-neighbor and their opposite borders reconciled. Path and shoreline connectors were derived from the same generated grass, ground, and water textures on exact integer masks. This removes the generated master sheet's separator lines and gives common join coordinates. Map-level art review is still appropriate when combining different terrain families.

## Palette and transparency

All native assets use one shared palette of **63 opaque colors plus transparent pixels**. Alpha is binary, without soft fringes. Small noise components from the generated transparency were removed, object bounds were detected before packing, and resizing used nearest-neighbor without dithering. Lighting and world perspective follow the generation brief; human art-direction review is still recommended before a commercial release. This is not a claim of exhaustive gameplay or collision testing.

## Preview, source, and reproducibility

Open **`preview.html`** in Firefox for an enlarged, pixelated atlas catalog. It shows asset sheets only, not a gameplay mockup. It requires no server and does not start the PawTrail app.

The five complete generation prompts are saved in **`prompts/`**. `tools/prepare-assets.cjs` records the export process and requires Node.js and `sharp`; it uses the existing PawTrail installation as a local fallback. The source masters remain unchanged. The JSON manifest is the authority for the final packed files.

No application code, application tests, browser automation, or development server was started for this collection.
