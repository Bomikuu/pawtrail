# Neon Heights — authored NPC scripts

**Status:** approved narrative baseline. Phase 3 now implements M01–M03/I01 and
allocation callbacks on the connected adventure route; see
[Phase 3 delivery](phase-3-delivery.md). Other scenes remain authored designs for
later phases. Runtime verification was deferred by the owner. Exact effects and knowledge rules live in
[npc-state-spec.md](npc-state-spec.md); the story/content context is in
[floor-design.md](floor-design.md).

Scene shorthand `M01` means proposed ID `f01.scene.M01`; a choice such as
`M01.help` is its stable choice ID. Each quoted line is intended dialogue, not
an instruction to invent it later. `Topics` means the NPC's ordinary available
quest/service/history/leave choices after the scene. `Exit` closes cleanly and
restores input/focus. Effects occur only on accepted actions, never on showing
or replaying these lines. First introductions mark `met` without trust rewards.

## Shared scene rules

Every consequential decision shows its named confirm/cancel step, exact costs
and immediate service implication. Confirm submits the selected bundle once;
cancel returns to the same decision and changes nothing. The reply below plays
after acceptance. Missing items, stale state or failed saving show the relevant
failure line and keep the choice unresolved. Generic failure copy: **“That action
couldn't be saved. Nothing was spent. Try again or go back.”** If an accepted
receipt already exists, resume its response rather than claim nothing happened.

Portraits hold the selected angle, with natural blinking, speaking mouth shapes
and restrained breathing. Cues below specify emotion/gesture, not new poses or
voice production. Reduced motion preserves text and accepted state feedback.
Escape can dismiss a panel; it cannot undo an already-accepted decision.

## Mara Solis — the field medic

Mara speaks plainly, with warmth earned through practical help. Her attention
stays on people rather than dramatic speeches. Home: Lantern Landing, R01.

### M01 — First arrival

**Trigger:** first talk to Mara. **Cue:** attentive, sets down a repair roll.

**Mara:** “Watch the wet cable by the lift. The lights make this place look
healthier than it is. I'm Mara. If you're staying, we could use another pair
of hands.”

| Choice | Response / next | Accepted effect |
| --- | --- | --- |
| `M01.help` “Where should I start?” | **Mara:** “Mark this landing as your return point, then read the market route on the board. Know how to get back before you go looking for trouble.” → M02 | Accept Q01 if available; no trust |
| `M01.rest` “Can I rest here?” | **Mara:** “Of course. A safe place isn't something you should have to earn.” → rest service, then Topics | Restore actual missing HP if eligible; no quest/score reward |
| `M01.leave` “I'll look around first.” | **Mara:** “Stay inside the lit rail. Come back when you've found your bearings.” → Exit | None |

### M02 — Bearings and the first job

**Trigger:** Q01 topic. If checkpoint or route inspection is missing:
**Mara, practical:** “The landing beacon and the board beside it. Those first.”
Offer **“Show me the board”** (pin R01 board, no teleport) or **“I'll return”** (Exit).

When both facts and the meeting are recorded:
**Mara:** “Good. You have a way home. Ivo has an emergency cell at the market.
Our auxiliary line can support the clinic or the tram controls, but not both.”

`M02.report` **“I've marked the route.”** claims Q01 once, SC 15, then offers
`M02.job` **“I'll speak to Ivo.”** to accept Q02. Her reply: **“Ask for the
district cell. He knows it's not stock for sale.”** → Topics. Leaving after
Q01 claim preserves the ability to accept Q02 later; no duplicate SC 15.

### M03 — The allocation comes home

**Trigger:** player reports Q02 after P01's accepted allocation. This is a
turn-in, distinct from the public callback. **Cue:** clinic = relieved;
transit = tired but composed.

| Known allocation | Mara's actual reply |
| --- | --- |
| Clinic | “The monitors stopped cutting out. I don't know who'll be in that bed tonight, but you've given them a better chance.” |
| Transit | “The tram controls are running. That matters too. I'll keep the clinic on reserve a while longer. Don't mistake a hard choice for an easy one.” |

`M03.report` **“The auxiliary line is stable.”** claims Q02 once, SC 35;
allocation trust was already applied by P01 and is not applied here. Then:
**Mara:** “EKO is looking for someone who can reach the old route archive.
You'll find the projection in the plaza.” → Topics.

