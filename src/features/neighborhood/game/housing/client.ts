import { receiveSharedWorld } from '../immersion-data'
import type { Boot, Chat, HomesState, Placement, SceneCommand } from './types'
const listeners = new Set<() => void>(),
  commands = new Set<(c: SceneCommand) => void>(),
  events = new Set<(event: Record<string, unknown>) => void>()
let state: HomesState = {
  status: 'loading',
  data: null,
  players: {},
  pets: [],
  chat: [],
  people: [],
  selectedPet: null,
  selectedPlayer: null,
  chatWith: null,
  notice: 'A little care makes a house a home.',
  error: '',
  busy: false,
  editRevision: 0,
  decoration: false,
  draft: [],
  selectedFurniture: null,
  photoMode: false,
  unread: 0,
  petTick: 0,
  mutedChat: false,
}
let generation = 0
let ticket = '',
  expires = 0,
  backend = '',
  house = 'me',
  socket: WebSocket | null = null,
  closed = true,
  retry = 0,
  ping: ReturnType<typeof setInterval> | undefined,
  timeout: ReturnType<typeof setTimeout> | undefined
const pendingActions = new Map<string, string>()
const motion = new Map<
  string,
  { x: number; y: number; direction: string; walking: boolean }
>()
export const movement = (id: string) => motion.get(id)
let undo: Placement[][] = [],
  redo: Placement[][] = []
