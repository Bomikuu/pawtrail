import type * as T from 'three'
import type { HydraBolt } from './hydra-encounter'

export type ArenaVariant = 'hydra' | 'serpent' | 'reaper' | 'deity' | 'robot'
export type ArenaPoint = { x: number; z: number }
export type ArenaCircle = ArenaPoint & { radius: number; active?: boolean; visible?: boolean }
export type ArenaEvent = { kind: 'damage'; target: 'boss' | 'player'; amount: number; weak?: boolean; point: ArenaPoint; attack?: string; label?: string; targetName?: string; height?: number; impact?: 'fire' | 'slash' | 'weak' } | { kind: 'phase' | 'defeat'; target: 'boss' | 'player'; point: ArenaPoint } | { kind: 'blocked' | 'notice'; target: 'boss' | 'player'; point: ArenaPoint; label: string }
export type ArenaComponent = ArenaPoint & { id: string; name: string; hp: number; maxHp: number; height: number }
export type ArenaReport = {
  hp: number; playerHp: number; running: boolean; enraged: boolean; window: string;
  cast: string | null; progress: number; fireCooldown: number; stompCooldown: number;
  log: string[]; phaseElapsed: number; weak: boolean; portraitState?: 'alert' | 'threatening' | 'hurt'; cooldowns?: Record<string, number>;
  components?: ArenaComponent[]; shielded?: boolean
}
export interface ArenaEncounter {
  hp: number; playerHp: number; running: boolean; enraged: boolean; clock: number;
  position: ArenaPoint; phaseElapsed: number; deathElapsed: number; readonly lift: number;
  readonly bolts?: readonly HydraBolt[];
  start(): void; pause(): void; cancel(): void; reset(): void; rehearseEnrage(): void;
  attack(id: string, player: ArenaPoint): boolean;
  hit(id: string, amount: number, region?: string): boolean | 'blocked';
  window(): string; circles(): ArenaCircle[]; advance(delta: number, player: ArenaPoint): void;
  bodyCircles?(): ArenaCircle[];
  hitRegions?(): (ArenaPoint & { id: string; radius: number; eligible?: boolean })[];
  components?(): ArenaComponent[];
  report(): ArenaReport;
}
export type ArenaDefinition = {
  id: string; name: string; title: string; assets: string; maxHp: number; hpPerBar: number; enrageAt: number; biography: string;
  summary: string; normalTitle: string; enragedTitle: string; phaseName: string; phaseDescription: string;
  weakLabel: string; armorLabel: string; weakness: string; opening: string; instructions: string;
  attacks: { id: string; name: string; description: string }[];
  arena: { halfWidth: number; boundsX: number; boundsZ: number; spawnZ: number; collisionRadius: number; floor: string; backdrop: string; markerCapacity: number; pathColor?: string; gridColor?: string; gridOpacity?: number; shadowRadius?: number; cameraTargetY?: number; maxZoom?: number; allowPan?: boolean; heightGuide?: number; gridStep?: number };
}
export type ArenaActor = {
  definition: ArenaDefinition; encounter: ArenaEncounter; root: T.Group;
  pose(time: number, reduced: boolean): void; dispose(): void;
  hazards?: { root: T.Group; update(reduced: boolean): void; dispose(): void }
}