**Later callback M03.revisit**, once if not yet seen, has no effects:
Clinic: **“Still hearing a steady monitor from the clinic. That's your work.”**
Transit: **“A courier brought medicine on the restored tram. We're making it stretch.”**

### M04 — Rainproof Neighbors

**Trigger:** Q02 claimed; side quest topic. **Cue:** matter-of-fact.

**Mara:** “Rain gets through the repair-bay awning. I can patch it with three
rolls of weatherweave and two pieces of scrap. It isn't glamorous. It keeps
the supplies dry.”

`M04.accept` **“I'll repair the awning.”** accepts Q07 and pins R04; no items
consumed during dialogue. `M04.sources` **“Where can I find those?”** →
**“Check the bay's old toolkit for cloth. The maintenance bins and machines
carry scrap. The station will show what you still need.”** → Topics.
`M04.leave` **“Not now.”** → Exit, no penalty.

After the actual station has consumed Fiber 3 + Scrap 2 and confirmed repair:
`M04.report` **“The awning is patched.”** applies `F01.AWN`.
**Mara, pleased:** “Dry shelves, dry dressings. Small things add up.” → Topics.
Before that event: **“Bring the materials to the bay station. Saying it's
done won't keep the rain out.”** No consumption or claim on failure.

### M05 — A courier's keepsake

**Trigger:** Q09 carrying and player selects delivery topic.

**Player:** “Nyx asked me to bring you this.”
**Mara, gentle:** “Her brother's old signal charm. We keep the family tokens
here until people have a safer place for them.”

`M05.deliver` **“Leave the keepsake with Mara.”** previews the unique item
handover, then confirms `F01.PROMISE.R`. **Mara:** “I'll register the delivery.
Nyx will know it reached us. Thank you for doing what you said.” → Topics.
`M05.keep` **“I'll hold onto it for now.”** → **“Then keep it safe.”** → Exit;
promise remains carrying. Missing item: **“It's not in your pack. I can't
record a delivery until it's actually here.”** No reward or fabricated receipt.

Later, if delivered: **Mara:** “The charm is safe. Nyx's reply came through.”
Mara has no sold-Keepsake accusation unless its fact is deliberately disclosed
in future content; it isn't part of her current knowledge.

### M06 — The city's decision

**Trigger:** unseen public governance callback, or explicit ending-history topic.

| Governance | Mara's line |
| --- | --- |
| Community | “The clinic's on a shared schedule now. It will mean meetings and arguments. At least the people losing sleep get a say.” |
| Warden | “Sena sent the new supply rules. I'll hold her to the part about emergency access. People can't wait for a form to be approved.” |
| Exchange | “The lights are steady. The bills will be too. I hope the safeguards you agreed to mean something when business gets difficult.” |

For Community only, `M06.supply` **“Collect this expedition's clinic supply.”**
grants one Med Patch under the expedition perk receipt. **“One spare patch.
Come back in one piece.”** Already claimed: **“That's the spare already
issued for this expedition. Rest here whenever you need to.”** No second item.

### M07 — Public invoice and ordinary visits

Unseen published-invoice callback: **“I saw the district notice. Some families
have been paying twice for the same repairs. They'll have questions for Ivo.”**
No line about privately protecting Ivo; Mara doesn't know that choice.

Repeat greeting priority: pending M05 delivery/return callback → M03 allocation
→ known published invoice → M06 governance → personal tier.

| Personal tier | Repeat line; then Topics |
| --- | --- |
| Distrustful/wary | “I'm busy. If you need treatment, sit down. We can disagree without leaving someone hurt.” |
| Neutral | “How are you holding up? The landing's clear if you need a moment.” |
| Friendly/trusted | “Good to see you back. Tell me what the city looks like beyond these rails.” |

## Ivo Mercado — salvage merchant

Ivo is quick, observant and protective of his trade. He is not a caricature of
an evil merchant. Home: Merchant Lane, R03. His price panel uses actual state.

### I01 — The spare cell

**Trigger:** first conversation or Q02 supply topic. **Cue:** measuring look,
open-handed toward a tagged crate.

**Ivo:** “If Mara sent you, the district cell is under the counter. The tag
says emergency supply. Some things still aren't for sale.”

