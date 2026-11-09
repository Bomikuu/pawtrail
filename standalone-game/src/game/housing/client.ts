import {syncRoomAbilities,cancelLocalAbility,abilityStore} from '../abilities/state';
import { receiveSharedWorld } from "../immersion-data";
import { memeCooldowns } from '../meme-cooldowns'
import type { Boot, Chat, HomesState, Placement, SceneCommand } from "./types";
const listeners = new Set<() => void>(),
  commands = new Set<(c: SceneCommand) => void>(),
  events = new Set<(event: Record<string, unknown>) => void>();
let state: HomesState = {
  status: "loading",
  data: null,
  players: {},
  pets: [],
  chat: [],
  people: [],
  selectedPet: null,
  selectedPlayer: null,
  chatWith: null,
  notice: "A little care makes a house a home.",
  error: "",
  busy: false,
  zoom: 2,
  editRevision: 0,
  editConflict: false,
  decoration: false,
  draft: [],
  selectedFurniture: null,
  photoMode: false,
  unread: 0,
  petTick: 0,
  mutedChat: false,
};
let generation = 0;
let ticket = "",
  expires = 0,
  backend = "",
  house = "me",
  entry: "door" | "stairs" | "reset" = "door",
  socket: WebSocket | null = null,
  closed = true,
  retry = 0,
  ping: ReturnType<typeof setInterval> | undefined,
  timeout: ReturnType<typeof setTimeout> | undefined;
const pendingActions = new Map<string, string>();
const motion = new Map<
  string,
  { x: number; y: number; direction: string; walking: boolean; environment?: { tool: string; wetUntil: number } }
>();
export const movement = (id: string) => motion.get(id);
let undo: Placement[][] = [],
  redo: Placement[][] = [];
export const homes = {
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  get: () => state,
};
export function patch(value: Partial<HomesState>) {
  state = { ...state, ...value };
  listeners.forEach((fn) => fn());
}
export function scene(c: SceneCommand) {
  commands.forEach((fn) => fn(c));
}
export function onScene(fn: (c: SceneCommand) => void) {
  commands.add(fn);
  return () => {
    commands.delete(fn);
  };
}
export function onLive(fn: (e: Record<string, unknown>) => void) {
  events.add(fn);
  return () => {
    events.delete(fn);
  };
}
export type HousingFailure =
  "auth" | "forbidden" | "missing" | "unavailable" | "request";
