export const comparisonActions = [
  { value: 'idle', label: 'Idle' },
  { value: 'walk', label: 'Walk' },
  { value: 'feed', label: 'Feed / eat' },
  { value: 'pet', label: 'Pet' },
  { value: 'play', label: 'Play / yarn ball' },
  { value: 'sit', label: 'Sit' },
  { value: 'sleep', label: 'Sleep · Zzz' },
  { value: 'sad', label: 'Sad / cry with rain' },
  { value: 'happy', label: 'Happy jump & confetti' },
  { value: 'laugh', label: 'Laugh' },
  { value: 'sick', label: 'Sick' },
  { value: 'ride', label: 'Car rooftop ride' },
  { value: 'angry', label: 'Angry' },
  { value: 'surprised', label: 'Surprised' },
  { value: 'dance', label: 'Disco dance' },
  { value: 'float', label: 'Float on a cloud' },
  { value: 'tired', label: 'Tired' },
] as const

export const comparisonDirections = [
  { value: 'down', label: 'Front' },
  { value: 'down_left', label: 'Front left' },
  { value: 'left', label: 'Left' },
  { value: 'up_left', label: 'Back left' },
  { value: 'up', label: 'Back' },
  { value: 'up_right', label: 'Back right' },
  { value: 'right', label: 'Right' },
  { value: 'down_right', label: 'Front right' },
] as const

export const previewActions = [
  ...comparisonActions,
  {value:'run',label:'Run'},
  {value:'power_run',label:'Super Saiyan run'},
  {value:'rescue_dash',label:'Rescue Dash'},
  {value:'gentle_approach',label:'Gentle Approach'},
  { value: 'jetpack', label: 'Jetpack · take off & hover' },
  { value: 'jetpack_takeoff', label: 'Jetpack takeoff' },
  { value: 'jetpack_land', label: 'Jetpack landing' },
  { value: 'power_up', label: 'Power up · energy aura' },
  { value: 'water', label: 'Water / drink' },
  { value: 'pick_up', label: 'Pick up' },
  { value: 'clean', label: 'Clean' },
  { value: 'wave', label: 'Wave' },
  { value: 'clap', label: 'Clap' },
  { value: 'cheer', label: 'Cheer' },
  { value: 'hold_item', label: 'Hold supplies' },
  { value: 'give_gift', label: 'Give a gift' },
  { value: 'inspect', label: 'Inspect' },
  { value: 'groom', label: 'Groom' },
  { value: 'stretch', label: 'Stretch' },
  { value: 'scratch', label: 'Scratch' },
  { value: 'climb', label: 'Climb' },
  { value: 'lie_down', label: 'Lie down' },
  { value: 'roll_yarn', label: 'Roll with yarn' },
  { value: 'jump', label: 'Jump · takeoff & landing' },
  { value: 'pounce', label: 'Playful pounce' },
  { value: 'knead', label: 'Knead · making biscuits' },
  { value: 'chase_tail', label: 'Chase tail' },
  { value: 'tail_wag', label: 'Tail swish' },
  { value: 'sniff', label: 'Sniff & investigate' },
  { value: 'shake', label: 'Shake fur' },
  { value: 'fly', label: 'Wing flutter & hover' },
] as const

export type ComparisonAction = (typeof previewActions)[number]['value']
export type ComparisonDirection = (typeof comparisonDirections)[number]['value']
export type ComparisonState = {
  mode: 'legacy' | 'skin' | 'creator' | 'cat-creator'
  appearance: string
  presentationAction: string
  portraitAction: string
  portraitPose: import('../actor-rig/photo-portrait-catalog').PhotoPortraitPose
  action: ComparisonAction
  direction: ComparisonDirection
  timing: 'synchronized' | 'native'
  paused: boolean
  zoom: number
  zoomLimit: number
  catDetail: boolean
  actorDetail: boolean
  inputX: number
  inputY: number
  restart: number
  status: 'loading' | 'ready' | 'error'
  load: number
  error: string
}

let state: ComparisonState = {
  mode: 'legacy', appearance: '',
  presentationAction:'walk', portraitAction:'idle', portraitPose:'three-quarter-left', action: 'walk', direction: 'down', timing: 'synchronized', paused: false,
  zoom: 3, zoomLimit: 4, catDetail: false, actorDetail: false, inputX: 0, inputY: 0, restart: 0, status: 'loading', load: 0, error: '',
}
const listeners = new Set<() => void>()
export const faceInspection = (value: ComparisonState) => value.mode==='creator'?value.actorDetail:value.mode==='cat-creator'?value.catDetail:false
export const actorComparison = {
  getSnapshot: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
  patch(patch: Partial<ComparisonState>) {
    state = { ...state, ...patch }
    for (const listener of listeners) listener()
  },
}
export function toggleFaceInspection(kind:'cat'|'actor') {
  const field=kind==='cat'?'catDetail':'actorDetail',active=state[field]
  actorComparison.patch({[field]:!active,zoom:active?3:8,...(!active?{direction:'down' as ComparisonDirection,inputX:0,inputY:0}:{})})
}