`I01.cell` **“I'm here for the emergency cell.”** validates Q02 active and
applies `F01.CELL`. **“There. Route it at the allocation board, and read the
load before you flip anything.”** → Topics. If already issued: **“Same cell,
same receipt. Check your quest pack or its recovery entry; I won't issue two.”**

`I01.shop` **“Show me your stock.”** → live shop with computed prices and stock;
no purchase yet. `I01.about` **“What happened to the grid?”** →
**“Old systems doing exactly what an old order told them to do. People kept
building around them. Now we get to untangle it.”** → Topics.
`I01.leave` **“I'll return.”** → **“I'll be here.”** → Exit.

### I02 — An Honest Invoice

**Trigger:** Q03 claimed, Invoice Record found, invoice choice unset. Asking
about it starts Q08 if available. **Cue:** guarded, hands still.

**Player:** “The archive has two bills for the same repair.”
**Ivo:** “One is the old district rate. One is what the Exchange charged to
keep freight moving. I signed both. If you publish them, people will see the
total before they hear why.”

| Choice and confirmation | Accepted response / next | Bundle |
| --- | --- | --- |
| `I02.protect` “Keep the invoice private.” Confirm that this closes the public-release branch | **Ivo:** “You kept my records private. I'll put my name behind your work with the Exchange. It doesn't make the bill disappear.” → Topics | `F01.INVOICE.P` |
| `I02.publish` “People should be able to read what they paid.” Confirm public district release | **Ivo:** “Then publish the whole document. Not just the number that makes the best story. I'll answer for my signature.” → Topics | `F01.INVOICE.B` |
| `I02.wait` “I need to think.” | **Ivo:** “Keep the copy intact while you do.” → Exit | None |

Private protection gives a limited Exchange endorsement; it isn't a broadcast
of the hidden invoice. Publication is a real public story event. The same
SC 40 quest reward applies once in either branch; price changes follow actual
trust thresholds, not the word “protected” alone.

### I03 — Selling the promise

**Trigger:** carrying Keepsake; player explicitly selects special story-item sale.
Never include the Keepsake in quick-sell.

**Ivo, serious:** “That charm has a courier registration. I can buy the metal,
but the registry logs the transfer. Nyx will be notified. Are you sure it is
yours to sell?”

`I03.sell` **“Sell the keepsake for SC 40; notify its registered courier.”**
requires a separate confirmation showing the broken-promise consequence;
then `F01.PROMISE.S`. **Ivo:** “The sale is recorded. So is the item's origin.
Don't tell her it vanished.” → Topics.
`I03.cancel` **“No. I agreed to deliver it.”** → **“Then keep your agreement.”**
→ Topics; nothing spent, no bonus trust for canceling.

### I04 — A replacement isn't the original

**Trigger:** promise sold, no replacement acquired. **Cue:** businesslike.

**Ivo:** “I can build a replacement housing. Forty scrip, or three lengths
of wire. It won't be the same charm, and I won't register it as the original.”

| Choice | Response and actual outcome |
| --- | --- |
| `I04.scrip` “Pay SC 40.” | Confirm fixed payment; `F01.REPLACEMENT` with SC; **“One replacement. Tell her what it is.”** → Topics |
| `I04.wire` “Use Copper Wire 3.” | Confirm material payment; same guarded bundle with Wire; same line → Topics |
| `I04.source` “Where can I find wire?” | **“The Relay Hall cabinets. You can start another expedition if this one's supplies are gone.”** → Topics; no grant |
| `I04.leave` “Not yet.” | **“Bring it when you're ready.”** → Exit |

Insufficient payment: **“That isn't enough for the housing. Nothing's been
taken.”** No new item. Already acquired: **“It's in your pack or recovery
storage. I have one receipt for it, not a second commission.”** No duplicate.

### I05 — Ivo remembers

**Trigger:** accepted invoice reply not yet acknowledged on a later visit.

Protected: **“Still keeping the document private? Good. My recommendation
wasn't a promise that we'd agree on everything.”**
Published: **“Your notice is still up. I've answered more questions this week
than in a year of trading. You can buy what you need; I don't have to like you.”**
No additional effects. Then Topics and the current price panel.

