import profile from '../../../assets/monster-studio/vaelrith-riftbound/profile.json'

export const VAELRITH = {
  id: profile.id, name: profile.name, title: profile.title,
  description: profile.description, biography: profile.biography,
  assets: '/pawtrail-game/monsters/vaelrith-riftbound/v1/',
  maxHp: profile.health.maxHp, hpPerBar: profile.health.hpPerBar, bars: profile.health.barCount,
  // These are creature-to-player ratios, never a scale applied to the player.
  height: 8, span: 15,
} as const
export type HeadId = 'left' | 'center' | 'right'
export type AttackId = 'rift-fang' | 'obsidian-sweep' | 'violet-exhalation' | 'seal-rupture' | 'riftfire-rain'
export type GroundPoint = { x: number; z: number }
export const ATTACKS: Record<AttackId, {
  name: string; head: HeadId | 'all'; preparation: number; active: number;
  recovery: number; cooldown: number; damage: number; tick: number;
}> = {
  'rift-fang': { name: 'Rift Fang', head: 'left', preparation: 900, active: 220, recovery: 1600, cooldown: 6000, damage: 30, tick: 0 },
  'obsidian-sweep': { name: 'Obsidian Sweep', head: 'right', preparation: 1100, active: 450, recovery: 1800, cooldown: 9000, damage: 25, tick: 0 },
  'violet-exhalation': { name: 'Violet Exhalation', head: 'center', preparation: 1400, active: 1200, recovery: 2500, cooldown: 12000, damage: 15, tick: 400 },
  'seal-rupture': { name: 'Seal Rupture', head: 'all', preparation: 2600, active: 1400, recovery: 3200, cooldown: 24000, damage: 40, tick: 0 },
  'riftfire-rain': { name: 'Riftfire Rain', head: 'all', preparation: 1500, active: 3200, recovery: 1900, cooldown: 16000, damage: 10, tick: 600 },
}
export const HEADS: HeadId[] = ['left', 'center', 'right']
export const headX: Record<HeadId, number> = { left: -4.2, center: 0, right: 4.2 }
export function healthBars(hp: number) {
  const value = Math.max(0, Math.min(VAELRITH.maxHp, hp))
  const remaining = value > 0 ? Math.ceil(value / VAELRITH.hpPerBar) : 0
  return { remaining, active: remaining ? value - (remaining - 1) * VAELRITH.hpPerBar : 0 }
}
