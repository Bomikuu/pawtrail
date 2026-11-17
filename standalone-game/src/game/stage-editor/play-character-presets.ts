/** Small shared selector data; model code stays lazy-loaded by the play scene. */
export const playCharacterPresets={
 amber:{id:'amber-outrider',name:'Amber'},
 yae:{id:'yae-miko',name:'Yae Miko'},
 rika:{id:'rika-hoshino',name:'Rika Hoshino'},
 peony:{id:'peony-7',name:'Peony-7'},
}as const
export type PlayCharacter=keyof typeof playCharacterPresets
export function readPlayCharacter(value:string|null):PlayCharacter{return value&&Object.hasOwn(playCharacterPresets,value)?value as PlayCharacter:'amber'}