Public governance callback:
Community: **“The new committee wants open repair accounts. I suppose you've
given them practice asking for those.”**
Warden: **“One schedule, one inspector, three copies of every order. We'll adapt.”**
Exchange: **“The concession is signed. You'll see its discount on basic goods.
Now we'll have to prove the service is worth the contract.”**

Fallback: distrustful **“Prices are on the board. Ask before touching anything.”**;
wary/neutral **“Looking for parts, or looking for answers?”**;
friendly/trusted **“I've held a few useful pieces aside. Take a look.”**
The last line does not secretly add stock or reward. Priority: delivery reply
→ invoice callback → governance → first meeting → personal fallback.

## EKO-9 — the civic archive

EKO is precise and curious, with pauses for processing rather than exaggerated
robot jokes. The projection moves gently over its fixed emitter. Home: R02.

### E01 — A face made of routes

**Trigger:** first conversation. **Cue:** attentive projection, small head turn.

**EKO:** “Welcome to the plaza. My public map is twelve years out of date.
The koi have been circling the same maintenance warning for most of that time.”

`E01.why` **“Why keep the warning running?”** → **“Because someone may still
notice it. You did.”** → Topics. `E01.help` **“Can I help?”** → E02 when Q02
claimed; otherwise **“Stabilize the auxiliary feed with Mara first. I need a
safe route to the Rainline archive.”** → Topics. `E01.leave` → Exit.

### E02 — Ghosts in the Glass

**Trigger:** Q02 claimed and Q03 available/active.

**EKO:** “A route fragment survived in the Rainline locker. It contains the
non-private transit header Sena needs, and private paths people trusted me
to keep. Bring it back before deciding what should remain.”

`E02.accept` **“I'll recover the fragment.”** accepts Q03 and pins R09.
**“Observe the projection sequence. The locker records shapes, not colors.
You can replay it as often as you need.”** → Topics.
`E02.later` **“Not now.”** → **“The record will wait.”** → Exit.

### E03 — What deserves to be remembered

**Trigger:** P03 complete, Fragment present, Q03 active, policy unset.
**Cue:** quieter scan motion, thoughtful expression; private conversation.

**EKO:** “The header is intact. The private routes show where people went
when they were afraid. I can preserve a redacted civic copy, or erase those
paths and keep only the header. Neither choice will lock the switchyard.”

| Choice / confirmation | Accepted response | Bundle |
| --- | --- | --- |
| `E03.redact` “Keep a redacted archive; remove identifying details.” Confirm retained civic copy | **EKO:** “Then I will keep what helps without keeping what exposes them. A smaller archive can still be an honest one.” | `F01.ARCH.R` |
| `E03.erase` “Erase the private routes; keep the gate header.” Confirm irreversible private-data erasure | **EKO:** “Understood. I will remember that we chose to forget those paths. That distinction matters.” | `F01.ARCH.E` |
| `E03.wait` “Let me think before you change it.” | **EKO:** “The fragment stays sealed.” → Exit | None |

Accepted branches consume the quest Fragment, retain the signed header, claim
Q03/SC 45 and return to Topics. Sena is not told this private choice. If the
Fragment is absent, **“I need the recovered fragment, not a description of it.
Check the quest pack or its recovery record.”** No policy or reward changes.

### E04 — The next time

**Trigger:** later visit, relevant archive memory known and callback unseen.

Redacted: **“The new public record contains no names. Someone used it to
find the clinic this morning. That is enough detail.”**
Erased: **“There is an empty field where the private paths used to be.
I have stopped trying to reconstruct it.”**

`E04.regret` **“Would you choose differently?”** → redacted **“Perhaps with
different consent. Not with different curiosity.”** / erased **“I can miss
information without believing I was entitled to it.”** → Topics. No trust
rewards for repeating the topic.

### E05 — Two Koi, One Signal

**Trigger:** Q03 claimed, Q10 available/active.

**EKO, lightly amused:** “The two koi disagree about which way the signal
travels. Follow their four directions and I can synchronize the emitter.”

`E05.start` **“Let's calibrate it.”** accepts Q10 and opens P04 when eligible;
`E05.assist` **“Let me follow one direction at a time.”** opens the same
puzzle in assisted mode, equal reward. `E05.leave` → **“They are patient fish.”**
→ Exit. No success or trust before accepted puzzle completion.

