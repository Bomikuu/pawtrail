# Yae Miko — animated pixel portrait preview

> **Visual acceptance update:** the owner rejected Yae Miko Sharp cel's facial
> performance. The later diagnostic confirms loss of expression during blink and
> speech. The installation observations below are not a quality pass. See
> `docs/implementation/sharp-cel-portrait-motion-review.md`. Other styles have not
> been re-audited by that diagnostic.

Installed at `/play?preview=portraits` in the **New pixel collection** tab. The
Character selector defaults to **Yae Miko**; **Photo reference** retains the prior
five-style collection. Switching character preserves the corresponding style.

Each of the five styles has front, three-quarter left, true left profile and
rightward head tilt. Neutral, smile, happy, sad, angry and surprised use complete
authored native reference frames. Manual and natural blinking, small/rounded
speech, dialogue playback, pause and subtle chest breathing reuse LivingPortrait
and the existing Canvas 2D renderer. No new renderer or WebGL dependency is added.
The 360px preview and fixed opaque-content bounds retain integer nearest-neighbor
zoom, including the smaller 72×72 Console icon.

The original static neutral PNGs are retained unchanged. Five built-in image_gen
calls produced the expression construction sheets using the approved character
portraits. Local production calibrates each eye and mouth independently, then
composites authored contextual facial pixels onto the original portrait. Hair,
ornaments, clothing and the outer silhouette remain based on the approved art;
facial feature windows supply the acting. This uses no generic eye or mouth
redrawing. Native palette conversion preserves the reserved gold/violet accents.

The generated last column was clipped. It is explicitly excluded: complete
small-O surprised lips and the larger authored speech-O lips provide the two
speech sources. A clipped portrait is never stretched into a full reference.
`import-report.json`, `calibration.json` and `source.json` record these decisions.

| Style | Runtime atlas + JSON bytes | Complete style, including 24 reference PNGs |
| --- | ---: | ---: |
| Sharp cel | 80,989 | 166,209 |
| Compact fantasy | 81,559 | 167,535 |
| Sparse anime | 75,690 | 154,807 |
| Console icon | 46,099 | 96,317 |
| Rough manga | 105,006 | 210,661 |

Every complete style is below **250,000 bytes**. Authoring sources, enlarged
contact sheets and the original character illustration are excluded from runtime.
Only the selected animated style loads; the style rail uses small neutral PNGs.

## Production and integration

1. `import_performance.py` imports valid generated columns with an explicit native
   grid and the original fixed palettes. `prompts.json` contains all five exact
   built-in image_gen prompts; `generated-sources.json` records source provenance.
2. `author_expressions.py` applies per-angle native calibration using shared
   `scripts/portrait_image_layers.py`, producing full references and aligned motion.
3. `python3 scripts/prepare-portrait-collection.py output/imagegen/pink-shrine-emotions-v1/source.json`
   creates the existing version 2 runtime contract and measured size report.
4. `install_collection.py` copies only this portrait directory and three catalogue/
   studio modules to the integrated application. Assets publish before catalogue
   references; atlas+manifest hashes invalidate bundle/poster caches together.

Public assets: `public/pawtrail-game/game-assets/dialogue-portraits/pink-shrine-emotions-v1/`.
IDs are character-specific (`yae-miko-style-1` through `yae-miko-style-5`), avoiding
collisions with the previous collection. Existing game portraits and bodies are
unchanged. The broad game synchronization command is not used.

## Review

Native half/closed/small/round motion sheets were visually inspected in all
20 style/angle combinations. Complete expression contact sheets for Sharp cel
and Console icon, plus representative live emotions in the other styles, were
reviewed. The authorized Firefox
visual review covers the live character chooser, Compare mode, representative
emotions across all five styles, Console blink/speech playback, and mobile size.
Seven distinct Console playback frames were observed for each angle; mobile
content and viewport widths both measured 390px. No runtime page errors occurred.
The previous-character switch was confirmed after waiting for its heading.
Evidence lives in `output/playwright/shrine-portraits/`. No automated application
tests, type/lint checks or production builds were run. This targeted visual review
does not claim a fresh pixel comparison of every possible motion combination.
