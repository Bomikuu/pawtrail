/** Local fictional encounter data. Never an animal record or authoritative reward. */
export const HYDRA = {
  id: 'kaedros-embermaw', name: 'Kaedros', title: 'The Embermaw Hydra',
  assets: '/pawtrail-game/monsters/kaedros-embermaw/v1/',
  maxHp: 3600, hpPerBar: 600, enrageAt: .3,
  biography: 'Once the guardian of a volcanic river crossing, Kaedros now mistakes every visitor for a raider. Five watchful heads share one stubborn heart. Its armored scales conceal a softer chest, exposed while it catches its breath after landing.',
  normal: { speed: 1.25, fireDuration: 3200, fireCooldown: 8500, stompCooldown: 11500, rest: 1700, stompRadius: 1.65, fireInterval: 190 },
  enraged: { speed: 1.8, fireDuration: 4200, fireCooldown: 5400, stompCooldown: 6900, rest: 850, stompRadius: 2.35, fireInterval: 125 },
} as const
export type HydraPoint = { x: number; z: number }
export const HYDRA_HEADS = { heights: [2.9, 4.05, 4.65, 4.05, 2.9], x: [-1.65, -.95, 0, .95, 1.65], fireLower: .18 } as const
export type HydraAttack = 'ember-barrage' | 'skyfall-stomp'
export type HydraWindow = 'idle' | 'chasing' | 'warning' | 'firing' | 'ascending' | 'airborne' | 'landing' | 'recovery' | 'enraging' | 'defeated'
export const HYDRA_ATTACKS = {
  'ember-barrage': { name: 'Fivefold Ember Barrage', description: 'Heads alternate a sustained stream of dodgeable embers. Enrage adds outward fans and a longer burst.' },
  'skyfall-stomp': { name: 'Skyfall Stomp', description: 'Wings lift Kaedros over a locked landing marker. Leave the warning circles before impact. Enrage adds three satellite blasts.' },
} as const
