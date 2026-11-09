import type { CAT_EMOTES } from '../immersion-data'
type CatSound = typeof CAT_EMOTES[number]
/** Existing original soundboard recordings; no new audio generation needed. */
export function catActionSample(action: string): CatSound | undefined {
  return ({
    sad: 'crying', cry: 'crying', crying: 'crying', angry: 'angry',
    happy: 'happy', cheer: 'excited', surprised: 'surprised', laugh: 'laughing', laughing: 'laughing',
    pet: 'loving', petted: 'loving', groom: 'loving', knead: 'relaxed',
    sleep: 'sleepy', rest: 'sleepy', sleepy: 'sleepy', tired: 'sleepy',
    play: 'silly', roll_yarn: 'silly', jump: 'excited', pounce: 'excited',
    chase_tail: 'excited', tail_wag: 'relaxed', sniff: 'suspicious', shake: 'silly', fly: 'relaxed',
  } as Record<string, CatSound>)[action]
}
