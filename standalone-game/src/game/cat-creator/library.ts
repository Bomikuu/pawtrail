import { catAppearanceRequest, housingFailure } from '../housing/client'
import { CAT_LIBRARY_LIMIT, catId, readCatAppearance, type CatAppearance, type SavedCat } from './appearance'

const KEY = 'pawtrail:cats:device:v1'
function parse(value: unknown, scope: SavedCat['scope']): SavedCat | null {
  if (!value || typeof value !== 'object') return null
  const row = value as SavedCat, appearance = readCatAppearance(row.appearance)
  if (!catId(row.id) || !appearance || typeof row.name !== 'string' || !row.name.trim() || row.name.length > 64 || !Number.isInteger(row.revision) || row.revision < 1) return null
  return { id: row.id, name: row.name, appearance, revision: row.revision, scope, updated: typeof row.updated === 'string' ? row.updated : '',
    ...(typeof row.thumbnail === 'string' && row.thumbnail.length < 100000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(row.thumbnail) ? { thumbnail: row.thumbnail } : {}) }
}
function readDevice(): SavedCat[] {
  try { const rows = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(rows) ? rows.slice(0, CAT_LIBRARY_LIMIT).flatMap(value => { const row = parse(value, 'device'); return row ? [row] : [] }) : [] } catch { return [] }
}
type Library = { device: SavedCat[]; account: SavedCat[]; status: 'idle' | 'loading' | 'ready' | 'guest' | 'error'; error: string }
let state: Library = { device: typeof window === 'undefined' ? [] : readDevice(), account: [], status: 'idle', error: '' }
const listeners = new Set<() => void>()
const patch = (value: Partial<Library>) => { state = { ...state, ...value }; for (const listener of listeners) listener() }
export const catLibrary = { getSnapshot: () => state, subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } } }
let loading: Promise<void> | undefined
export function loadCatLibrary() {
  if (loading) return loading
  patch({ status: 'loading', error: '' })
  loading = catAppearanceRequest<{items: unknown[]}>().then(result => {
    if (!Array.isArray(result.items)) throw new Error('The cat library returned an incomplete response.')
    patch({ account: result.items.flatMap(value => { const row = parse(value, 'account'); return row ? [row] : [] }), status: 'ready' })
  }).catch(error => { patch(housingFailure(error) === 'auth' ? { status: 'guest', account: [], error: '' } : { status: 'error', error: error instanceof Error ? error.message : 'Account library unavailable. Device saves remain available.' }) }).finally(() => { loading = undefined })
  return loading
}
export async function saveCat(input: { id?: string; name: string; appearance: CatAppearance; scope: SavedCat['scope']; revision?: number; thumbnail?: string }) {
  const name = input.name.trim(), appearance = readCatAppearance(input.appearance)
  if (!name || name.length > 64 || /[\x00-\x1f]/.test(name)) throw new Error('Use a name of 1–64 characters.')
  if (!appearance) throw new Error('This cat configuration is not supported.')
  const id = input.id ?? 'cat_' + crypto.randomUUID().replaceAll('-', '')
  if (input.scope === 'account') {
    const result = await catAppearanceRequest<{cat: unknown}>({ operation: 'save', id, name, appearance, revision: input.revision, thumbnail: input.thumbnail })
    const row = parse(result.cat, 'account')
    if (!row) throw new Error('The saved cat response was incomplete.')
    patch({ account: [row, ...state.account.filter(item => item.id !== id)] }); return row
  }
  const fresh = readDevice(), existing = fresh.find(row => row.id === id)
  if (!existing && fresh.length >= CAT_LIBRARY_LIMIT) throw new Error('Your device library is full. Remove a cat before creating another.')
  if (existing && existing.revision !== input.revision) throw new Error('This cat changed in another tab. Open it from the library before saving.')
  const row: SavedCat = { id, name, appearance, scope: 'device', revision: (existing?.revision ?? 0) + 1, updated: new Date().toISOString(), thumbnail: input.thumbnail }
  const device = [row, ...fresh.filter(item => item.id !== id)]
  try { localStorage.setItem(KEY, JSON.stringify(device)) } catch { throw new Error('Your browser could not save this cat. Export a backup or free some storage.') }
  patch({ device }); return row
}
export async function deleteCat(row: SavedCat) {
  if (row.scope === 'account') { await catAppearanceRequest({ operation: 'delete', id: row.id }); patch({ account: state.account.filter(item => item.id !== row.id) }); return }
  const device = readDevice().filter(item => item.id !== row.id)
  try { localStorage.setItem(KEY, JSON.stringify(device)) } catch { throw new Error('Your browser could not update the cat library.') }
  patch({ device })
}
if (typeof window !== 'undefined') window.addEventListener('storage', event => { if (event.key === KEY) patch({ device: readDevice() }) })