Once P04's real success is recorded, `E05.report` **“The signals match.”**
applies `F01.KOI`. **EKO:** “Agreed. A clean loop. I've unlocked the small
projector plan at the repair bay.”** → Topics. Repeat topic: **“Still
synchronized. No need to recalibrate for another reward.”**

### E06 — Who Owns the Dawn

**Trigger:** Q05 claimed, Clearance Core present, governance unset; at the R02
controller. **Cue:** steady projection, clear three-choice presentation.

**EKO:** “The Bastion's authority key is accepted. We can place the restored
grid under a neighborhood council, a Warden charter, or an Exchange concession.
The lights will work in all three cases. Who answers when they don't?”

| Choice / confirmation preview | Accepted response | Bundle |
| --- | --- | --- |
| `E06.community` “Community council: residents share control.” Show Community supply perk and accountability through meetings | **EKO:** “Recorded. The grid will answer to the people who live beside it. Their first task is agreeing how to listen to each other.” | `F01.GOV.C` |
| `E06.warden` “Warden charter: regulated public service.” Show Warden supply perk and formal operating rules | **EKO:** “Recorded. Sena's charter carries the authority now. A clear rule is useful; a rule that can never be challenged is not.” | `F01.GOV.W` |
| `E06.exchange` “Exchange concession: contracted operation.” Show basic-shop discount and commercial obligations | **EKO:** “Recorded. The contract and its safeguards are public. Let us make sure people can read both.” | `F01.GOV.X` |
| `E06.wait` “I haven't decided.” | **EKO:** “The core stays with you. The return route is open.” → Exit | None |

Only accepted governance consumes Core and completes Q06/SC 80/floor clear.
Every branch returns to Topics; no second vote/extra reward through repeat text.

### E07 — Archive after the ending

Community: **“The first council meeting ran late. Three amendments, one
repaired line. I have archived both the argument and the work.”**
Warden: **“The inspection log is public. That is a better use of records
than a list of people who once crossed a bridge.”**
Exchange: **“The concession's first report is filed. We will keep the report
beside the contract, not behind it.”**

Repeat fallback, wary/distrustful: **“I can provide the public record. Private
questions will need a reason.”** Neutral: **“Which part of the city are you
trying to understand?”** Friendly/trusted: **“I've kept your place in the
record. What have you found?”** → Topics, no memory fabrication or reward.
Priority: accepted response → unseen archive callback → governance → introduction
→ personal fallback. Koi turn-in is available as a selected validated topic.

## Nyx Tal — the courier

Nyx is dry, direct and careful with promises. She never flirts as a default
personality. Home: the safe courier alcove off Rainline Walk, R08.

### N01 — Meeting above the streets

**Trigger:** first meeting; use the known public allocation variant if set.
**Cue:** checks a clipped route note, then faces the player.

Clinic: **“You're the one on the power notice. Clinic got the auxiliary line.
My tram's still waiting, but I've delivered to that ward. I understand the choice.”**
Transit: **“The tram controls are alive again. Your name was on the power notice.
That line saved us a very long walk.”**
Unset/fallback: **“The bridge is clear to this alcove. Beyond it, watch the
machine markers. I'm Nyx. I carry things people can't send through the grid.”**

Append to the allocation variants: **“I'm Nyx. Courier, when the city lets me.”**
`N01.work` **“Do you need something delivered?”** → N02.
`N01.route` **“Where is the archive locker?”** → **“Past the second marked
service alcove. Read the maintenance plaque beside it. The code isn't a secret.”**
→ Topics. `N01.leave` → Exit. No trust just for greeting or asking directions.

### N02 — A small promise

**Trigger:** promise unseen/declined; no previous carried item or completed/sold
resolution. If declined earlier, prepend **“You said no before. If that's
changed, say it clearly. I'd rather wait than guess.”**

**Nyx:** “This charm belonged to my brother. Mara has a place for it at the
landing. It won't open a gate or win a fight. Will you take it to her?”

| Choice | Response / next | Effect |
| --- | --- | --- |
| `N02.accept` “Yes. I'll give it to Mara.” | **Nyx:** “One promise, then. Not to keep it safe forever. Just to get it there.” → Topics | `F01.PROMISE.A` |
| `N02.decline` “I can't promise that.” | **Nyx:** “Fair answer. Keep your hands free for what you can do.” → Topics | `F01.PROMISE.D` only on first decline; no reputation |
| `N02.ask` “Why not send it yourself?” | **Nyx:** “The dispatch route keeps me here until the yard's open. A job doesn't stop being a job because it matters to you.” → same offer | None |

