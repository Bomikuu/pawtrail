import { HYDRA, HYDRA_ATTACKS } from './hydra'
import { DEITY, DEITY_ATTACKS } from './deity'
import { ROBOT, ROBOT_ATTACKS } from './robot'
import type { ArenaDefinition, ArenaVariant } from './arena-contract'

export const ARENA_DEFINITIONS: Record<ArenaVariant, ArenaDefinition> = {
  robot: {
    ...ROBOT,
    summary:'Cyberpunk command mech · four destructible funnels · shield-gated main body',
    normalTitle:'Guardian of the neon switchyard',enragedTitle:'Overclock Siege',phaseName:'Overclock Siege!',phaseDescription:'Opened reactor. Wider beams. Five blast disks. Faster cooldowns.',
    weakLabel:'Exposed reactor recovery ×1.5',armorLabel:'Unshielded main body',
    weakness:'Four independent 360-HP funnels power the shield. The main body cannot lose HP until every funnel is destroyed. Destroyed funnels stay offline until reset; body recovery hits then deal ×1.5 damage.',
    opening:'Shield down — recovery counterattack!',
    instructions:'Move to the cyan A–D brackets and strike each funnel. Tab or the funnel cards select an aim target; J uses the real sword, K the ultimate. Selecting does not move you or guarantee a hit.',
    attacks:Object.entries(ROBOT_ATTACKS).map(([id,a])=>({id,name:a.name,description:a.description})),
    arena:{halfWidth:10.8,boundsX:8,boundsZ:6,spawnZ:4.8,collisionRadius:1.3,floor:'#344451',backdrop:'#181e30',markerCapacity:0,pathColor:'#46586a',gridColor:'#678397',gridOpacity:.3,shadowRadius:2,cameraTargetY:3,maxZoom:3,allowPan:true,gridStep:.5},
  },
  deity: {
    ...DEITY,
    summary: 'Colossal solar guardian · 30× nominal height · 28× halo span · largest current boss',
    normalTitle: 'Arbiter of the silent orrery', enragedTitle: 'The Shattered Mandate', phaseName: 'Shattered Mandate!', phaseDescription: 'Wider judgments. Five astral pillars. Faster cooldowns.',
    weakLabel: 'Exposed palm seal ×1.75', armorLabel: 'Armored feet ×0.35',
    weakness: 'The head and halo are above melee reach. Strike lowered palm seals during recovery for ×1.75 damage. Armored feet take ×0.35. Green ground seals track the actual reachable hands.',
    opening: 'Palm seals lowered — counterattack!', instructions: 'Dodge the gold marks. Follow Amber for a closer view; return to the wide view to frame the colossus. Strike lowered palm seals during recovery.',
    attacks: Object.entries(DEITY_ATTACKS).map(([id,attack])=>({id,name:attack.name,description:attack.description})),
    arena: { halfWidth: 27, boundsX: 18.5, boundsZ: 12.5, spawnZ: 10.4, collisionRadius: 3.1,
      floor: '#8c8170', backdrop: '#252439', markerCapacity: 0, pathColor: '#b6a57f', gridColor: '#baab8f', gridOpacity: .3,
      shadowRadius: 4.5, cameraTargetY: 14, maxZoom: 3, allowPan: true, heightGuide: 30, gridStep: .5 },
  },
  hydra: {
    ...HYDRA,
    summary: 'Five heads · roaming layered pixel rig · one shared health pool',
    normalTitle: 'The river guardian', enragedTitle: 'Emberwake form', phaseName: 'Emberwake!', phaseDescription: 'Larger blasts. Faster attacks.',
    weakLabel: 'Exposed chest ×1.65', armorLabel: 'Armored scales ×0.75',
    weakness: 'Armored scales reduce damage to ×0.75. After an attack, the chest is exposed for ×1.65 damage. Airborne and phase-transition targets cannot be struck.',
    opening: 'Chest exposed — attack now!', instructions: 'Leave marked areas before landing. Strike the chest during recovery for ×1.65 damage.',
    attacks: Object.entries(HYDRA_ATTACKS).map(([id, attack]) => ({ id, ...attack })),
    arena: { halfWidth: 9, boundsX: 7, boundsZ: 5, spawnZ: 4.3, collisionRadius: 1.35, floor: '#829b63', backdrop: '#304c53', markerCapacity: 4 },
  },
  serpent: {
    id: 'morvane-ossuary-serpent', name: 'Morvane', title: 'The Ossuary Serpent', assets: '/pawtrail-game/monsters/morvane-ossuary-serpent/v1/',
    maxHp: 6000, hpPerBar: 600, enrageAt: .3,
    biography: 'Morvane crawls through the ruins of a forgotten ossuary, drawn to the sound of living footsteps. A towering crowned skull leads a long procession of ribs and bladed legs. When its binding fractures, crimson light races through every vertebra.',
    summary: 'Giant skeletal serpent · path-following ribs and legs · one shared health pool',
    normalTitle: 'The ossuary sentinel', enragedTitle: 'Crimson marrow form', phaseName: 'Marrow unleashed!', phaseDescription: 'Faster pursuit. Wider bone waves.',
    weakLabel: 'Exposed skull ×1.65', armorLabel: 'Armored ribs ×0.65',
    weakness: 'The tall skull lowers into reach during a bite or recovery. Counterattack the recovering skull for ×1.65 damage. Ribs take ×0.65 damage; thin limbs do not fill their transparent artwork bounds.',
    opening: 'Skull exposed — counterattack!', instructions: 'Keep moving around the long body. Leave the bite marker or rib-wave circles, then strike the recovering skull.',
    attacks: [
      { id: 'grave-bite', name: 'Gravebite Lunge', description: 'The skull draws back, locks your position and lunges. Enrage widens its bite arc and shortens its cooldown.' },
      { id: 'ossuary-wave', name: 'Ossuary Ribwave', description: 'A travelling pulse erupts along the body. Step out of the marked circles. Enrage covers more segments with larger bursts.' },
    ],
    arena: { halfWidth: 10.5, boundsX: 9.5, boundsZ: 6.5, spawnZ: 5.4, collisionRadius: .9, floor: '#766a70', backdrop: '#29232e', markerCapacity: 18 },
  },
  reaper: {
    id: 'vesper-hollow-reaper', name: 'Vesper', title: 'The Hollow Reaper', assets: '/pawtrail-game/monsters/vesper-hollow-reaper/v1/',
    maxHp: 4800, hpPerBar: 600, enrageAt: .3,
    biography: 'Vesper drifts through an abandoned bell chapel, gathering the names that no one remembers. Beneath the torn indigo robe is a skeletal binding, revealed when the enormous scythe finishes its swing. Break the binding before its hollow harvest consumes the courtyard.',
    summary: 'Hovering skeletal reaper · articulated scythe and cloth · sector and ring AoEs',
    normalTitle: 'Keeper of lost names', enragedTitle: 'Hollow ascension', phaseName: 'Hollow ascension!', phaseDescription: 'Wider harvest. Faster scythe attacks.',
    weakLabel: 'Exposed binding ×1.65', armorLabel: 'Spectral shroud ×0.7',
    weakness: 'The shroud reduces damage to ×0.7. After a cast, the low-hover binding is exposed for ×1.65 damage. High Eclipse hover is out of sword reach.',
    opening: 'Binding exposed — strike now!', instructions: 'Dodge behind the crescent sweep. For Eclipse, enter the clear inner circle or leave the outer ring, then counterattack during recovery.',
    attacks: [
      { id: 'reaping-arc', name: 'Reaping Crescent', description: 'The huge scythe winds back and sweeps a locked sector. Move behind Vesper or beyond the marked edge. Enrage widens its angle and reach.' },
      { id: 'hollow-eclipse', name: 'Hollow Eclipse', description: 'Vesper rises and harvests a ring around its shadow. The unmarked center is safe. Enrage expands the ring and shortens its cooldown.' },
    ],
    arena: { halfWidth: 9, boundsX: 7, boundsZ: 5, spawnZ: 4.3, collisionRadius: .7, floor: '#757987', backdrop: '#282a3c', markerCapacity: 1, pathColor: '#8b8a99', gridColor: '#9393a5', gridOpacity: .3 },
  },
}
