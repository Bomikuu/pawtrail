# Cat meme wheel — 9 November 2026

## Delivered scope

Play has a dedicated Cat memes control alongside the existing reactions. On small screens its label shortens to Memes. Explore, Home, Yard and the shared world use the same footer component. The existing standard reactions and cat soundboard remain available.

The twelve-slot floating ring has nine populated slots: Cat laugh, Mu hehe cat, Oiia oiia, Huh cat, Happy cat, Yapapa, Boing cat, Banana cat and Scuba cat. The other three wedges are visually empty and do not trigger actions. Each populated slot shows a single canvas-drawn frame from its remote GIF, never an animated image in the wheel. Wheel previews use a uniform circular cover crop. Hover/focus has a stronger primary outline and ring over a fully opaque warm accent wedge; the game never shows through the selected wedge. A small preview enlargement is suppressed for reduced motion/effects. Selecting a slot immediately starts its remote sound and shows the animated GIF in a stepped pixel speech bubble above the player. The bubble is 104px wide, or 88px on short screens. It has a thinner two-pixel stepped frame, a quiet image well, a full-width caption beneath the GIF, a soft offset shadow and a connected tail. The small overlaid stop icon retains a 44px hit target without taking space from the image/caption. Sound failure uses a compact labeled retry icon. Its viewport clamp uses the actual bubble height. It follows the current camera and hides for offscreen actors. No remote image enters the Phaser canvas or photo export.

The wheel uses the installed official shadcn Dialog and Button components, the existing warm theme tokens, Saira Condensed names/headings and Instrument Sans controls. The enclosing rectangular card is removed; the circular ring floats over the game with separate compact mute/close controls and a caption. Full-wedge official Buttons are clipped with SVG geometry; keyboard focus also outlines the corresponding thumbnail. It is an extension of the established play shell, without a replacement visual system or shared registry edits. DESIGN.md remains unchanged.

## Character at the center

Explore and Homes pass their selected appearance through the shared footer. The lazy center preview now follows the game's own rendering choice: `bakedActor('player', identity)` supplies a finished native sheet when one exists; other appearances use the same `createModel`, `modelStage`, `pixelRenderer` and preferences as the world renderer. The copied authoring GLB is no longer used and its two feature-only public files were removed. No new appearance, geometry, shared pose function, sprite sheet or roster entry was authored.

Native characters use the exact sheet file, frame dimensions, spacing, margins, idle animation indices/rates and `bakedDirection` heading mapping used by Phaser. The preview draws at native resolution with integer 2×/3×/4× display sizes and nearest-neighbor sampling. It turns toward hovered/focused wedges, including empty wedges, using the eight exported directions. Finished sheets do not contain independently movable eye/head joints; no new joint animation or altered character silhouette is fabricated. The loading portrait comes from that same active sheet's export directory. Non-baked characters retain temporary head tracking on their existing runtime rig, now with the game's camera and proportions.

The native preview paints only when its exported frame changes; its request loop stops when hidden or closed. Mesh previews remain bounded to roughly 30fps and release their resources/context on close. Reduced motion freezes idle frames while retaining direct directional selection feedback. Preview actors never modify the separate world actor.

## Controls and lifecycle

- Tap or click a populated wedge, use arrows followed by Enter, or choose keys 1–9 while the wheel is open. Keyboard navigation skips empty slots. Escape/outside click closes it; Dialog restores trigger focus. Game input is paused while the wheel is open.
- Each meme has a 15-second cooldown, with a shared five-second wheel cooldown. The whole ring and hub use an opaque warm locked-state fill during the shared cooldown, with an explicit countdown badge/caption. Each meme has its own remaining-time badge and grayscale preview while unavailable. The footer stays openable for inspection and shows its own shared countdown. Click, touch, Enter and shortcuts all pass through the same reservation guard; blocked attempts do not dispatch sound/GIF or network events. There is one active meme per actor, at most four visible actors and a twelve-second upper limit. Completed short sounds leave their bubble visible for at least 3.5 seconds.
- The wheel and bubble enter with a short zoom/fade. System reduced motion and the existing reduced-effects setting suppress these transitions and use a still preview in the bubble.
- Sound respects master/effects volume, the existing soundboard volume, mute-other-players preference and audio range. The wheel can mute meme sounds. Its unmute action explicitly identifies when game sound is also muted.
- Local playback runs synchronously in the selection event to retain browser user activation. An unavailable/blocked sound offers Try sound again; unavailable GIFs retain a readable fallback. Stop, replacement, page hiding and unmount release audio and timers.

## Multiplayer boundary

Home/World sharing sends only `player.meme` and one of the nine allowlisted IDs. The server authenticates the existing room connection, checks membership and rate limits the event; clients never supply arbitrary media URLs or authoritative positions. Existing blocked-user filtering applies. The sender renders immediately and ignores its own server echo; other players render at the corresponding actor, with distance attenuation. Explore remains local. This event does not create database records, rewards, achievements or verified Kibble.

`meme-cooldowns.ts` stores browser deadlines outside the wheel component, persists them to localStorage and observes storage changes from other tabs. Closing/reopening the menu, remounting it or ordinary reloads retain unexpired deadlines. This browser store is a convenience guard, not an authoritative multiplayer record.