Explicit later acceptance remains possible after decline; it doesn't erase that
the player initially declined or create a second item. Repeat while carrying:
**“Mara at Lantern Landing. She'll log the handover.”** → Topics.

### N03 — A delivered promise

**Trigger:** returned status and courier delivery knowledge; callback unseen.
**Cue:** relieved, small nod.

**Nyx:** “Mara's receipt came through. The charm's where it should be.
Thank you for carrying something that had no use to you.”
`N03.answer` **“I said I'd get it there.”** → **“You did. I'll remember that
the next time a route needs someone reliable.”** → Topics. No second trust/SC;
those were applied on real delivery. Repeat history: **“The charm's safe.
We don't need to keep proving the same promise.”**

### N04 — A registered sale

**Trigger:** sold status, registry notice known; outranks generic good reputation.
**Cue:** still and guarded, without a melodramatic attack animation.

**Nyx:** “The registry sent me a sale receipt. Ivo's stall. Forty scrip.
You could have said no when I asked.”

| Choice | Actual response / next |
| --- | --- |
| `N04.repair` “I broke the promise. Can I make any part of it right?” | **“Ivo can make a replacement housing. Bring it here and tell me what it is. Don't call it the original.”** → Topics; enables recovery topic, no score change |
| `N04.defend` “I needed the money.” | **“Then say that. Don't turn it into a favor you did for me.”** → Topics; no extra repeated penalty |
| `N04.route` “Will you still point me to the locker?” | **“Read the public maintenance plaque. I'm not putting my name behind your deliveries.”** → Topics; public route remains accessible |
| `N04.leave` “I'll go.” | **“All right.”** → Exit |

The sale penalty is applied once by the accepted registered transaction, not
every time Nyx speaks this line. A high unrelated faction score doesn't replace it.

### N05 — What a replacement can do

**Trigger:** sold status and replacement present; player selects reconciliation.
**Cue:** studies the replacement rather than immediately smiling.

**Player:** “This isn't your brother's charm. Ivo made a replacement.
I brought it because I owed you more than an excuse.”
**Nyx:** “Leave it with me. It won't fix what you sold. It tells me you came back.”

`N05.give` **“Hand over the replacement.”** confirms `F01.PROMISE.F`.
**Nyx:** “We can work together. Slowly. And I will remember both things.”**
→ Topics. `N05.wait` **“Not yet.”** → **“Then keep it until you're ready
to part with it.”** → Exit. Missing item: **“Bring the housing itself.
I'm done accepting a promise in place of a delivery.”** No state change.

Later reconciled callback N05.later: **“The replacement's holding. So is the
agreement. Let's leave it at that for now.”** Personal hint restored, sold history
retained, original return reward still unavailable.

### N06 — Roads after the decision

Community: **“The council asked how couriers use the night routes. First
time anyone asked before drawing the map.”**
Warden: **“New route permits are clear enough. We'll see if they stay clear
when the first exception comes in.”**
Exchange: **“Contracts keep parcels moving. I'm keeping a copy of the clause
that says a courier can refuse an unsafe run.”**

Repeat priority: sold/reconciled/returned callback → first/public-allocation
introduction → governance → carrying reminder → personal fallback.
Fallback distrustful/wary: **“Need a public route, or another favor?”**;
neutral: **“Where are you headed?”**; friendly/trusted: **“Good timing.
I can tell you which walkways are clear.”** → Topics. The tip uses actual
discovered route data, not a guaranteed loot grant.

## Sena Valez — the grid warden

Sena values evidence and working rules. She can disagree without blocking
essential help. Home: the safe Freight Dispatch cabin, R10.

### S01 — Gate authority

**Trigger:** first meeting or boss-gate topic. **Cue:** composed, indicates two
empty authorization slots.

**Sena:** “The Bastion still obeys the yard's perimeter order. I need a Relay
Seal from the Undergrid and a Transit Writ from the Marshal. Not a recommendation.
Not a good reputation. The actual authorizations.”

