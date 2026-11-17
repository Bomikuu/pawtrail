import { NPCS, type Outcome } from './state'

/** First-loop event definitions only. Later floor quests/loot are not installed. */
export const neonFoundation: Record<string, Outcome> = {
  start: { id: 'F01.START', event: 'floor-entry', scope: 'profile', conditions: [], effects: [{ kind: 'scrip', amount: 30 }] },
  meetMara: { id: 'F01.MARA.MET', event: 'conversation', scope: 'profile', conditions: [], effects: [{ kind: 'met', key: 'mara' }] },
  acceptBearings: { id: 'F01.Q01.ACCEPT', event: 'conversation', scope: 'profile', conditions: [{ kind: 'met', key: 'mara' }, { kind: 'quest', key: 'q01', value: 'available' }], effects: [{ kind: 'quest', key: 'q01', value: 'active' }] },
  checkpoint: { id: 'F01.CHECKPOINT', event: 'checkpoint', scope: 'profile', conditions: [], effects: [{ kind: 'fact', key: 'checkpoint-active', value: true }] },
  route: { id: 'F01.ROUTE', event: 'route-inspection', scope: 'profile', conditions: [], effects: [{ kind: 'fact', key: 'route-inspected', value: true }] },
  bearings: {
    id: 'F01.Q01.CLAIM', event: 'quest-turn-in', scope: 'profile',
    conditions: [{ kind: 'met', key: 'mara' }, { kind: 'quest', key: 'q01', value: 'active' }, { kind: 'fact', key: 'checkpoint-active', value: true }, { kind: 'fact', key: 'route-inspected', value: true }],
    effects: [{ kind: 'scrip', amount: 15 }, { kind: 'quest', key: 'q01', value: 'claimed' }, { kind: 'quest', key: 'q02', value: 'available' }],
  },
  acceptAllocation: { id: 'F01.Q02.ACCEPT', event: 'conversation', scope: 'profile', conditions: [{ kind: 'quest', key: 'q02', value: 'available' }], effects: [{ kind: 'quest', key: 'q02', value: 'active' }] },
  cell: {
    id: 'F01.CELL', event: 'service', scope: 'profile', conditions: [{ kind: 'quest', key: 'q02', value: 'active' }, { kind: 'fact', key: 'cell-issued', value: false }],
    effects: [{ kind: 'met', key: 'ivo' }, { kind: 'item', key: 'f01.key.cell', amount: 1 }, { kind: 'fact', key: 'cell-issued', value: true }],
  },
  clinic: {
    id: 'F01.ALLOC.C', event: 'allocation-confirmation', scope: 'profile', conditions: [{ kind: 'quest', key: 'q02', value: 'active' }, { kind: 'decision', key: 'allocation', value: 'unset' }, { kind: 'item', key: 'f01.key.cell', minimum: 1 }],
    effects: [{ kind: 'item', key: 'f01.key.cell', amount: -1 }, { kind: 'decision', key: 'allocation', value: 'clinic' }, { kind: 'relationship', key: 'mara', amount: 8 }, { kind: 'faction', key: 'residents', amount: 6 }, ...NPCS.map(key => ({ kind: 'knowledge' as const, key, value: 'allocation' as const })), { kind: 'quest', key: 'q02', value: 'completed' }],
  },
  transit: {
    id: 'F01.ALLOC.T', event: 'allocation-confirmation', scope: 'profile', conditions: [{ kind: 'quest', key: 'q02', value: 'active' }, { kind: 'decision', key: 'allocation', value: 'unset' }, { kind: 'item', key: 'f01.key.cell', minimum: 1 }],
    effects: [{ kind: 'item', key: 'f01.key.cell', amount: -1 }, { kind: 'decision', key: 'allocation', value: 'transit' }, { kind: 'relationship', key: 'mara', amount: -3 }, { kind: 'faction', key: 'residents', amount: -2 }, { kind: 'relationship', key: 'nyx', amount: 4 }, { kind: 'faction', key: 'couriers', amount: 6 }, ...NPCS.map(key => ({ kind: 'knowledge' as const, key, value: 'allocation' as const })), { kind: 'quest', key: 'q02', value: 'completed' }],
  },
  allocationReport: { id: 'F01.Q02.CLAIM', event: 'quest-turn-in', scope: 'profile', conditions: [{ kind: 'quest', key: 'q02', value: 'completed' }], effects: [{ kind: 'scrip', amount: 35 }, { kind: 'quest', key: 'q02', value: 'claimed' }, { kind: 'quest', key: 'q03', value: 'available' }, { kind: 'quest', key: 'q07', value: 'available' }] },
}
