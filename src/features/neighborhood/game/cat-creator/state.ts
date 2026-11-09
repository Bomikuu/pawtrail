import { defaultCatAppearance, catAppearanceSignature, readCatAppearance, type CatAppearance, type SavedCat } from './appearance'
import { catOptions, catBreedColors, type CatBreed } from '../actor-rig/cat-appearance'
import palette from '../actor-rig/palette.json'
import { actorPreviews } from '../runtime/actor-previews'

const KEY = 'pawtrail:cat-draft:v1'
export const catTemplates = [{ id: 'orange_tabby', name: 'Orange tabby', appearance: defaultCatAppearance() },
  ...actorPreviews.filter(row => row.kind === 'orange-tabby').map(row => ({
    id: row.id, name: row.name, appearance: { ...defaultCatAppearance(row.cat), colors: { ...defaultCatAppearance(row.cat).colors, ...row.colors }, face: row.face ?? defaultCatAppearance(row.cat).face } as CatAppearance,
  }))]
const signature = (name: string, appearance: CatAppearance) => name.trim() + '|' + catAppearanceSignature(appearance)
type Draft = { name: string; appearance: CatAppearance; selected: SavedCat | null; baseline: string; renderRevision: number; error: string }
const initial = defaultCatAppearance()
let state: Draft = { name: 'My cat', appearance: initial, selected: null, baseline: signature('My cat', initial), renderRevision: 0, error: '' }
if (typeof window !== 'undefined') try {
  const draft = JSON.parse(localStorage.getItem(KEY) ?? 'null'), appearance = readCatAppearance(draft?.appearance)
  if (appearance && typeof draft.name === 'string' && draft.name.length <= 64) state = { ...state, name: draft.name, appearance }
} catch { /* Explicit save reports storage failures. */ }
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | undefined
function patch(value: Partial<Draft>) {
  state = { ...state, ...value }; for (const listener of listeners) listener()
  clearTimeout(timer); timer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify({ name: state.name, appearance: state.appearance })) } catch {} }, 250)
}
export const catCreator = {
  getSnapshot: () => state,
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
  dirty: () => signature(state.name, state.appearance) !== state.baseline,
  name(name: string) { patch({ name, error: '' }) },
  edit(value: Partial<CatAppearance>) { patch({ appearance: { ...state.appearance, ...value }, renderRevision: state.renderRevision + 1, error: '' }) },
  breed(breed: CatBreed) {
    const { hat, shoes, wings, collar, tailMotion, bodySize, faceMarking } = state.appearance.cat
    const defaults = defaultCatAppearance({ breed })
    this.edit({ cat: catOptions({ breed, hat, shoes, wings, collar, tailMotion, bodySize, faceMarking }), colors: { ...palette, ...catBreedColors(breed) }, face: { ...state.appearance.face, leftEye: defaults.face.leftEye, rightEye: defaults.face.rightEye } })
  },
  template(id: string) { const row = catTemplates.find(row => row.id === id); if (row) patch({ name: row.name, appearance: row.appearance, selected: null, baseline: signature(row.name, row.appearance), renderRevision: state.renderRevision + 1, error: '' }) },
  load(row: SavedCat) { patch({ name: row.name, appearance: row.appearance, selected: row, baseline: signature(row.name, row.appearance), renderRevision: state.renderRevision + 1, error: '' }) },
  saved(row: SavedCat) { patch({ selected: row, baseline: signature(row.name, row.appearance), error: '' }) },
  error(error: string) { patch({ error }) },
  import(name: string, appearance: CatAppearance) { patch({ name, appearance, selected: null, renderRevision: state.renderRevision + 1, error: '' }) },
}
let capture: (() => string) | undefined
export const catPreviewCapture = { set(fn: (() => string) | undefined) { capture = fn }, take() { return capture?.() } }
