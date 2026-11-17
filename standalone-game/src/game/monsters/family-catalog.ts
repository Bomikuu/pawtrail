import source from '../../../assets/monster-studio/families/catalog.json'
import type { ArenaDefinition, ArenaVariant } from './arena-contract'

export type FamilyId = 'vaelrith' | 'kaedros' | 'morvane' | 'vesper' | 'solvaris' | 'kurogane'
export type FamilySkill = {
  id: string; name: string; description: string; shape: 'sector' | 'ring' | 'circle';
  outer: number; inner: number; angle: number; target: 'self' | 'player'; damage: number;
  windup: number; active: number; recovery: number; cooldown: number
}
export type FamilyCreature = {
  id: string; name: string; title: string; tier: 'mini-boss' | 'normal'; row: number; enragedRow: number | null;
  maxHp: number; hpPerBar: number; enrageAt: number; height: number; radius: number;
  speed: number; hover: number; armor: number; weakMultiplier: number; biography: string;
  weakness: string; temperament: string; origin: string; skills: FamilySkill[]
}
export type BossFamily = {
  id: FamilyId; name: string; bossId: string; bossQuery: string;
  palette: { floor: string; backdrop: string; path: string; grid: string }; creatures: FamilyCreature[]
}
export const BOSS_FAMILIES = source.families as BossFamily[]
export const familyForVariant: Record<ArenaVariant, FamilyId> = { hydra: 'kaedros', serpent: 'morvane', reaper: 'vesper', deity: 'solvaris', robot:'kurogane' }
export function familyMember(id: string) {
  for (const family of BOSS_FAMILIES) {
    const creature = family.creatures.find(member => member.id === id)
    if (creature) return { family, creature }
  }
  return null
}
export function familyAssets(family: BossFamily, creature?: FamilyCreature) {
  return `/pawtrail-game/monsters/families/${family.id}/v1/${creature ? creature.id + '/' : ''}`
}
export function familyArena(family: BossFamily, creature: FamilyCreature): ArenaDefinition {
  const mini = creature.tier === 'mini-boss'
  return {
    id: creature.id, name: creature.name, title: creature.title, assets: familyAssets(family, creature),
    maxHp: creature.maxHp, hpPerBar: creature.hpPerBar, enrageAt: creature.enrageAt, biography: creature.biography,
    summary: `${family.name} family · ${mini ? 'mini-boss · two skills' : 'normal mob'} · ${creature.height}× player height · authored pixel poses`,
    normalTitle: creature.title, enragedTitle: 'Unbound ' + creature.name, phaseName: creature.name + ' unbound!',
    phaseDescription: 'Larger attack areas. Faster pursuit and cooldowns.',
    weakLabel: 'Recovery opening ×1.5', armorLabel: mini ? 'Armored binding ×0.8' : 'Confirmed sword contact',
    weakness: creature.weakness, opening: 'Recovery opening — strike now!',
    instructions: 'Watch the marked ground. Move out before contact, then counterattack during recovery.',
    attacks: creature.skills,
    arena: { halfWidth: 6.7, boundsX: 5.5, boundsZ: 4.2, spawnZ: 3.1, collisionRadius: creature.radius,
      floor: family.palette.floor, backdrop: family.palette.backdrop, markerCapacity: 0,
      pathColor: family.palette.path, gridColor: family.palette.grid, gridOpacity: .35, shadowRadius: creature.radius * 1.15 },
  }
}