The server's `housing/meme_cooldowns.py` checks the shared and per-meme deadlines before updating either. It runs inside the existing player-row transaction lock in `validate_live`, with per-player cache state across rooms; configured production Redis shares that state across workers. Development's existing local-memory cache remains process-local. Rejected attempts neither update deadlines nor broadcast a meme. Acceptance/rejection durations are sent privately to the sender, and the current server state is included in the authenticated ready handshake. The browser reconciles those durations conservatively. Changing browser storage cannot bypass the server's broadcast guard. Local visual/audio feedback remains optimistic; the server controls sharing with others.

## External media and provenance

The user's supplied URLs are authoritative in `src/game/cat-memes.ts`; no GIF, MP3, frame extraction file, proxy cache or generated replacement was added to the repository. Frozen previews exist only in disposable browser canvases. Normal browser transfer/caching still occurs to display/play remote media.

Source collection: [Myinstants cat memes](https://www.myinstants.com/en/search/?name=meme%20cat).

- Cat laugh: [MP3](https://www.myinstants.com/media/sounds/cat-laugh-meme-1.mp3), [GIPHY GIF](https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyYXVma2cxamxxdTJkMHp0dHY5anFuZWx5d3V1OTRmcDUwYnRlMzg2aCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2g6sCTsSoVuSfSxK4W/200w.gif).
- Mu hehe cat: [MP3](https://www.myinstants.com/media/sounds/mu-hehehe-cat-meme.mp3), [Tenor GIF](https://media.tenor.com/7eUXcwpTijAAAAAM/muhehe-cat-muhehe.gif).
- Oiia oiia: [MP3](https://www.myinstants.com/media/sounds/oiia-oiia-sound.mp3), [Tenor GIF](https://media.tenor.com/sbfBfp3FeY8AAAAj/oia-uia.gif).
- Huh cat: [MP3](https://www.myinstants.com/media/sounds/huh-cat-meme.mp3), [Tenor GIF](https://media.tenor.com/YpVqLrEIa7IAAAAj/huh-cat.gif), resolved from the [user's Tenor page](https://tenor.com/view/huh-cat-gif-7103700736017984434).
- Happy cat: [MP3](https://www.myinstants.com/media/sounds/happy-happy-happy-cat-meme.mp3), [Tenor GIF](https://media.tenor.com/DpJdyKQKgYkAAAAj/cat-jump.gif), resolved from the [user's Tenor page](https://tenor.com/view/cat-jump-happy-jumping-for-joy-jumping-gif-23625303).
- Yapapa: [MP3](https://www.myinstants.com/media/sounds/yapapa-cat_UwLkrYZ.mp3), [Tenor GIF](https://media.tenor.com/xXNzEkd7BYYAAAAi/yapapa-cat.gif).
- Boing cat: [MP3](https://www.myinstants.com/media/sounds/boing-boing-cat.mp3), [Tenor GIF](https://media.tenor.com/UpI_GWlKnF0AAAAi/nhon-nhon-cat.gif).
- Banana cat: [MP3](https://www.myinstants.com/media/sounds/cry-banana-cat.mp3), [Tenor GIF](https://media.tenor.com/UNaQFutfOF0AAAAi/banana-crying-cat.gif).
- Scuba cat: [MP3](https://www.myinstants.com/media/sounds/scubbaaa.mp3), [Tenor GIF](https://media.tenor.com/OoG1CF2T3QIAAAAi/kucing-scuba-scuba-cat.gif).

The wheel links the selected sound source and GIF provider. Availability and playback remain dependent on the remote hosts and browser policies; no licensing or permanent availability claim is made.

## Review scope

Implemented directly without agents. An in-session source review covered event IDs, echo suppression, keyboard/focus behavior, frozen-preview isolation, cleanup, reduced motion and preservation of existing components. Both standalone and the main application's neighborhood client received the same new components/helpers; existing large files were narrowly patched rather than synchronized wholesale.

The floating-wheel and consistency refinements were source-reviewed only. The mismatch was traced to rendering the authoring rig directly with a separate camera while the game prefers finished pixel sheets. Native metadata and the actual Phaser bridge/frame mapping were read to align the preview. Bubble control sizing, opaque hover fill, label/retry layout and cleanup were reviewed from source. No appearance export, browser launch, build, automated check or visual-review pass was performed. Warm surfaces, font roles and official control composition remain the incumbent design system; no DESIGN.md refresh was needed.

The cooldown follow-up was also source-reviewed only: both policy durations, input guards, persisted deadlines, reconnect/status messages, server lock placement, no-broadcast rejection and the fully opaque wheel state were inspected. No runtime, browser, concurrency or automated test result is claimed for this change.

The six-meme expansion retained the three original positions and populated the next six wedges clockwise. Occupied slots and navigation copy now derive from the catalog count; backward arrow navigation wraps by that count. The server allowlist contains the same nine IDs. All six newly supplied audio/GIF pairs returned partial media responses without saving files; the Huh/Happy Tenor pages were resolved to their own direct GIF links. No browser playback, application tests/checks or builds were run.

Public URL reads returned GIF content and partial audio/mpeg responses for all three clips without saving media files. These reads do not establish in-browser playback. Under the owner's standing instruction, no automated application tests/checks, builds, browser verification, detector run or screenshot review was performed. No visual-review pass is claimed. The design documentation comparison was performed in-session: existing palette, font roles and official control composition were preserved; no new design tokens or system rules were introduced.
