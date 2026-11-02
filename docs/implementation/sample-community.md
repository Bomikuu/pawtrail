# Expanded sample community

The owner requested populated animals, personal sightings, adoptions, fundraisers, missions, Hordes, members, achievements and posts. The authored fresh sample pack includes:

| Area          | Sample content                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Animals       | 20 fictional animals, 15 adoption candidates, varied traits/statuses, supplied cover presets, illustrative licensed stock and connected care histories |
| Neighborhoods | Five generalized Davao areas, five Hordes and five fictional shelters                                                                                  |
| People        | 20 sample profiles with distinct supplied avatars, selected covers, bios and membership history                                                        |
| Social        | 105 human-authored tagged posts, 210 post comments, 20 resource comments, recorded reactions, follows, saved stories and saved animals                 |
| Sightings     | 100 published sightings across five days, five per sample member, with general locations and illustrative imagery                                      |
| Fundraising   | 25 campaigns covering all categories, 70 simulated contributions, itemized budgets, updates, expenses and per-member unpublished drafts                |
| Missions      | 30 linked missions, different approval totals per member, independent organizer reviews, accepted/submitted work and matching non-cash ledger entries  |
| Adoption      | 40 fictional private applications across draft/submitted/needs-information/approved/rejected/withdrawn states, private preferences and interests       |
| Events        | Five fictional gatherings with sample RSVPs and event discussion                                                                                       |
| Achievements  | Seeded check-ins, discoveries, shares, explicitly fictional reviewed care evidence, eligible one-time rewards, six-badge showcases and public mastery  |

Counts describe the authored fresh sample set. Existing sessions retain their own changes, so their counts can differ. The standard Sample member login selects Helper 6, who has a particularly complete care history. Shelter staff and moderator perspectives remain available on the login page. Member email addresses use `example.invalid`, contacts are explicitly fictional and all money support is simulated. No actual adoption, welfare outcome, donation, accreditation or review is asserted. The two existing licensed animal stock subjects are reused as illustrations; no additional photographs or assets were downloaded or generated.

## Session setup

`data/fixtures/scenarios.ts` owns common names, coarse areas and deterministic dates against the frozen demo clock. Source fixture modules own entity records and valid relationships. `sample-pack.ts` adds private workflows and social state, deriving unlock eligibility through the existing achievement engine. Reward entries reference deterministic claim IDs; existing claims, including revocations, are not replaced. Showcase choices already made by the user are preserved. New badges are chosen only from unlocked achievements. No user-created identity is given invented activity.

The optional workflow field `samplePackVersion` defaults to zero for existing version-seven documents. `snapshot` applies the versioned pack to a copied draft on first access. New fixture rows are merged in dependency order into older collection overlays; known original placeholder copy can be enriched, while edits and moderation state stay authoritative. Previously removed baseline rows are not restored. New references must resolve, including parent references inside campaign updates and expenses. Seeded relationships are attached to animal/Horde/shelter pages. Original IDs, usernames and public route slugs remain stable.

The next ordinary transaction persists the marker and expanded overlay atomically using the existing repository. Later reads/mutations skip setup, preventing deleted sample rows, withdrawn RSVPs, unlikes or reward claims from being recreated. Before that first write, deterministic IDs make read-time initialization repeatable. No session files were directly rewritten and no reset is required. Pure anonymous fixture projections use the same setup so public badges, crowns and counts agree with the demo dataset. Public APIs retain their existing identity, application, moderation and evidence projection rules.

## Delivery limits

Implemented directly without agents. Source read and formatting edits only: no automated tests, type/UI/format checks, builds, detector runs, browser inspections or manual application verification were performed, following the owner's current override. The existing preview process remains running. Runtime and rendered results are unverified.

Graphify's existing 164-node repository graph was used as a truncated locator (96 reachable, seven shown), followed by direct reading of fixture, repository, adoption, social and achievement relationships. Jev's synthetic strategy choice favored consistent source records and an additive versioned update (375 input / 31 output tokens); no private records or secrets were submitted. That judgment is guidance, not verification.
