import profile from '../../../assets/monster-studio/solvaris-solar-arbiter/profile.json'

export const DEITY = {
  id: profile.id, name: profile.name, title: profile.title, biography: profile.biography,
  assets: '/pawtrail-game/monsters/solvaris-solar-arbiter/v1/',
  maxHp: profile.health.maxHp, hpPerBar: profile.health.hpPerBar, enrageAt: profile.health.enrageAt,
  height: profile.scale.nominalHeightInPlayerUnits, span: profile.scale.haloSpanInPlayerUnits,
} as const
export const DEITY_ATTACKS = {
  'solar-verdict': { name: 'Solar Verdict', description: 'A colossal palm marks reachable ground near your position. Leave the circle before it falls, then strike the lowered palm seal.', windup: 1700, active: 450, recovery: 3200, cooldown: 7800, damage: 28 },
  'halo-decree': { name: 'Halo Decree', description: 'A vast annulus burns around the arbiter. The clear inner sanctuary and space beyond the outer ring are safe.', windup: 2100, active: 450, recovery: 3300, cooldown: 12600, damage: 32 },
  'astral-tribunal': { name: 'Astral Tribunal', description: 'Three ground-locked pillars form across your position. Enrage adds two more. Move into the unmarked gaps before judgment lands.', windup: 1900, active: 550, recovery: 3200, cooldown: 15800, damage: 30 },
} as const
export type DeityAttackId = keyof typeof DEITY_ATTACKS
export const DEITY_RULES = {
  normal: { palmRadius: 2.7, ringInner: 5.5, ringOuter: 12, pillarRadius: 2.5, pillars: 3, cooldown: 1, rest: 1200 },
  enraged: { palmRadius: 3.5, ringInner: 4.4, ringOuter: 15, pillarRadius: 3.15, pillars: 5, cooldown: .64, rest: 700 },
} as const
