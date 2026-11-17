/** Local floor-campaign contracts. No platform/Kibble authority or implicit writes. */
export const NPCS = ['mara', 'ivo', 'eko', 'nyx', 'sena'] as const
export const FACTIONS = ['residents', 'exchange', 'couriers', 'wardens'] as const
export const STAGES = ['hub.concourse', 'f01.stage.arrival', 'f01.stage.market', 'f01.stage.undergrid', 'f01.stage.skybridge', 'f01.stage.switchyard', 'f01.stage.bastion'] as const
export const ITEMS = ['f01.mat.scrap', 'f01.mat.wire', 'f01.mat.coolant', 'f01.mat.fiber', 'f01.mat.prism', 'f01.mat.alloy', 'f01.key.cell', 'f01.key.fragment', 'f01.key.relay', 'f01.key.writ', 'f01.key.core', 'f01.item.keepsake', 'f01.item.replacement', 'f01.item.med-patch', 'f01.item.insulator', 'f01.item.koi-lamp', 'f01.item.bastion-bench'] as const
export const QUESTS = ['q01', 'q02', 'q03', 'q04', 'q05', 'q06', 'q07', 'q08', 'q09', 'q10', 'q11'] as const
export const QUEST_STATES = ['locked', 'available', 'active', 'completed', 'claimed'] as const
export const FACTS = ['checkpoint-active', 'route-inspected', 'cell-issued', 'archive-open', 'fragment-recovered', 'invoice-found', 'header-retained', 'private-routes-available', 'redacted-archive-available', 'p02-solved', 'gate-authenticated', 'marshal-first-clear', 'boss-first-clear', 'floor-cleared', 'promise-declined', 'promise-sold'] as const
export const KNOWLEDGE = ['allocation', 'archive', 'invoice', 'promise', 'gate', 'victory', 'governance'] as const
export const DECISIONS = {
  allocation: ['unset', 'clinic', 'transit'], archive: ['unset', 'redacted', 'erased'],
  invoice: ['unset', 'protected', 'published'], promise: ['unseen', 'declined', 'carrying', 'returned', 'sold', 'reconciled'],
  governance: ['unset', 'community', 'warden', 'exchange'],
} as const
export type NpcId = typeof NPCS[number]
export type FactionId = typeof FACTIONS[number]
export type StageId = typeof STAGES[number]
export type ItemId = typeof ITEMS[number]
export type QuestId = typeof QUESTS[number]
export type QuestState = typeof QUEST_STATES[number]
export type FactId = typeof FACTS[number]
export type KnowledgeId = typeof KNOWLEDGE[number]
export type DecisionKey = keyof typeof DECISIONS
export type Decisions = { [K in DecisionKey]: typeof DECISIONS[K][number] }
export type Receipt = { event: string; outcome: string; revision: number }
export type Campaign = {
  format: 'pawtrail-floor-campaign'; version: 1; profileId: string; revision: number
  scrip: number; inventory: Record<ItemId, number>; decisions: Decisions
  facts: Record<FactId, boolean>; quests: Record<QuestId, QuestState>
  met: NpcId[]; knowledge: Record<NpcId, KnowledgeId[]>
  relationships: Record<NpcId, number>; factions: Record<FactionId, number>
  seen: string[]; receipts: Record<string, Receipt>
  expedition: { id: string; receipts: Record<string, Receipt> }
  location: { stage: StageId; checkpoint: string | null }
  /** Additive v1 field: earlier foundation saves default to full health. */
  vitals?: { hp: number; maxHp: 100; insulation: number }
  puzzles?: { relay: number[]; archive: number[] }
  combat?: { recent: string[] }
  activities?:import('./phase6-content').FloorActivities
  fixtures?:import('./phase6-content').CampFixtures
  encounters?:{pending:import('./encounter-proof').VictoryRecord|null;emblem:boolean}
}
export const safeId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value)
const entries = <K extends string, V>(keys: readonly K[], make: (key: K) => V) => Object.fromEntries(keys.map(key => [key, make(key)])) as Record<K, V>
export function freshCampaign(profileId: string, expeditionId: string): Campaign {
  if (!safeId(profileId) || !safeId(expeditionId)) throw Error('Choose valid local save and expedition IDs.')
  return {
    format: 'pawtrail-floor-campaign', version: 1, profileId, revision: 0, scrip: 0,
    inventory: entries(ITEMS, () => 0), decisions: { allocation: 'unset', archive: 'unset', invoice: 'unset', promise: 'unseen', governance: 'unset' },
    facts: entries(FACTS, () => false), quests: entries(QUESTS, key => key === 'q01' ? 'available' : 'locked'),
    met: [], knowledge: entries(NPCS, () => []), relationships: entries(NPCS, () => 0), factions: entries(FACTIONS, () => 0),
    seen: [], receipts: {}, expedition: { id: expeditionId, receipts: {} }, location: { stage: 'hub.concourse', checkpoint: null }, vitals: { hp: 100, maxHp: 100, insulation: 0 },
  }
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const int = (v: unknown, min: number, max: number): v is number => Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max
const exact = (v: unknown, keys: readonly string[], check: (v: unknown) => boolean) => object(v) && Object.keys(v).length === keys.length && keys.every(key => Object.hasOwn(v, key) && check(v[key]))
const member = (v: unknown, values: readonly string[]) => typeof v === 'string' && values.includes(v)
const unique = (v: unknown, max: number, check: (v: unknown) => boolean): v is string[] => Array.isArray(v) && v.length <= max && new Set(v).size === v.length && v.every(check)
function receipts(v: unknown, revision: number) {
  return object(v) && Object.keys(v).length <= 1024 && Object.entries(v).every(([key, row]) => safeId(key) && object(row) && safeId(row.event) && safeId(row.outcome) && int(row.revision, 1, revision))
}
/** Reject unsupported/corrupt saves; never clear or silently replace them. */
export function validCampaign(v: unknown): v is Campaign {
  if (!object(v) || v.format !== 'pawtrail-floor-campaign' || v.version !== 1 || !safeId(v.profileId) || !int(v.revision, 0, 1_000_000) || !int(v.scrip, 0, 10_000_000)) return false
  if (v.vitals !== undefined && (!object(v.vitals) || v.vitals.maxHp !== 100 || !int(v.vitals.hp, 0, 100) || !int(v.vitals.insulation, 0, 2))) return false
  if(v.puzzles!==undefined&&(!object(v.puzzles)||!Array.isArray(v.puzzles.relay)||v.puzzles.relay.length!==9||!v.puzzles.relay.every(n=>int(n,0,3))||!Array.isArray(v.puzzles.archive)||v.puzzles.archive.length>4||!v.puzzles.archive.every(n=>int(n,0,2))))return false
  if(v.combat!==undefined&&(!object(v.combat)||!unique(v.combat.recent,64,safeId)))return false
  if(v.activities!==undefined){
    const a=v.activities
    if(!object(a)||typeof a.awning!=='boolean'||typeof a.koiSolved!=='boolean'||typeof a.koiMessage!=='string'||a.koiMessage.length>240)return false
    if(a.koi!==null){const k=a.koi;if(!object(k)||!safeId(k.id)||!['normal','assisted'].includes(String(k.mode))||!int(k.start,0,10_000_000_000_000)||!Array.isArray(k.entered)||k.entered.length>4||!k.entered.every((n,i)=>['left','up','right','down'][i]===n))return false}
  }
  if(v.fixtures!==undefined&&(!object(v.fixtures)||Object.keys(v.fixtures).some(key=>!['koi','bench'].includes(key))||Object.values(v.fixtures).some(f=>!object(f)||![0,90,180,270].includes(Number(f.rotation))||typeof f.rotation!=='number'||typeof f.lit!=='boolean')))return false
  if(v.encounters!==undefined&&(!object(v.encounters)||typeof v.encounters.emblem!=='boolean'||v.encounters.pending!==null&&(!object(v.encounters.pending)||!['marshal','bastion'].includes(String(v.encounters.pending.kind))||!safeId(v.encounters.pending.id)||!safeId(v.encounters.pending.expedition))))return false
  if (!exact(v.inventory, ITEMS, n => int(n, 0, 100_000)) || !exact(v.facts, FACTS, n => typeof n === 'boolean') || !exact(v.quests, QUESTS, n => member(n, QUEST_STATES))) return false
  const decisions = v.decisions
  if (!object(decisions) || Object.keys(decisions).length !== Object.keys(DECISIONS).length || !(Object.keys(DECISIONS) as DecisionKey[]).every(key => member(decisions[key], DECISIONS[key]))) return false
  if (!unique(v.met, NPCS.length, n => member(n, NPCS)) || !exact(v.knowledge, NPCS, n => unique(n, KNOWLEDGE.length, x => member(x, KNOWLEDGE)))) return false
  if (!exact(v.relationships, NPCS, n => int(n, -100, 100)) || !exact(v.factions, FACTIONS, n => int(n, -100, 100)) || !unique(v.seen, 1024, safeId) || !receipts(v.receipts, v.revision)) return false
  return object(v.expedition) && safeId(v.expedition.id) && receipts(v.expedition.receipts, v.revision) && object(v.location) && member(v.location.stage, STAGES) && (v.location.checkpoint === null || safeId(v.location.checkpoint))
}
export type Condition =
  | { kind: 'fact'; key: FactId; value: boolean }
  | { kind: 'quest'; key: QuestId; value: QuestState }
  | { kind: 'decision'; key: DecisionKey; value: string }
  | { kind: 'item'; key: ItemId; minimum: number }
  | { kind: 'met'; key: NpcId }
  | { kind: 'stage'; value: StageId }
export type Effect =
  | { kind: 'scrip'; amount: number }
  | { kind: 'item'; key: ItemId; amount: number }
  | { kind: 'relationship'; key: NpcId; amount: number }
  | { kind: 'faction'; key: FactionId; amount: number }
  | { kind: 'fact'; key: FactId; value: boolean }
  | { kind: 'quest'; key: QuestId; value: QuestState }
  | { kind: 'decision'; key: DecisionKey; value: string }
  | { kind: 'met'; key: NpcId }
  | { kind: 'knowledge'; key: NpcId; value: KnowledgeId }
  | { kind: 'vitals'; hp?: number; insulation?: number }
  | { kind: 'checkpoint'; value: string }
  | { kind: 'puzzles'; value: { relay: number[]; archive: number[] } }
  | { kind: 'contact'; id: string }
  | { kind:'encounter-clear' }
  | { kind:'emblem' }
  | {kind:'activities';value:import('./phase6-content').FloorActivities}
  | {kind:'fixtures';value:import('./phase6-content').CampFixtures}
export type AcceptedEvent = { id: string; kind: 'floor-entry' | 'conversation' | 'checkpoint' | 'route-inspection' | 'quest-turn-in' | 'service' | 'allocation-confirmation' | 'purchase' | 'sale' | 'item-use' | 'puzzle' | 'combat' | 'resource' }
export type Outcome = { id: string; event: AcceptedEvent['kind']; scope: 'profile' | 'expedition' | 'state'; conditions: Condition[]; effects: Effect[] }
export type OutcomeResult = { ok: true; status: 'applied' | 'already-applied'; state: Campaign; receipt: Receipt } | { ok: false; status: 'blocked' | 'invalid' | 'capacity'; message: string }
export function conditionMet(state: Campaign, c: Condition) {
  switch (c.kind) {
    case 'fact': return state.facts[c.key] === c.value
    case 'quest': return state.quests[c.key] === c.value
    case 'decision': return state.decisions[c.key] === c.value
    case 'item': return state.inventory[c.key] >= c.minimum
    case 'met': return state.met.includes(c.key)
    case 'stage': return state.location.stage === c.value
  }
}
/** Pure candidate transition. Successful persistence is a separate store result. */
export function applyOutcome(state: Campaign, outcome: Outcome, event: AcceptedEvent): OutcomeResult {
  if (!validCampaign(state) || !safeId(outcome.id) || !safeId(event.id) || outcome.event !== event.kind || !['profile', 'expedition','state'].includes(outcome.scope)) return { ok: false, status: 'invalid', message: 'The local event or state is invalid.' }
  if(outcome.scope==='state'&&outcome.effects.some(effect=>!['puzzles','vitals','contact','checkpoint','activities','fixtures'].includes(effect.kind)))return{ok:false,status:'invalid',message:'Transient state cannot grant items, currency or reputation.'}
  const receipts = outcome.scope === 'profile' ? state.receipts : state.expedition.receipts
  const prior = outcome.scope!=='state'&&Object.hasOwn(receipts, outcome.id) ? receipts[outcome.id] : undefined
  if (prior) return { ok: true, status: 'already-applied', state, receipt: prior }
  if (outcome.scope!=='state'&&Object.values(state.receipts).concat(Object.values(state.expedition.receipts)).some(row => row.event === event.id)) return { ok: false, status: 'blocked', message: 'This accepted event has already been handled.' }
  if (!outcome.conditions.every(c => conditionMet(state, c))) return { ok: false, status: 'blocked', message: 'The requirements have changed. Nothing was spent.' }
  if ((outcome.scope!=='state'&&Object.keys(receipts).length >= 1024) || state.revision >= 1_000_000) return { ok: false, status: 'capacity', message: 'This local save needs a content migration before more outcomes can be recorded.' }
  const next = structuredClone(state)
  const clamp = (n: number) => Math.max(-100, Math.min(100, n))
  for (const effect of outcome.effects) {
    switch (effect.kind) {
      case 'scrip': next.scrip += effect.amount; break
      case 'item': next.inventory[effect.key] += effect.amount; break
      case 'relationship': next.relationships[effect.key] = clamp(next.relationships[effect.key] + effect.amount); break
      case 'faction': next.factions[effect.key] = clamp(next.factions[effect.key] + effect.amount); break
      case 'fact': next.facts[effect.key] = effect.value; break
      case 'quest': next.quests[effect.key] = effect.value; break
      case 'decision': Object.assign(next.decisions, { [effect.key]: effect.value }); break
      case 'met': if (!next.met.includes(effect.key)) next.met.push(effect.key); break
      case 'knowledge': if (!next.knowledge[effect.key].includes(effect.value)) next.knowledge[effect.key].push(effect.value); break
      case 'vitals': next.vitals = { hp: effect.hp ?? next.vitals?.hp ?? 100, maxHp: 100, insulation: effect.insulation ?? next.vitals?.insulation ?? 0 }; break
      case 'checkpoint': next.location.checkpoint = effect.value; break
      case 'puzzles': next.puzzles=structuredClone(effect.value);break
      case 'contact': next.combat={recent:[...(next.combat?.recent??[]).filter(id=>id!==effect.id),effect.id].slice(-64)};break
      case 'encounter-clear':next.encounters={pending:null,emblem:next.encounters?.emblem??false};break
      case 'activities':next.activities=structuredClone(effect.value);break
      case 'fixtures':next.fixtures=structuredClone(effect.value);break
      case 'emblem':next.encounters={pending:next.encounters?.pending??null,emblem:true};break
    }
    if (!validCampaign(next)) return { ok: false, status: 'blocked', message: 'The outcome cannot be applied. Nothing was spent.' }
  }
  next.revision++
  const receipt = { event: event.id, outcome: outcome.id, revision: next.revision }
  if(outcome.scope!=='state')(outcome.scope === 'profile' ? next.receipts : next.expedition.receipts)[outcome.id] = receipt
  return { ok: true, status: 'applied', state: next, receipt }
}
