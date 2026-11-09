export const CAT_MEMES = [
  {
    id: 'cat-laugh',
    label: 'Cat laugh',
    sound: 'https://www.myinstants.com/media/sounds/cat-laugh-meme-1.mp3',
    gif: 'https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyYXVma2cxamxxdTJkMHp0dHY5anFuZWx5d3V1OTRmcDUwYnRlMzg2aCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2g6sCTsSoVuSfSxK4W/200w.gif',
    source: 'https://www.myinstants.com/en/search/?name=meme%20cat',
    provider: 'GIPHY',
  },
  {
    id: 'mu-hehe',
    label: 'Mu hehe cat',
    sound: 'https://www.myinstants.com/media/sounds/mu-hehehe-cat-meme.mp3',
    gif: 'https://media.tenor.com/7eUXcwpTijAAAAAM/muhehe-cat-muhehe.gif',
    source:
      'https://www.myinstants.com/en/search/?name=Mu%20hehehe%20cat%20meme',
    provider: 'Tenor',
  },
  {
    id: 'oiia-oiia',
    label: 'Oiia oiia',
    sound: 'https://www.myinstants.com/media/sounds/oiia-oiia-sound.mp3',
    gif: 'https://media.tenor.com/sbfBfp3FeY8AAAAj/oia-uia.gif',
    source: 'https://www.myinstants.com/en/search/?name=oiia%20oiia%20Sound',
    provider: 'Tenor',
  },
  {
    id: 'huh-cat',
    label: 'Huh cat',
    sound: 'https://www.myinstants.com/media/sounds/huh-cat-meme.mp3',
    gif: 'https://media.tenor.com/YpVqLrEIa7IAAAAj/huh-cat.gif',
    source: 'https://www.myinstants.com/en/search/?name=huh%20cat',
    provider: 'Tenor',
  },
  {
    id: 'happy-cat',
    label: 'Happy cat',
    sound:
      'https://www.myinstants.com/media/sounds/happy-happy-happy-cat-meme.mp3',
    gif: 'https://media.tenor.com/DpJdyKQKgYkAAAAj/cat-jump.gif',
    source:
      'https://www.myinstants.com/en/search/?name=happy%20happy%20happy%20cat',
    provider: 'Tenor',
  },
  {
    id: 'yapapa',
    label: 'Yapapa',
    sound: 'https://www.myinstants.com/media/sounds/yapapa-cat_UwLkrYZ.mp3',
    gif: 'https://media.tenor.com/xXNzEkd7BYYAAAAi/yapapa-cat.gif',
    source: 'https://www.myinstants.com/en/search/?name=yapapa%20cat',
    provider: 'Tenor',
  },
  {
    id: 'boing-cat',
    label: 'Boing cat',
    sound: 'https://www.myinstants.com/media/sounds/boing-boing-cat.mp3',
    gif: 'https://media.tenor.com/UpI_GWlKnF0AAAAi/nhon-nhon-cat.gif',
    source: 'https://www.myinstants.com/en/search/?name=boing%20boing%20cat',
    provider: 'Tenor',
  },
  {
    id: 'banana-cat',
    label: 'Banana cat',
    sound: 'https://www.myinstants.com/media/sounds/cry-banana-cat.mp3',
    gif: 'https://media.tenor.com/UNaQFutfOF0AAAAi/banana-crying-cat.gif',
    source: 'https://www.myinstants.com/en/search/?name=banana%20cat',
    provider: 'Tenor',
  },
  {
    id: 'scuba-cat',
    label: 'Scuba cat',
    sound: 'https://www.myinstants.com/media/sounds/scubbaaa.mp3',
    gif: 'https://media.tenor.com/OoG1CF2T3QIAAAAi/kucing-scuba-scuba-cat.gif',
    source: 'https://www.myinstants.com/en/search/?name=scubbaaa',
    provider: 'Tenor',
  },
] as const

export type CatMeme = (typeof CAT_MEMES)[number]
export type CatMemeId = CatMeme['id']
export const MEME_EVENT = 'pawtrail:cat-meme'
export const MEME_ANCHOR_EVENT = 'pawtrail:cat-meme-anchor'
export const MEME_LIFETIME = 12000
export const MEME_WHEEL_COOLDOWN = 5000
export const MEME_COOLDOWN = 15000
export type MemeRequest = {
  id: CatMemeId
  actorId: string
  local: boolean
  distance: number
}
export type MemeAnchor = {
  actorId: string
  x: number
  y: number
  visible: boolean
  viewportTop: number
}

export const catMeme = (id: string) => CAT_MEMES.find((meme) => meme.id === id)

export function showCatMeme(
  id: string,
  actorId = 'me',
  local = true,
  distance = 0,
) {
  const meme = catMeme(id)
  if (!meme) return
  window.dispatchEvent(
    new CustomEvent<MemeRequest>(MEME_EVENT, {
      detail: { id: meme.id, actorId, local, distance },
    }),
  )
}
