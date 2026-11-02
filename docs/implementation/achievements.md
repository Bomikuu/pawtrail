# Achievement badges and mastery

The owner supplied three 15-badge sheets and explicitly approved a one-time 10–500 non-cash Kibble scale, separate from mission rewards. The collection lives at `/dashboard/achievements`; moderator evidence review lives at `/dashboard/achievements/review`.

## Member flow

Each of the 45 badges shows its artwork, actual progress, one-time reward and earning instructions. Completed requirements enable **Unlock**. This single transaction records the badge and appends its reward to the existing Kibble ledger. Repeated calls do not award it again. Members select up to six unlocked badges for their public profile and independently opt in to sharing overall mastery. Existing discoverability/contribution privacy settings remain required; private evidence, applicant answers and activity references are never published.

Mastery tiers are New PawPal (0), Kind Neighbor (5), Dedicated Helper (15), Community Champion (30) and PawTrail Legend (45). The collection shows progress toward the next tier. Green Paw, True PawPal and Paw Legacy display their separate criteria rather than inventing one vague percentage.

## Recorded and reviewed progress

- Published sightings/posts/photos, approved missions, current event RSVPs, recorded contributions, applications and membership dates come from server records.
- **Mark discovered** records distinct published animal profiles. **Share** records a successful share-sheet/copy action for distinct animal/mission/fundraiser pages. These are digital activity counters, not proof of physical visits or audience reach.
- Daily check-in records one server-side Manila calendar date. Demo time remains frozen at 2026-11-02; future dates and duplicate check-ins cannot be submitted to manufacture a streak.
- Care, rescue, feeding, water, TNR, confirmed adoptions, fostering, long-term support, supplies, education, awareness, referrals, physical visits and event attendance require independent moderator review. Uploaded proof stays private. An application approval does not establish an adoption; an RSVP does not establish attendance.
- Evidence uses unique activity/reference keys. Care visits count once per animal per day. A joined friend can be credited to one inviter only. Review is versioned, self-review is forbidden, rejected proof can be revised, and prior approvals can be reversed with a reason.
- Source changes reconcile achievement rewards in the same serialized repository transaction. Invalidated achievements receive negative correction entries, never history deletion. Requalifying after a correction can restore the original reward, with one net reward per active badge. Rank and wallet-balance badges intentionally record historical milestones; ordinary later rank/balance changes do not erase them.

The local demo still simulates donations and all real-world claims. The adapter declares matching real-backend endpoints but no live Django conformance is established. Choice lists load an initial bounded set of public records; an explicit record-ID field supports records outside that initial list.

## Source boundaries

`features/achievements/catalog.ts` owns the fixed version-one rules and rewards. `engine.ts` derives progress and reconciles ledger corrections; `service.ts` checks ownership, independent review, deduplication and atomic claims. The existing typed client/BFF exposes overview, claim, showcase, activity, private proof submission/listing and moderator review. Optional workflow storage preserves version-7 demo sessions. Public profiles expose only consented showcased badge IDs/labels and, if opted in, an aggregate mastery summary.

All 45 owner-supplied badge crops are 192 × 192 WebP images at quality 80, approximately 227 KB combined; original sheets and their baked-in text are not shipped. Images load lazily and reserve dimensions. The source attachments are `codex-clipboard-12e0da33-4fd3-42f2-a0bf-12f00f1028fd.png`, `codex-clipboard-07e0aca1-62c7-4356-b79f-bb65420ff3c0.png` and `codex-clipboard-9a4ed124-3390-45ac-a207-4f5ba1da42f4.png`. No external license or exclusive ownership is asserted.

## Verification status

Implemented directly in the main session. No agents, automated tests, type/UI/detector checks, production builds, browser inspections or live external-service checks were run under the user's standing instruction. Source formatting was applied; it is not a runtime verification result.

## Version-one reward schedule

