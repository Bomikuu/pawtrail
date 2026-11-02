# PawTrail asset credits

Retrieved and verified on 2026-11-02. The original foundation used provisional brand artwork; the owner subsequently supplied the illustration sheet documented in [PawTrail illustration crops](pawtrail-illustration.md). No real animal photographs were supplied. Stock subjects illustrate fictional records: their names, locations, care needs, and stories are not claims about the photographed animals. These assets do not document an actual rescue, adoption, payment, or endorsement. The same photo follows the same fictional animal through its profile, campaign, and post. Only Milo and Luna have assigned photographs; remaining records retain the shared honest fallback.

## Photographs

Both primary Unsplash photo pages explicitly state “Free to use under the Unsplash License”. The [Unsplash License](https://unsplash.com/license) permits download, modification, distribution, and commercial use. Do not sell unmodified photos or compile them into a competing image service. Attribution is provided voluntarily. JPEGs are delivered locally, not hotlinked. The source CDN performs a 960 × 720 center crop and JPEG quality 85 encoding. Origin, author, license URL, retrieval date, and illustrative-use statement are embedded in each JPEG's COM metadata.

| Local asset                       | Photographer and primary source                                                                                                   | Original download                                                                                               | Use                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `public/images/pets/milo-dog.jpg` | [Oscar Sutton — dog running on beach during daytime](https://unsplash.com/photos/dog-running-on-beach-during-daytime-yihlaRCCvd4) | [Unsplash image](https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?fit=crop&w=960&h=720&q=85&fm=jpg) | Fictional dog Milo; original photographed in Pagham, UK, not Davao.    |
| `public/images/pets/luna-cat.jpg` | [Manja Vitolic — cat sitting on window](https://unsplash.com/photos/cat-sitting-on-window-uvjB9XYlxjk)                            | [Unsplash image](https://images.unsplash.com/photo-1519234976893-8dac2e8d0299?fit=crop&w=960&h=720&q=85&fm=jpg) | Fictional cat Luna; no location or identity claim about stock subject. |

## Typography

Nunito and Inter are self-hosted variable WOFF2 fonts, unmodified upstream Latin and Latin Extended subsets. The font CSS declares upstream weight and Unicode ranges, so browsers fetch only necessary subsets. Latin Extended includes the Philippine peso sign. Normal style uses `font-display: swap`; no runtime Google Fonts request. No TTF files ship.

- Nunito copyright: The Nunito Project Authors. [Primary license](https://github.com/google/fonts/blob/main/ofl/nunito/OFL.txt), SIL Open Font License 1.1; full redistribution text in `public/fonts/Nunito-OFL.txt`.
- Inter copyright: The Inter Project Authors. [Primary license](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt), SIL Open Font License 1.1; full redistribution text in `public/fonts/Inter-OFL.txt`.
- Distribution source: [Google Fonts CSS](https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Nunito:wght@200..1000&display=swap), requested with a modern Chrome user agent; sources below are the exact returned URLs. Source CSS is retained in the development F7 scratch evidence.
- [Inter Latin](https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2), [Inter Latin Extended](https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7SUc.woff2).
- [Nunito Latin](https://fonts.gstatic.com/s/nunito/v32/XRXV3I6Li01BKofINeaB.woff2), [Nunito Latin Extended](https://fonts.gstatic.com/s/nunito/v32/XRXV3I6Li01BKofIO-aBXso.woff2).

## Original implementation artwork

- `public/images/illustrations/pet-companions.webp`: original AI-generated illustration produced with the built-in OpenAI image generation tool for this task, 2026-11-02. Source output was 1536 × 1024 transparent PNG; delivery is 960 × 640 WebP (quality 85, alpha quality 100), maintaining alpha. Exact generation prompt is in `docs/assets/pet-companions.prompt.txt` and the adjacent Impeccable provenance sidecar `pet-companions.webp.json`. This is authored decorative artwork, not licensed stock or a factual animal record. Asset-level inspection confirmed cat/dog subject; automated decode confirms alpha and dimensions. No claim of exclusive copyright is made.
- `src/components/illustrations/paw-marker.tsx`: original simple vector paw within a location marker, authored for PawTrail. It functions as an implementation brand asset; **pending owner brand review**, not a supplied or owner-approved final logo. The cat/dog cutout has the same review status.
- `src/components/illustrations/neighborhood-map.tsx`: original schematic road diagram with paw markers; not cartographic data, live locations, or Google Maps. It discloses its illustrative nature in visible text and accessible description.

No screenshot or browser review was performed. The parent-coordinated source finish review remains separate from asset provenance checks; rendered quality is unverified.

## Delivery manifest

Exact sizes and SHA-256 digests are recorded below after metadata embedding. Photos reserve 4:3 layout space through AnimalImage; the hero illustration reserves its 3:2 intrinsic ratio. Card cropping uses CSS object-fit and never changes the fixture's species.

The upstream OFL text is preserved verbatim apart from trailing-whitespace normalization.

| File                                                   |  Bytes | SHA-256                                                            |
| ------------------------------------------------------ | -----: | ------------------------------------------------------------------ |
| `public/fonts/Inter-Latin-Ext-Variable.woff2`          |  85068 | `34b9c504cab7a73e37b746343a449132e56cf7b5481af2cb81dc74dcff25c956` |
| `public/fonts/Inter-Latin-Variable.woff2`              |  48256 | `3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62` |
| `public/fonts/Inter-OFL.txt`                           |   4376 | `5dd548d31a85f756e01d63e00d7faf1e324103ed3e9102fcbbabf2cc2db6dd39` |
| `public/fonts/Nunito-Latin-Ext-Variable.woff2`         |  35588 | `2c8d792869818ecb253a46bc3c63c7013df7aac2f69291c3c85e5cdc94160960` |
| `public/fonts/Nunito-Latin-Variable.woff2`             |  39128 | `ba344451eab25b217a165363b1982048a5e5830a0daf36577973955a04cac793` |
| `public/fonts/Nunito-OFL.txt`                          |   4384 | `ee9491ad3ea5d390878695bd6cce49beb3cacd5c4312f8ab574b541e9f7afa21` |
| `public/images/illustrations/pet-companions.webp`      |  91154 | `06a28b8c9130b8e8a6d326d83b9d3daf3b5713ce4ea60a19f4c17871c8e4ac29` |
| `public/images/illustrations/pet-companions.webp.json` |    930 | `1f0b679393c2207bd49b6c27e3e12f950436d55bac9414d7ef21cedec1eaad16` |
| `public/images/pets/luna-cat.jpg`                      | 159031 | `7b3ebd4b5dd0488cd9b96f4c0ce37f8448bcf128e2318c65c85faeed37d53cc1` |
| `public/images/pets/milo-dog.jpg`                      |  89678 | `549ecbbffd008a5e82579d6e574da867611b085f2d0aa150be3ad35734054df2` |
