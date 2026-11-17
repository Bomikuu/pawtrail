# Monster identity, combat profile and health

Keep a small versioned profile associated with the monster's stable ID. Use the
project's existing typed data where compatible; do not add a second conflicting
stat source. The profile is reusable in the bestiary, editor and actual encounter.

## Authored identity

- Stable ID, display name, title/epithet and pronunciation when useful.
- Kind/species and role: ordinary monster, elite, miniboss or boss.
- Concise player-facing description and a short biography: origin, past event,
  current motivation and connection to its location. Mark invented lore as authored.
- Apparent age/lifespan only when meaningful to the creature; do not invent a
  human nationality or human age just to fill an actor's profile fields.
- Temperament, behavior, habitat/arena and reason for being there. An anchored
  monster's binding/entrapment can be story context without requiring locomotion.
- Reference/art provenance; portrait, icon, illustration and available cue bindings.
- Relative visible size and anchor type, separately from health and damage stats.

If the owner supplied an established identity or facts, preserve them. Unknown
canon is not a license to present invented details as established lore.

## Mechanical stats and weaknesses

Record numeric units and source/approval for balance choices. Unspecified numbers
may be proposed as tunable values; do not describe them as measured balance.

- HP representation, maximum/current HP, optional per-bar capacity and total bars.
- Defense/resistance rules and damage types actually supported by combat.
- Each weakness: target part, opening condition, eligible attack/type/tool, effect,
  multiplier or armor break, duration/cooldown and player-readable tell.
- Phase thresholds using the shared total HP or an explicit authored trigger.
- Each attack: name, short description, valid phase, targeting, preparation,
  active hit window/ground region, recovery, cooldown, damage/status and interruption.
- Stagger threshold/recovery, optional invulnerability windows, defeat conditions
  and reset/despawn behavior. Define healing, regeneration and retreat if present.

Example weakness: a central throat becomes vulnerable briefly after its breath
attack. The glowing throat and recovery pose show that opening. Damage to armored
plates outside the window remains governed by the armor rule. This is a proposed
mechanic, not something proven by the supplied image.

Multiple heads can share one HP pool and expose distinct weak points. If heads
have separate breakable health, define how breaking them affects the shared pool,
attacks and victory; never quietly subtract the same hit from every head and body.
Reject duplicate hit IDs as required by the current combat contract. A cosmetic
hurt animation must not apply the damage a second time.

## Three meanings of “50x”

Keep these independent and resolve an ambiguous request before final balance:

| Meaning | Data/result |
| --- | --- |
| 50 stacked health bars | `barCount = 50`; define `hpPerBar` explicitly; `maxHp = 50 * hpPerBar` |
| 50 times baseline HP | Define the baseline and `hpMultiplier = 50`; use `maxHp = baselineHp * 50` |
| 50 times player height | Record a visual size comparison; choose arena, camera and asset bounds deliberately; HP remains separate |

Do not interpret `x50` as 50 HP. Do not assume a 50-bar boss has 50 times the
visual size or attack damage. A boss's health-bar count is not its encounter phase.

### Stacked bar calculation

Store one canonical `currentHp` and `maxHp`. For equal-capacity bars, clamp health
to `[0, maxHp]`, require positive `hpPerBar` and a positive integer `barCount`:

```text
maxHp = hpPerBar * barCount
remainingBars = currentHp > 0 ? ceil(currentHp / hpPerBar) : 0
activeBarHp = remainingBars > 0 ? currentHp - (remainingBars - 1) * hpPerBar : 0
activeBarFraction = activeBarHp / hpPerBar
totalHealthFraction = currentHp / maxHp
```

At an exact boundary, the visible active bar is full. At zero HP, show zero bars
and trigger defeat once. Damage carries across several bars in one operation;
never discard overflow damage or refill to a new bar without applying the rest.
Healing, if allowed, restores the canonical total subject to its cap. UI and phase
logic derive from that same state instead of their own decrementing counters.

For an explicitly chosen 50-bar example with 1,000 HP per bar, maximum HP is
50,000; 49,000 HP displays `x49` and a full active bar. Those numbers illustrate
the formula and are not approved PawTrail balance defaults.

## Readable boss health presentation

Show the name/title, active health bar and remaining-stack count (`xN`) clearly.
Add overall progress/phase cues when useful; avoid fifty independently animated
HUD elements. Retain accessible numeric current/max HP or equivalent text.
Damage previews/drain trails are presentation; the authoritative HP changes once.
At very large values, format numbers consistently and retain precise underlying
values. Match the current game HUD/font tokens and official shadcn controls.

Prototype combat remains local. A multiplayer boss requires server-owned damage,
HP, phase transitions, eligibility and reward grants through an actual game service.
Never trust a client claim of kills, remaining bars or earned verified Kibble.
