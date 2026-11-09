# PawTrail platform encounters

The integrated game at `/play` now imports up to twelve published adoptable shelter cats and dogs from the existing public PawTrail API. The standalone Vite world remains playable with fictional quest animals; its encounter directory explains that platform connections live in the integrated application.

## Player journey

Use **Meet animals** in the game header, or approach an imported pixel animal in the neighborhood or shelter and press **E / Space**. Imported actors have a PawTrail/Sample suffix and open platform details rather than fictional feeding/rescue controls. Their profile includes the platform photo, age, gender, size, status, shelter, approximate neighborhood, personality, published observations and home requirements. Loading skeletons, refresh/retry, unavailable-profile and empty-directory states are included.

Follow and Save use the existing authenticated platform services. Apply to adopt checks current availability and hands off to the existing private application form, including sign-in where needed. The application page retains its animal selection through authentication and rejects an already-adopted animal. Linked open missions and shelter profiles use their canonical platform pages; mission rewards remain subject to the platform's evidence/review flow.

Before leaving, the game pauses and saves the exact position. A tab-local **Return to neighborhood** link appears throughout platform pages, including authentication/application pages. It expires after 24 hours and can be dismissed. Returning reopens fresh details for that animal using `/play?animalId=…`. The link stores only the animal ID and timestamp, never application answers or arbitrary redirect URLs.

## Boundaries

- `src/game/platform.ts` defines the small public projection and bridge interface. `integration/platform-bridge.ts` adapts the existing validated browser API. No additional credential, donation, adoption or reward service was created.
- Public list membership is checked before detail/mutation access. This also excludes an owner's unpublished drafts, which the normal profile endpoint can serve to its owner.
- Only explicitly projected public fields reach game state. Coordinates, private notes, evidence, staff identities and application answers are excluded. Sensitive images are replaced by the photo placeholder.
- Encounters use the stable platform ID, namespaced as `platform:<id>`. Fictional Mango/Cloud quest IDs and existing version-2 local saves remain independent.
- World placements are themed walkable cells, unrelated to geographic coordinates. Pixel appearance is an approximation selected from the existing cat/dog sprite palette; the platform photograph remains the visual reference. Imported actors use idle animation, with full profile interaction.
- Directory refresh occurs on startup, return/window focus, and manual refresh. Details refresh whenever opened and before adoption. Unavailable/withdrawn/adopted animals leave the encounter set when refreshed. There is no websocket subscription; the API remains authoritative at submission.
- Up to six linked mission records are read per profile, with only open/unexpired results shown. Mission availability uses the platform's fixed demo clock for illustrative records and the system clock for real ones. Related-section failures do not hide the animal profile.
- Sample/demo provenance stays visible. Connecting an illustrative profile does not turn it into a real adoption record. Profile check time is labeled as a fetch time, not an invented modification date.
- Game feeding, petting, rescue, XP, trust and Kibble are local fiction. Imported encounters never emit real care evidence, complete platform missions or credit the real Kibble wallet. Following/saving creates the normal platform account records, including normal demo persistence in demo mode.

## Source integration

Run `npm run sync:app` from this workspace to copy the game feature and assets into the existing social-app worktree. The sync script also installs the platform adapter/client, the return-link component, and its root-layout mount. Shared shadcn components remain in the social application's canonical `src/components/ui`; the feature uses those components.

Implementation was synced into the existing app. No automated tests, type checks, builds, browser inspection or visual verification were run for this follow-up, in accordance with the owner's standing preference. Earlier RPG validation does not validate this new integration.
