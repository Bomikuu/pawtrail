import manifest from './uv-manifest.json'

/** Metadata-only identity lookup. Storage/portrait code must not load Three.js. */
export function canonicalSkinId(id: string, kind: 'player' | 'cat' = 'player') {
  const value = (manifest.aliases as Record<string,string>)[id] ?? id
  return Object.hasOwn(manifest.entries, value) ? value : kind === 'cat' ? 'orange-tabby' : 'rescuer'
}