| Badge                 | One-time Kibble | Requirement                                                                                                                                                                             |
| --------------------- | --------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Sighting        |              20 | Publish your first animal sighting after moderation review.                                                                                                                             |
| First Help            |              30 | Complete a mission and have its evidence independently approved.                                                                                                                        |
| Top PawPal            |             100 | Reach the top three of the all-time public Kibble leaderboard with at least one approved mission and a positive balance.                                                                |
| Fundraiser Supporter  |              15 | Support one published fundraiser. Demo contributions are simulated and transfer no money.                                                                                               |
| Shelter Supporter     |              30 | Complete an approved shelter mission or contribute to a shelter-linked campaign.                                                                                                        |
| Care Companion        |              80 | Submit reviewed care visits for the same animal on five distinct Manila calendar days.                                                                                                  |
| Explorer              |              40 | Open animal profiles and mark ten different published animals as discovered. Digital discovery is not a physical visit.                                                                 |
| Adoption Advocate     |             100 | Have a moderator independently confirm a completed real-world adoption. An approved application alone does not count.                                                                   |
| Community Storyteller |              40 | Share five posts that pass publication review. Drafts, pending and removed posts do not count.                                                                                          |
| Animal Guardian       |              40 | Complete an approved mission linked to an animal, or earn a reviewed Rescue Ally contribution.                                                                                          |
| Horde Helper          |              30 | Complete an approved Horde-linked mission or support a published Horde-linked campaign.                                                                                                 |
| Event Participant     |              10 | RSVP to one non-cancelled welfare event. Attendance is a separate reviewed achievement.                                                                                                 |
| Mission Complete      |             150 | Complete ten different missions with independently approved evidence.                                                                                                                   |
| Green Paw             |             100 | Complete at least ten approved missions that collectively help three different animals.                                                                                                 |
| True PawPal           |             300 | Reach all three goals: 20 approved missions, ten published posts and five approved sightings.                                                                                           |
| Daily PawPal          |              50 | Use the daily check-in on seven consecutive Manila calendar days. The server records today once; visits alone do not add check-ins.                                                     |
| Keen Spotter          |              50 | Publish five sightings that pass moderation review.                                                                                                                                     |
| Rescue Ally           |              60 | Submit evidence of practical rescue or medical assistance for independent review. This is not a clinical credential.                                                                    |
| Feeding Hero          |              80 | Submit ten feeding check-ins with reviewed evidence. Each animal can count once per Manila calendar day.                                                                                |
| Hydration Helper      |              80 | Submit ten water-care check-ins with reviewed evidence. Each animal can count once per Manila calendar day.                                                                             |
| Paw Photographer      |              60 | Share ten distinct photo assets in posts that pass publication review. Reusing the same asset does not add progress.                                                                    |
| Area Guardian         |              70 | Contribute approved sightings or approved missions for five distinct animals in the same public area.                                                                                   |
| TNR Supporter         |              70 | Submit evidence of support for a Trap-Neuter-Return effort for independent review.                                                                                                      |
| Adoption Champion     |             100 | Have a moderator confirm that your practical assistance helped complete an adoption. Applications and interest alone do not count.                                                      |
| Generous Donor        |              50 | Support three different published fundraisers. Multiple contributions to one campaign count once; demo contributions remain simulated.                                                  |
| Paw Sustainer         |              80 | Submit evidence of recurring or sustained support for a campaign for independent review.                                                                                                |
| Community Builder     |              60 | Have three joined friends independently confirmed as your referrals. Each public account can be credited to one inviter only.                                                           |
| Advocate              |              30 | Use the share action for five different animal, mission or fundraiser pages. A successful share-sheet action or copied link counts once per page; this does not measure audience reach. |
| Mission Streak        |              80 | Have three reviewed mission participations approved in a row, ordered by when you joined. Pending work is not counted.                                                                  |
| Paw Legacy            |             500 | Be a member for at least 30 days and unlock 20 other badges.                                                                                                                            |
| Event Goer            |              40 | After an event ends, submit attendance evidence for independent review. An RSVP alone does not count.                                                                                   |
| Mission Leader        |              80 | Complete five different missions with independently approved evidence.                                                                                                                  |
| Horde Friend          |              60 | Complete three approved Horde-linked missions. Distinct mission participations count once.                                                                                              |
| Medical Supporter     |              30 | Contribute to a published fundraiser categorized as medical. Demo support is simulated and does not demonstrate treatment.                                                              |
| Recovery Partner      |              70 | Submit reviewed recovery-support visits for one animal on three distinct Manila calendar days.                                                                                          |
| Sighting Streak       |              70 | Publish reviewed sightings observed on five consecutive Manila calendar days. Multiple observations on one date count once.                                                             |
| Adoption Supporter    |              20 | Submit a complete adoption application for human review. Private answers are never exposed; application approval does not confirm adoption.                                             |
| Foster Pal            |              70 | Submit evidence of fostering an animal or practical support for a foster placement for independent review.                                                                              |
| Supply Donor          |              40 | Submit evidence of providing food, supplies or essentials to a shelter for independent review.                                                                                          |
| Volunteer             |              15 | Accept a volunteer mission. Joining is different from completion; organizers cannot earn from their own missions.                                                                       |
| Educator              |              40 | Publish a helpful animal-care post, then submit it for an independent educational-content review.                                                                                       |
| Kindness Explorer     |              50 | Submit reviewed physical visit check-ins for three different animals using their approximate public areas. Digital discoveries alone do not count.                                      |
| Awareness Champion    |              40 | Publish a welfare-awareness post, then submit it for independent review. Examples include adoption, spay/neuter or TNR awareness.                                                       |
| Kibble Saver          |             100 | Reach a 500-Kibble non-cash wallet balance before claiming this badge. It records a balance milestone, not savings of real money.                                                       |
| PawTrail Supporter    |              50 | Remain a PawTrail member for 30 days, measured from the account creation date using the server clock.                                                                                   |