`S01.accept` **“I'll open the line.”** accepts Q04 when Q03 claimed;
**“The Relay Hall board can restore the seal. The Marshal holds the writ.
Come back here before you enter the core.”** → Topics.
Before Q03 closure: **“EKO's signed header is missing. Resolve the archive
recovery first; I don't need to know what you do with the private records.”**
No knowledge leak or premature quest state.
`S01.leave` **“I'll return with the records.”** → Exit.

### S02 — Two records, one open gate

**Trigger:** Q04 active, both keys present, P02 solved and Q03 claimed.

**Sena:** “Seal verified. Writ verified. The cross-route and core gate are
ready to unlock.”
`S02.authorize` **“Submit both authorizations.”** confirms `F01.GATE`.
**Sena:** “The gate is open. Break all four of Kurogane's funnels before
striking the main body. The Marshal's armor worked differently; don't confuse them.”**
Then `S02.boss` **“I'll face the Bastion.”** accepts Q05 if available → Topics.

Missing seal: **“I don't have the Relay Seal. The board in Relay Hall needs
to record a successful route.”** Missing writ: **“The Marshal's defeat record
hasn't issued a writ. Check its accepted receipt, not an arena rehearsal.”**
No partial key consumption or currency/trust on failure. Repeat after auth:
**“Your authorization is recorded. I won't charge you another pair of seals.”**

### S03 — A real victory

**Trigger:** first accepted floor-boss defeat receipt, Q05 active, not reported.
**Cue:** shoulders ease; concise acknowledgement.

**Sena:** “All four funnels offline. Core directive terminated. It's the
first clean report the yard has produced in years.”
`S03.report` **“The Bastion is down.”** applies `F01.BOSS.REPORT`.
**Sena:** “Take its authority core to EKO's plaza controller. Decide who
operates the restored grid. I can make a case, not make your choice.”** → Topics.
No extra SC/materials beyond the boss loot receipt. Without a confirmed receipt:
**“I need the yard's actual clear record. A training reset isn't one.”**

### S04 — The charter you chose

**Trigger:** unseen governance callback, or ending-history topic.

Community: **“The council has the authority key. I'll share the safety maps.
I'd rather they know the risks than learn them through an outage.”**
Warden: **“The charter's signed. We have authority now, which means we also
have responsibility. Ask to see the logs if we forget that.”**
Exchange: **“The concession is legal. It doesn't exempt them from inspection.
I intend to be very clear about that.”**

Warden perk topic `S04.supply` **“Collect this expedition's insulation supply.”**
grants one Insulator under its expedition receipt. **“One insulating sleeve.
It protects against the utility faults, not the Bastion's weapons.”**
Already claimed: **“Issued for this expedition. I can still mark the safe return.”**

### S05 — Maintenance Run

**Trigger:** Q06 claimed; once-per-expedition contract available.

**Sena:** “We can use two pieces of scrap and one coolant pack for routine
repairs. Twelve scrip for the delivery. The contract won't change your standing;
we need supplies, not a ceremony.”

`S05.accept` **“I'll bring the supplies.”** accepts Q11 if available;
`S05.deliver` **“Deliver Scrap 2 and Coolant 1 for SC 12.”** shows exact
inventory and confirms the expedition-scoped contract transition. On acceptance:
**“Recorded. That's this expedition's delivery.”** → Topics.
Insufficient supplies: **“The pack is short. Bring the rest; nothing has been taken.”**
Already claimed: **“We've logged this run's shipment. Next expedition, if
you have spare parts.”** No trust or repeated currency from conversation.

### S06 — Ordinary business

Priority: pending authorization/victory response → unseen gate/victory memory
→ governance → introduction → personal fallback; turn-ins remain explicit topics.
Distrustful/wary: **“We can keep this professional. What do you need?”**
Neutral: **“Any trouble on the service route?”** Friendly/trusted:
**“You're back. Good. I'd like your account before I finalize the patrol notes.”**
→ Topics. Discussing a route alone does not count as a kill, quest completion
or reputation event.

## Script acceptance and remaining work

All five characters have introductions, actionable quest/service scenes,
decision-sensitive responses, later callbacks and fallback/exit behavior.
Knowledge and one-time effects are specified, including the private/public
distinction and Nyx's sale/repair history. More incidental barks may be authored
later without creating new mechanics or state. The dialogue-engine adapters,
save handling, character art, performance assets and actual runtime review remain
implementation work; no script in this file has been executed or playtested.
