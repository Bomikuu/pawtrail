# Shared PawTrail play interface

Explore (`/play?explore=1`) is the visual baseline for the shared community, home and yard interface. Both React entries compose the same official shadcn components through:

- `components/game/shared/play-chrome.tsx`: the viewport shell, header, currency display, responsive footer, loading state and view controls.
- `components/game/shared/play-controls.ts`: one ordered catalog of action IDs, labels and Lucide icons. Both modes supply typed behavior, disabled/active state and unread count.
- `components/game/shared/reactions.tsx` and `game/reactions.ts`: the same reaction picker and effect mapping in both renderers.
- `game/play-navigation.ts`: client-side mode navigation and one-shot feature handoffs, using the native history API instead of full document navigation.

The footer now offers Explore, My house, Animals, Yard, Friends, Chat, Decorate, Journal, Backpack, Missions, Cat sounds, React, Photo, Album, Community, Places map, Story map, Settings and Help in both modes. Mobile/tablet shows Explore, My house, Animals and Backpack, with the other actions in the same More menu. Buttons keep compact rectangular corners; the movement joystick remains circular.

Explore’s Backpack, Journal, Missions, Cat sounds, reactions, photographs, album, story map and settings work in the current exploration scene. Friends and Chat open the shared community with the relevant social tab; Decorate opens the owner’s house and its editor. There is no pretend room chat or decoration applied to a story map. The handoff waits for the authenticated housing session before applying its action, then consumes the action parameter. Home and yard entrances reuse the mounted housing canvas while the destination connects. Browser back/forward selects the corresponding mode.

Photo captures an in-game scene into the existing local album, using a bounded nearest-neighbor export. It neither requires an animal to be nearby nor creates a sighting or earns Kibble. Existing animal photographs still work. Photos remain limited to twelve and the existing save size limit; the save parser accepts the four explicit scene-photo identities as well as existing animal IDs. The camera export is a runtime product feature, not a verification action performed during implementation.

The common header and save status distinguish local exploration progress from server-saved housing progress. Their Kibble balances are intentionally separate from one another and from verified platform rewards. The visual shell is shared; it does not merge independent persistence systems or replace the two scene implementations.

No agents, automated tests, checks, builds or browser verification were used for this delivery. Changes were inspected in source and formatted, then synced into the platform worktree. Runtime appearance, history handling, camera export and account handoffs remain unverified.
