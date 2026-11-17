import type { CreatorPreviewModel } from './preview-models'

export type ActorIllustration = {
  name: string
  folder: string
  nativeSize: readonly [number, number]
  compositionSize?: readonly [number, number]
  rendering?: 'smooth'|'pixelated'
  style: string
  motion: string
  variants?: readonly { id: string; label: string; folder: string; motion: string }[]
}

/** Illustration data stays separate from the actor, icon and dialogue collections. */
const rikaIllustration:ActorIllustration={name:'Rika & Peony-7',folder:'/pawtrail-game/actor-studio/illustrations/rika-hoshino/v1/normal',nativeSize:[320,448],compositionSize:[320,448],rendering:'smooth',style:'Refined cel + painterly',motion:'Flowing ponytail · rescue hangar · teal command aura',variants:[{id:'normal',label:'Normal',folder:'/pawtrail-game/actor-studio/illustrations/rika-hoshino/v1/normal',motion:'Pilot and mech · continuous ponytail motion'},{id:'enraged',label:'Enraged',folder:'/pawtrail-game/actor-studio/illustrations/rika-hoshino/v1/enraged',motion:'Command stance · moving teal face energy · flowing ponytail'}]}
export const actorIllustrations: Partial<Record<CreatorPreviewModel, ActorIllustration>> = {
  mira: {
    name:'Mira Adler',folder:'/pawtrail-game/actor-studio/illustrations/mira-adler/v2/normal',
    nativeSize:[320,448],compositionSize:[320,448],rendering:'pixelated',
    style:'Refined cel + painterly',motion:'Stronger flowing curls · quicker 4.2-second sway · visible authored blinking',
    variants:[
      {id:'normal',label:'Normal',folder:'/pawtrail-game/actor-studio/illustrations/mira-adler/v2/normal',motion:'Quiet stance · stronger pinned curls · visible natural blink'},
      {id:'enraged',label:'Attack-ready',folder:'/pawtrail-game/actor-studio/illustrations/mira-adler/v2/enraged',motion:'Focused guard · stronger flowing curls · moving arcs & authored blink'},
    ],
  },
  rika:rikaIllustration,
  peony:rikaIllustration,
  aurelia: {
    name:'Aurelia Weiss',folder:'/pawtrail-game/actor-studio/illustrations/aurelia-weiss/v1/normal',
    nativeSize:[320,448],compositionSize:[320,448],rendering:'smooth',
    style:'Refined cel + painterly',motion:'Flowing pink hair & feather cape · moon sanctuary',
    variants:[
      {id:'normal',label:'Normal',folder:'/pawtrail-game/actor-studio/illustrations/aurelia-weiss/v1/normal',motion:'Welcoming stance · continuous hair & feather motion'},
      {id:'enraged',label:'Enraged',folder:'/pawtrail-game/actor-studio/illustrations/aurelia-weiss/v1/enraged',motion:'Protective casting pose · moving eye energy · flowing hair & feathers'},
    ],
  },
  sieghart: {
    name:'Sieghart',folder:'/pawtrail-game/actor-studio/illustrations/sieghart/v5/normal',
    nativeSize:[320,448],compositionSize:[320,448],rendering:'smooth',
    style:'Refined cel + painterly',motion:'Pinned hair, scarf & coat motion · quiet amethyst aura',
    variants:[
      {id:'normal',label:'Normal',folder:'/pawtrail-game/actor-studio/illustrations/sieghart/v5/normal',motion:'Quiet stance · moving crown spikes, hair tips, scarf & coat'},
      {id:'enraged',label:'Enraged',folder:'/pawtrail-game/actor-studio/illustrations/sieghart/v5/enraged',motion:'Demonic grin · moving eye lightning · flowing hair, scarf & coat'},
    ],
  },
  sieg: {
    name: 'Sieg',
    folder: '/pawtrail-game/actor-studio/illustrations/sieg/v2',
    nativeSize: [192, 320],
    compositionSize: [256, 320],
    style: 'Refined cel',
    motion: 'Cape & hair sway · coastal storm · teal wind aura',
  },
  amber: {
    name: 'Amber',
    folder: '/pawtrail-game/actor-studio/illustrations/amber-outrider/full-body-v4-calm-ca1521e118f7',
    nativeSize: [192, 320],
    style: 'Refined cel',
    motion: 'Full-body idle · hair, ribbon & coat sway',
  },
  yae: {
    name: 'Yae Miko',
    folder: '/pawtrail-game/actor-studio/illustrations/yae-miko/v1-3d798d294407',
    nativeSize: [160, 240],
    style: 'Refined cel',
    motion: 'Hair & robe sway',
  },
}
