# PawPal recognition board

Implemented directly in the main session, following the owner's supplied leaderboard image. The intent is to recognize animal-welfare helpers through visible work and contributions, with no follower, like or audience-reach ranking.

## Surface

- Full-width public platform page at `/leaderboard` with an illustrated cream banner, four impact totals, teal period controls and responsive gold/silver/bronze podium.
- Reuses the owner's existing compact pet illustrations and achievement trophy; no screenshot text or sampled numeric values are shipped as product facts. Avatars use each person's selected illustration.
- Real helper rows show contribution totals, the existing lifetime Kibble level, optional public mastery progress, up to three chosen badge thumbnails and a link to the remaining chosen badges.
- All time, month and Monday-start week; category ranking for mission helpers, animal spotters and fundraiser supporters; name/username search; ten-row cursor pagination with previous/next and actual range.
- Podium remains the selected category's top three when searching, so a search result is not promoted to first place. Empty search/periods have working recovery links. The existing public loading and error boundaries remain in effect.
- A named keyboard-focusable table region contains horizontal overflow on smaller screens. The podium and controls adapt to mobile without removing contribution columns. Motion respects reduced-motion preference.

## Data and privacy

`features/kibble/leaderboard-service.ts` produces rows, podium and totals from the same public snapshot. Only discoverable members who share contributions are included. No evidence text, media IDs, exact location, private application or donor identity is projected. Anonymous campaign support is excluded from attributed supporter counts. Earned badges are displayed only when the owner explicitly showcases them; aggregate mastery requires its separate opt-in. No badges or higher levels are fabricated to fill the reference layout.

All contributions ranks by net Kibble within the selected period. Category rankings use their matching count, followed by approved mission count, then stable user ID. Only independently approved public missions count. Sightings must be published; fundraiser totals count distinct public campaigns per consenting helper. Zero-activity members do not fill the board. Kibble is floored at zero per helper per period; corrections affect the period in which they are recorded. One lifetime level per 100 net Kibble, starting at 1, matches the public profile's existing policy.

New mission reviews persist `reviewedAt`. Legacy mission rewards supply an approval timestamp where available; undated legacy approvals count only in All time. Sightings use their record creation date, campaign support its recorded date. All windows use Asia/Manila; future-dated records do not count. Demo time remains frozen at 2 November 2026; no sample timestamps or outcomes were manufactured to populate week/month results.

Summary totals cover the chosen period before category/name filters. Contribution totals combine approved missions, published sightings and per-helper distinct campaign support. Animal totals count distinct visible animals linked to approved missions. These counts do not establish animals rescued, successful adoptions, or medical outcomes. Explanatory copy on the board makes these definitions available.

## Contract and delivery limits

`GET /leaderboard` now accepts `period=all|month|week` and `category=all|missions|sightings|fundraisers`. Its schema adds public identity art, level, contribution counts, selected badges, optional mastery, summary, podium, offset and previous cursor. The extended response is required: missing data from an older backend is a validation error rather than zero activity. Client and BFF schemas use the same contract; the Django transport map includes the new compound keys. This is the existing local demo implementation, not a claim of live backend integration.

Graphify's existing 164-node repository graph was used as a repository/adapter locator (96 reachable nodes; output intentionally capped to 9). It does not contain the new leaderboard feature and was supplemented by direct source reading. Jev's synthetic contribution-vs-popularity policy judgment favored contribution recognition (407 input / 37 output tokens); no secrets or private records were submitted. The judgment was guidance, not verification.

Source was reviewed and formatted. No subagents, automated tests, type checks, UI checks, detector checks, builds or browser verification were run, per the user's explicit instruction. Runtime behavior and rendered layout remain unverified. The existing preview server was left running.