export const homes = {
  subscribe: (fn: () => void) => {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
  get: () => state,
}
export function patch(value: Partial<HomesState>) {
  state = { ...state, ...value }
  listeners.forEach((fn) => fn())
}
export function scene(c: SceneCommand) {
  commands.forEach((fn) => fn(c))
}
export function onScene(fn: (c: SceneCommand) => void) {
  commands.add(fn)
  return () => {
    commands.delete(fn)
  }
}
export function onLive(fn: (e: Record<string, unknown>) => void) {
  events.add(fn)
  return () => {
    events.delete(fn)
  }
}
async function credential() {
  if (Date.now() / 1000 < expires - 10 && ticket) return
  const demo = new URLSearchParams(window.location.search).get('demo') === '1'
  const response = await fetch('/api/game/session' + (demo ? '?demo=1' : ''), {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
  })
  const data = await response.json()
  if (!response.ok)
    throw new Error(data.detail || 'Sign in to open your house.')
  backend = data.backend
  const exchange = await fetch(backend + '/api/homes/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assertion: data.ticket }),
  })
  const session = await exchange.json()
  if (!exchange.ok)
    throw new Error(
      'The housing service could not validate your account. Retry your game session.',
    )
  ticket = session.token
  expires = session.expires
  if (data.petImportNote) patch({ notice: data.petImportNote })
}
async function request(path: string, body?: object, key?: string, signal?: AbortSignal) {
  await credential()
  const response = await fetch(backend + '/api/homes/' + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: 'Bearer ' + ticket,
      ...(body
        ? {
            'Content-Type': 'application/json',
            'Idempotency-Key': key || crypto.randomUUID(),
          }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal,
  })
  const result = await response.json().catch(() => ({
    detail:
      'The housing service could not complete this request. Please retry.',
  }))
  if (!response.ok) {
    if (response.status === 401) {
      expires = 0
      ticket = ''
    }
    throw Object.assign(
      new Error(
        typeof result.detail === 'string'
          ? result.detail
          : Array.isArray(result)
            ? result.join(' ')
            : JSON.stringify(result),
      ),
      { confirmedFailure: response.status < 500 },
    )
  }
  return result
}
export async function loadHomePlaces(signal?: AbortSignal): Promise<import('../community').CommunityPlace[]> {
  const result = await request('places', undefined, undefined, signal)
  return result.items
}
export async function refresh() {
  const target = house
  const data = (await request(
    'state?house=' + encodeURIComponent(target),
  )) as Boot
  if (target !== house || closed) return
  if (data.world) receiveSharedWorld(data.world)
  patch({
    data,
    pets: data.house.pets,
    petTick: performance.now(),
    ...(!state.decoration ? { draft: data.house.layout } : {}),
  })
}
export async function enter(id = 'me') {
  const version = ++generation
  stop()
  closed = false
  house = id
  retry = 0
  patch({
    status: 'loading',
    error: '',
    selectedPet: null,
    selectedPlayer: null,
    decoration: false,
    photoMode: false,
    players: {},
    chat: [],
  })
  try {
    await refresh()
    if (!closed && version === generation) connect()
  } catch (error) {
    patch({ status: 'error', error: (error as Error).message })
  }
}
async function connect() {
  const attempt = generation
  if (closed) return
  patch({ status: retry ? 'reconnecting' : 'connecting' })
  try {
    await credential()
    if (closed || attempt !== generation) return
    const ws = new WebSocket(backend.replace(/^http/, 'ws') + '/ws/homes')
    socket = ws
    ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', ticket, house }))
    ws.onmessage = (message) => {
      if (ws !== socket) return
      const e = JSON.parse(message.data)
      if (e.type === 'ready') {
        retry = 0
        house = e.owner
        patch({
          status: 'online',
          players: e.players,
          pets: e.house.pets,
          petTick: performance.now(),
          chat: e.messages,
          data: state.data ? { ...state.data, house: e.house } : null,
          notice: 'Welcome to ' + e.house.name + '!',
          error: '',
        })
        ping = setInterval(() => live({ type: 'ping' }), 10000)
      } else if (e.type === 'player.join')
        patch({
          players: {
            ...state.players,
            [e.player.id]: {
              person: e.player,
              x: e.x,
              y: e.y,
              direction: e.direction,
              walking: false,
            },
          },
          notice: e.player.name + ' arrived.',
        })
      else if (e.type === 'player.identity' && state.players[e.person.id])
        patch({
          players: {
            ...state.players,
            [e.person.id]: { ...state.players[e.person.id], person: e.person },
          },
        })
      else if (e.type === 'player.leave') {
        const players = { ...state.players }
        delete players[e.id]
        patch({ players })
      } else if (e.type === 'player.move')
        motion.set(e.id, {
          x: e.x,
          y: e.y,
          direction: e.direction,
          walking: e.walking,
        })
      else if (e.type === 'pets.tick')
        patch({ pets: e.pets, petTick: performance.now() })
      else if (e.type === 'pet.updated') {
        patch({ pets: state.pets.map((p) => (p.id === e.pet.id ? e.pet : p)) })
        void refresh().catch(() => {})
      } else if (e.type === 'player.chat')
        patch({
          chat: [
            ...state.chat,
            { id: e.id, sender: e.player, text: e.text, at: e.at },
          ].slice(-80),
          unread: state.unread + 1,
        })
      else if (e.type === 'house.changed') {
        void refresh().catch((error) => patch({ error: error.message }))
      } else if (e.type === 'kicked' || e.type === 'access-changed') {
        if (e.owner === state.data?.house.id) {
          stop()
          patch({
            status: 'error',
            error: 'This home is no longer available to you.',
          })
        }
      } else if (e.type === 'error') patch({ error: e.text })
      else if (e.type === 'notification' || e.type === 'private-message') {
        patch({ notice: e.text })
        void refresh().catch(() => {})
      }
      if (e.type === 'pets.tick' && e.world) receiveSharedWorld(e.world)
      if (e.type === 'pets.tick' && e.world && state.data) patch({ data: { ...state.data, world: e.world } })
      if (e.type === 'pet.updated' && e.actor === state.data?.player.id) void refresh().catch(() => {})
      events.forEach((fn) => fn(e))
    }
    ws.onclose = (event) => {
      if (closed || ws !== socket) return
      if (ping) clearInterval(ping)
      if (event.code === 4410) {
        closed = true
        patch({
          status: 'error',
          error:
            'This account opened a game in another window. Reconnect here to continue in this window.',
        })
        return
      }
      if (event.code === 4403) {
        closed = true
        patch({
          status: 'error',
          error:
            'This home is not available. Return to your own home or ask the owner for access.',
        })
        return
      }
      if (ping) clearInterval(ping)
      if (closed || ws !== socket) return
      expires = 0
      ticket = ''
      patch({ status: 'reconnecting' })
      timeout = setTimeout(
        () => {
          retry++
          void connect()
        },
        Math.min(10000, 1000 * 2 ** Math.min(retry, 3)),
      )
    }
    ws.onerror = () =>
      patch({
        error:
          'The live room is unavailable. Check that the housing service is running.',
      })
  } catch (error) {
    patch({ status: 'error', error: (error as Error).message })
  }
}
export function stop() {
  motion.clear()
  closed = true
  if (timeout) clearTimeout(timeout)
  if (ping) clearInterval(ping)
  if (socket) {
    socket.onclose = null
    socket.close()
    socket = null
  }
}
export function live(event: object) {
  if (socket?.readyState === WebSocket.OPEN && state.status === 'online')
    socket.send(JSON.stringify(event))
}
export async function act(body: Record<string, unknown>) {
  if (state.busy) return
  patch({ busy: true, error: '' })
  try {
    const payload = { house: state.data?.house.id, ...body },
      signature = JSON.stringify(payload)
    const key = pendingActions.get(signature) || crypto.randomUUID()
    pendingActions.set(signature, key)
    const result = await request('action', payload, key)
    pendingActions.delete(signature)
    if (body.type === 'claim') events.forEach((fn) => fn({ type: 'reward' }))
    if (result.visit) await enter(result.visit)
    else await refresh()
    return result
  } catch (error) {
    patch({ error: (error as Error).message })
    throw error
  } finally {
    patch({ busy: false })
  }
}
export function action(body: Record<string, unknown>) {
  void act(body).catch(() => {})
}
export async function searchPeople(q: string) {
  try {
    const data = await request('people?q=' + encodeURIComponent(q))
    patch({ people: data.items })
  } catch (error) {
    patch({ error: (error as Error).message })
  }
}
export function selectPet(id: string) {
  patch({ selectedPet: id, selectedPlayer: null })
  scene({ type: 'focus-pet', id })
  live({ type: 'pet.interact', pet: id, action: 'meet' })
}
export function editStart() {
  if (!state.data?.house.canDecorate) return
  undo = []
  redo = []
  patch({
    decoration: true,
    editRevision: state.data.house.revision,
    draft: structuredClone(state.data.house.layout),
    selectedFurniture: null,
  })
  action({ type: 'fact', target: 'decorate' })
}
export function edit(layout: Placement[]) {
  undo.push(structuredClone(state.draft))
  redo = []
  patch({ draft: layout })
}
export function history(direction: 'undo' | 'redo') {
  const from = direction === 'undo' ? undo : redo,
    to = direction === 'undo' ? redo : undo
  if (!from.length) return
  to.push(structuredClone(state.draft))
  patch({ draft: from.pop()! })
}
export function editCancel() {
  patch({
    decoration: false,
    selectedFurniture: null,
    draft: state.data?.house.layout || [],
  })
  scene({ type: 'cancel' })
}
export async function editSave() {
  if (!state.data) return
  try {
    await act({
      type: 'layout',
      layout: state.draft,
      revision: state.editRevision,
    })
    patch({ decoration: false, selectedFurniture: null })
  } catch {
    /* Keep the unsaved draft visible; user can reload or retry. */
  }
}
