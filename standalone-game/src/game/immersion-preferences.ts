const defaults = { reducedEffects: false, soundboardVolume: .55, muteOthers: false, emoteEffects: true, weatherSounds: true, audioRange: 180 }
let preferences = { ...defaults }
try { preferences = { ...defaults, ...JSON.parse(localStorage.getItem('pawtrail:immersion:v1') ?? '{}') } } catch {}
preferences.soundboardVolume = Math.max(0, Math.min(1, Number(preferences.soundboardVolume) || 0))
preferences.audioRange = Math.max(80, Math.min(300, Number(preferences.audioRange) || 180))
for (const key of ['reducedEffects','muteOthers','emoteEffects','weatherSounds'] as const) if(typeof preferences[key] !== 'boolean') preferences[key]=defaults[key]
const listeners = new Set<() => void>()
export const immersionPreferences = {
  get: () => preferences,
  subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
  update: (change: Partial<typeof defaults>) => { preferences = { ...preferences, ...change }; try { localStorage.setItem('pawtrail:immersion:v1', JSON.stringify(preferences)) } catch {} listeners.forEach((fn) => fn()) },
}
