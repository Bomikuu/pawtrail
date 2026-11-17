import profile from '../../../assets/monster-studio/kurogane-neon-bastion/profile.json'

export const ROBOT = {
  id: profile.id, name: profile.name, title: profile.title, biography: profile.biography,
  assets: '/pawtrail-game/monsters/kurogane-neon-bastion/v1/',
  maxHp: 8400, hpPerBar: 600, enrageAt: .3, funnelHp: 360,
} as const
export const ROBOT_ATTACKS = {
  'crossfire-lattice': { name: 'Crossfire Lattice', description: 'Surviving funnels lock cyan firing lanes. Step sideways before the beams fire. With no funnels, the body uses one emitter.', windup: 1500, active: 420, recovery: 1900, cooldown: 6400, damage: 20 },
  'reactor-sweep': { name: 'Reactor Sweep', description: 'A forward reactor sector locks your position. Circle behind the body or leave the marked wedge.', windup: 1600, active: 400, recovery: 2100, cooldown: 9000, damage: 26 },
  'neon-lockdown': { name: 'Neon Lockdown', description: 'Three ground-locked blast disks mark your position. Overclock adds two more; move into the unmarked gaps.', windup: 1800, active: 450, recovery: 2200, cooldown: 12400, damage: 24 },
} as const
export type RobotAttackId = keyof typeof ROBOT_ATTACKS