export class HousingError extends Error {
  readonly kind: HousingFailure;
  readonly confirmedFailure: boolean;
  constructor(
    message: string,
    readonly status = 0,
    kind?: HousingFailure,
  ) {
    super(message);
    this.name = "HousingError";
    this.kind =
      kind ??
      (status === 401
        ? "auth"
        : status === 403
          ? "forbidden"
          : status === 404
            ? "missing"
            : status === 0 || status >= 500
              ? "unavailable"
              : "request");
    this.confirmedFailure = status > 0 && status < 500;
  }
}
export function housingFailure(error: unknown): HousingFailure {
  return error instanceof HousingError ? error.kind : "unavailable";
}
async function housingFetch(url: string, options: RequestInit = {}) {
  try {
    return await fetch(url, {
      ...options,
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(8000)])
        : AbortSignal.timeout(8000),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new HousingError(
      "The housing service is unavailable. Check your connection and try again.",
    );
  }
}
async function credential(signal?: AbortSignal) {
  if (Date.now() / 1000 < expires - 10 && ticket) return;
  const response = await housingFetch("/api/game/session", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new HousingError(
      response.status === 401
        ? "Sign in to enter this world. Your destination will be kept."
        : "Your game session could not be opened. Please try again.",
      response.status,
    );
  if (!data?.backend || !data?.ticket)
    throw new HousingError(
      "Your game session was incomplete. Please try again.",
    );
  backend = data.backend;
  const exchange = await housingFetch(backend + "/api/homes/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assertion: data.ticket }),
    signal,
  });
  const session = await exchange.json().catch(() => null);
  if (!exchange.ok)
    throw new HousingError(
      "The housing service could not validate your session. Please try again.",
      exchange.status,
      "unavailable",
    );
  if (!session?.token || !session?.expires)
    throw new HousingError(
      "The housing service returned an incomplete session.",
    );
  ticket = session.token;
  expires = session.expires;
  if (data.petImportNote) patch({ notice: data.petImportNote });
}
async function request(
  path: string,
  body?: object,
  key?: string,
  signal?: AbortSignal,
) {
  await credential(signal);
  const response = await housingFetch(backend + "/api/homes/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + ticket,
      ...(body
        ? {
            "Content-Type": "application/json",
            "Idempotency-Key": key || crypto.randomUUID(),
          }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal,
  });
  const result = await response.json().catch(() => ({
    detail:
      "The housing service could not complete this request. Please retry.",
  }));
  if (!response.ok) {
    if (response.status === 401) {
      expires = 0;
      ticket = "";
    }
    throw new HousingError(
      typeof result?.detail === "string"
        ? result.detail
        : "The housing request could not be completed.",
      response.status,
    );
  }
  return result;
}
export async function loadHomePlaces(
  signal?: AbortSignal,
): Promise<import("../community").CommunityPlace[]> {
  const result = await request("places", undefined, undefined, signal);
  return result.items;
}
export async function mapRequest<T = unknown>(
  path: string,
  body?: object | FormData,
  signal?: AbortSignal,
): Promise<T> {
  await credential(signal);
  const multipart = body instanceof FormData;
  const response = await housingFetch(backend + "/api/v1/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + ticket,
      ...(body && !multipart ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? (multipart ? body : JSON.stringify(body)) : undefined,
    signal,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new HousingError(
      typeof result?.detail === "string"
        ? result.detail
        : typeof result?.[0] === "string"
          ? result[0]
          : response.status === 401
            ? "Sign in or reconnect to continue."
            : "The community service could not complete this request.",
      response.status,
    );
  return result as T;
}
export async function downloadMapEvidence(id: string, name: string) {
  await credential();
  const response = await fetch(
    backend + "/api/v1/incidents/evidence/" + encodeURIComponent(id) + "/",
    { headers: { Authorization: "Bearer " + ticket } },
  );
  if (!response.ok)
    throw new Error("This evidence is not available to this account.");
  const url = URL.createObjectURL(await response.blob()),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function refresh() {
  const target = house,
    token = generation;
  const data = (await request(
    "state?house=" + encodeURIComponent(target) + "&entry=" + entry,
  )) as Boot;
  data.clientReceivedAt = Date.now()
  if (target !== house || closed || token !== generation) return;
  if (data.world) receiveSharedWorld(data.world);
  patch({
    data,
    pets: data.house.pets,
    petTick: performance.now(),
    ...(!state.decoration ? { draft: data.house.activeLayout } : {}),
  });
}
export async function enter(
  id = "me",
  arrival: "door" | "stairs" | "reset" = "door",
) {
  if (state.decoration) {
    patch({ error: "Save or discard your draft before leaving this space." });
    return;
  }
  const version = ++generation;
  stop();
  closed = false;
  house = id;
  entry = arrival;
  retry = 0;
  patch({
    status: "loading",
    error: "",
    failure: undefined,
    selectedPet: null,
    selectedPlayer: null,
    decoration: false,
    photoMode: false,
    players: {},
    pets: [],
    data: null,
    chat: [],
  });
  try {
    await refresh();
    if (!closed && version === generation) connect();
  } catch (error) {
    if (!closed && version === generation)
      patch({
        status: "error",
        error: (error as Error).message,
        failure: housingFailure(error),
      });
  }
}
async function connect() {
  const attempt = generation;
  if (closed) return;
  patch({ status: retry ? "reconnecting" : "connecting" });
  try {
    await credential();
    if (closed || attempt !== generation) return;
    const ws = new WebSocket(backend.replace(/^http/, "ws") + "/ws/homes");
    socket = ws;
    ws.onopen = () =>
      ws.send(JSON.stringify({ type: "auth", ticket, house, entry }));
    ws.onmessage = (message) => {
      if (ws !== socket) return;
      const e = JSON.parse(message.data);
      if (e.type === "ready") {
        memeCooldowns.sync(e.memeCooldowns)
        syncRoomAbilities(e.abilities)
        retry = 0;
        house = e.owner;
        entry = "door";
        patch({
          status: "online",
          players: e.players,
          pets: e.house.pets,
          petTick: performance.now(),
          chat: e.messages,
          data: state.data
            ? {
                ...state.data,
                environment: e.environment ?? state.data.environment,
                house: { ...e.house, spawn: [e.position.x, e.position.y] },
              }
            : null,
          notice: "Welcome to " + e.house.name + "!",
          error: "",
        });
        scene({ type: "spawn", x: e.position.x, y: e.position.y });
        ping = setInterval(() => live({ type: "ping" }), 10000);
      } else if (e.type === "player.join")
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
          notice: e.player.name + " arrived.",
        });
      else if (e.type === "player.identity" && state.players[e.person.id]) {
        if(e.person.id===state.data?.player.id&&e.person.appearance!==state.data.player.appearance)cancelLocalAbility();
        if(typeof e.person.appearance === "string" && e.person.appearance.startsWith("custom_")) void import("../creator/library").then(m=>m.resolveSavedCharacter(e.person.appearance));
        patch({
          players: {
            ...state.players,
            [e.person.id]: { ...state.players[e.person.id], person: e.person },
          },
        });
      } else if (e.type === "player.leave") {
        const players = { ...state.players };
        delete players[e.id];
        patch({ players });
      } else if (e.type === "player.move")
        motion.set(e.id, {
          x: e.x,
          y: e.y,
          direction: e.direction,
          walking: e.walking,
          environment: e.environment,
        });
      else if (e.type === 'terrain.changed' && state.data && e.room === state.data.house.roomId) {
        patch({ data: { ...state.data, house: { ...state.data.house, objectStates: { ...state.data.house.objectStates, ...e.cells } } } })
      }
      else if (e.type === "pets.tick") {
        patch({
          pets: e.pets,
          petTick: performance.now(),
          data: state.data
            ? {
                ...state.data,
                house: {
                  ...state.data.house,
                  objectStates: e.objectStates ?? state.data.house.objectStates,
                },
              }
            : null,
        });
        for (const expired of e.expired ?? [])
          events.forEach((fn) =>
            fn({
              type: "interaction.released",
              id: expired.player_id,
              actionId: expired.action_id,
            }),
          );
      } else if (e.type === "interaction.completed" && state.data) {
        patch({
          data: {
            ...state.data,
            player: {
              ...state.data.player,
              supplies: e.supplies ?? state.data.player.supplies,
            },
            house: {
              ...state.data.house,
              objectStates: {
                ...state.data.house.objectStates,
                [e.target]: e.objectState,
              },
            },
          },
        });
      } else if (e.type === "pet.updated") {
        patch({ pets: state.pets.map((p) => (p.id === e.pet.id ? e.pet : p)) });
        void refresh().catch(() => {});
      } else if (e.type === "player.chat")
        patch({
          chat: [
            ...state.chat,
            { id: e.id, sender: e.player, text: e.text, at: e.at },
          ].slice(-80),
          unread: state.unread + 1,
        });
      else if (e.type === "house.changed") {
        void refresh().catch((error) => patch({ error: error.message }));
      } else if (e.type === "kicked" || e.type === "access-changed") {
        if (e.owner === state.data?.house.id) {
          stop();
          patch({
            status: "error",
            error: "This home is no longer available to you.",
            failure: "forbidden",
          });
        }
      } else if (e.type === 'player.meme-cooldown') memeCooldowns.sync(e.cooldowns)
      else if (e.type === "error") patch({ error: e.text });
      else if (e.type === "notification" || e.type === "private-message") {
        patch({ notice: e.text });
        void refresh().catch(() => {});
      }
      if (e.type === "pets.tick" && e.world) receiveSharedWorld(e.world);
      if (e.type === "pets.tick" && e.world && state.data)
        patch({ data: { ...state.data, world: e.world } });
      if (e.type === "pet.updated" && e.actor === state.data?.player.id)
        void refresh().catch(() => {});
      if(e.id===state.data?.player.id&&e.abilities)syncRoomAbilities(e.abilities,e.text??'');
      events.forEach((fn) => fn(e));
    };
    ws.onclose = (event) => {
      if (closed || ws !== socket) return;
      if(abilityStore.getSnapshot().scope==='room')cancelLocalAbility();
      if (ping) clearInterval(ping);
      if (event.code === 4410) {
        closed = true;
        patch({
          status: "error",
          error:
            "This account opened a game in another window. Reconnect here to continue in this window.",
        });
        return;
      }
      if (event.code === 4403) {
        closed = true;
        patch({
          status: "error",
          error:
            "This home is not available. Return to your own home or ask the owner for access.",
          failure: "forbidden",
        });
        return;
      }
      if (ping) clearInterval(ping);
      if (closed || ws !== socket) return;
      expires = 0;
      ticket = "";
      patch({ status: "reconnecting" });
      timeout = setTimeout(
        () => {
          retry++;
          void connect();
        },
        Math.min(10000, 1000 * 2 ** Math.min(retry, 3)),
      );
    };
    ws.onerror = () =>
      patch({
        error: "The live room is unavailable. We are trying to reconnect.",
      });
  } catch (error) {
    if (!closed && attempt === generation)
      patch({
        status: "error",
        error: (error as Error).message,
        failure: housingFailure(error),
      });
  }
}
export const retryEntry = () => enter(house, entry);
export const entryReturnTo = () =>
  (window.location.pathname === "/" ? "/" : "/play") +
  "?home=" +
  encodeURIComponent(house);
export function stop() {
  motion.clear();
  closed = true;
  if (timeout) clearTimeout(timeout);
  if (ping) clearInterval(ping);
  if (socket) {
    socket.onclose = null;
    socket.close();
    socket = null;
  }
}
export function live(event: object) {
  if (socket?.readyState === WebSocket.OPEN && state.status === "online")
    socket.send(
      JSON.stringify(
        (event as { type?: string }).type === "pet.interact"
          ? { actionId: crypto.randomUUID(), ...event }
          : event,
      ),
    );
}
export async function act(body: Record<string, unknown>) {
  if (state.busy) return;
  patch({ busy: true, error: "" });
  try {
    const payload = { house: state.data?.house.id, ...body },
      signature = JSON.stringify(payload);
    const key = pendingActions.get(signature) || crypto.randomUUID();
    pendingActions.set(signature, key);
    const result = await request("action", payload, key);
    pendingActions.delete(signature);
    if (body.type === "claim") events.forEach((fn) => fn({ type: "reward" }));
    if (result.visit) await enter(result.visit, result.entry || "door");
    else await refresh();
    if (result.notice) patch({ notice: result.notice });
    return result;
  } catch (error) {
    patch({ error: (error as Error).message });
    throw error;
  } finally {
    patch({ busy: false });
  }
}
export function action(body: Record<string, unknown>) {
  void act(body).catch(() => {});
}
export async function searchPeople(q: string) {
  try {
    const data = await request("people?q=" + encodeURIComponent(q));
    patch({ people: data.items });
  } catch (error) {
    patch({ error: (error as Error).message });
  }
}
export function selectPet(id: string) {
  patch({ selectedPet: id, selectedPlayer: null });
  scene({ type: "focus-pet", id });
  live({ type: "pet.interact", pet: id, action: "meet" });
}
export function editStart() {
  if (!state.data?.house.canDecorate) return;
  undo = [];
  redo = [];
  patch({
    decoration: true,
    editRevision: state.data.house.activeRevision,
    editConflict: false,
    draft: structuredClone(state.data.house.activeLayout),
    selectedFurniture: null,
  });
  action({ type: "fact", target: "decorate" });
}
export function edit(layout: Placement[]) {
  undo.push(structuredClone(state.draft));
  redo = [];
  patch({ draft: layout });
}
export function history(direction: "undo" | "redo") {
  const from = direction === "undo" ? undo : redo,
    to = direction === "undo" ? redo : undo;
  if (!from.length) return;
  to.push(structuredClone(state.draft));
  patch({ draft: from.pop()! });
}
export function editCancel() {
  patch({
    decoration: false,
    selectedFurniture: null,
    draft: state.data?.house.activeLayout || [],
    editConflict: false,
  });
  scene({ type: "cancel" });
}
export async function editSave() {
  if (!state.data || state.busy || state.status !== "online") return;
  try {
    await act({
      type: state.data.house.zone === "yard" ? "yard-layout" : "layout",
      layout: state.draft,
      zone: state.data.house.zone,
      revision: state.editRevision,
    });
    patch({
      decoration: false,
      selectedFurniture: null,
      notice: "Your " + state.data?.house.zone + " is saved.",
    });
    scene({ type: "cancel" });
  } catch {
    const h = state.data?.house;
    patch({
      editConflict:
        (!!h && state.editRevision !== h.activeRevision) ||
        state.error.includes("changed"),
    });
  }
}

/** Retain the draft, explicitly adopt the current revision, and let the server revalidate every placement. */
export async function reapplyDraft() {
  try {
    await refresh();
  } catch (error) {
    patch({ error: (error as Error).message });
    return;
  }
  const h = state.data?.house;
  if (!h) return;
  patch({
    editRevision: h.activeRevision,
    editConflict: false,
    error: "",
    notice:
      "Your draft is retained. Saving will replace the current layout after the server validates it.",
  });
}
export function travelToPlaces() {
  if (state.decoration) return;
  window.location.assign(
    (window.location.pathname === "/" ? "/" : "/play") +
      "?map=community" +
      (new URLSearchParams(window.location.search).get("demo") === "1"
        ? "&demo=1"
        : ""),
  );
}

export async function companionRequest<T>(
  body?: object,
  room = "me",
  signal?: AbortSignal,
): Promise<T> {
  return request(
    "companions" + (body ? "" : "?room=" + encodeURIComponent(room)),
    body,
    undefined,
    signal,
  );
}

export const housingConnected = () =>
  !closed && socket?.readyState === WebSocket.OPEN;

export async function loadHomeCommunityCounts(signal?: AbortSignal): Promise<{ viewerId: string
  cities: Record<string, number> }> {
  return request('community-counts', undefined, undefined, signal)
}

/** Same authenticated account bridge as homes; appearance payloads are data only. */
export function characterRequest<T>(body?: object, id?: string, signal?: AbortSignal): Promise<T> {
  return request('characters' + (id ? '/' + encodeURIComponent(id) : ''), body, undefined, signal)
}

export function catAppearanceRequest<T>(body?: object, signal?: AbortSignal): Promise<T> {
  return request('cat-appearances', body, undefined, signal)
}
