# Emergency directory rows, animal actions and typography

Urgent animals receive a red-tinted sidebar card, red border/photo outline and warning badge reading “Needs urgent help.” The existing attention resolver remains authoritative: urgent public requests and serious corroborated concerns get red; missing animals and reports under review retain amber. Ordinary help stays neutral. Group rows can identify urgent resident animals without applying their status to every resident. Sample labels remain visible.

Animal popups keep a non-scrolling action footer below the scrollable photo and details: Help & missions, Create sighting and Report concern. The help dialog exposes sighting/concern actions before the longer characteristics panel. Existing action handlers still govern real records, authentication and local sample practice. No rewards or real reports are created by viewing these controls.

## Typography

The owner's requested pairing replaces Nunito/Inter throughout the standalone game and integrated platform, including the management dashboard:

- Primary headings, names and world labels: **Saira Condensed**, regular/semibold/bold/extra-bold.
- Secondary body text, controls and dialogue: **Instrument Sans**, variable weight 400–700.

Local WOFF2 subsets use `font-display: swap`. Latin and Latin Extended are available for both families; Saira Condensed also includes Vietnamese. Subsets load by Unicode range. The 14 files total approximately 195 KB; browsers only fetch the subsets and weights used. Two common Latin faces are preloaded. Phaser waits for the regular/bold heading and body faces alongside its module import before creating static text; font failure retains the browser fallback.

Canonical declarations are in `src/game/fonts.css`. Standalone theme CSS imports them; `sync:app` copies them to the platform's `src/styles/pawtrail-fonts.css` and installs the assets under `public/fonts/pawtrail`. The platform root layout imports the font declarations directly as global CSS, avoiding Tailwind's nested stylesheet resolver. Existing role tokens remain updated. The sync step removes the duplicate font import from the installed game theme. Actual shadcn primitives remain unchanged.

Official distributions: [Saira Condensed](https://github.com/google/fonts/tree/main/ofl/sairacondensed) and [Instrument Sans](https://github.com/google/fonts/tree/main/ofl/instrumentsans). Original URLs and file sizes are recorded in `public/fonts/pawtrail/manifest.json`, with both OFL license files alongside the exports. Runtime font loading is same-origin and does not call Google Fonts.

## Delivery limits

Implemented directly without agents. No automated tests, checks, builds or browser verification were run, following the current owner instruction. This records source-level implementation, not a claim of verified runtime appearance or behavior.
