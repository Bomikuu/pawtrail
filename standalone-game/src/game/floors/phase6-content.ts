import type { Campaign,ItemId } from './state'
export type Governance='community'|'warden'|'exchange'
export type RecipeId='med'|'insulator'|'koi'|'bench'
export type CampItem='koi'|'bench'
export const GOVERNANCE={
 community:{name:'Community council',description:'Residents share control through public meetings and open repair accounts.',perk:'One Med Patch per expedition from Mara.',npc:{mara:6,sena:-3,ivo:-2},faction:{residents:12,wardens:-4,exchange:-4},bundle:'F01.GOV.C'},
 warden:{name:'Warden charter',description:'A regulated public service under Sena’s charter, operating rules and public inspection logs.',perk:'One Insulator per expedition from Sena.',npc:{mara:-2,sena:8,ivo:-2},faction:{residents:-4,wardens:12,exchange:-4},bundle:'F01.GOV.W'},
 exchange:{name:'Exchange concession',description:'Contracted operation with public safeguards, repair accounts and commercial obligations.',perk:'10% off basic shop goods; combined personal discounts cap at 20%.',npc:{mara:-3,sena:-3,ivo:8},faction:{residents:-4,wardens:-4,exchange:12},bundle:'F01.GOV.X'},
} as const
export const RECIPES:Record<RecipeId,{name:string;item:ItemId;inputs:Partial<Record<ItemId,number>>;description:string}>={
 med:{name:'Med Patch',item:'f01.item.med-patch',inputs:{'f01.mat.fiber':2,'f01.mat.coolant':1},description:'Restore up to 30 missing HP. No SC fee.'},
 insulator:{name:'Insulator',item:'f01.item.insulator',inputs:{'f01.mat.wire':3,'f01.mat.coolant':1,'f01.mat.scrap':2},description:'Protect the next two environmental contacts; no stacking or boss protection.'},
 koi:{name:'Koi Lamp',item:'f01.item.koi-lamp',inputs:{'f01.mat.prism':2,'f01.mat.wire':2,'f01.mat.scrap':3},description:'A switchable live 3D emitter with two swimming holographic koi. Deploy at camp.'},
 bench:{name:'Bastion Bench',item:'f01.item.bastion-bench',inputs:{'f01.mat.alloy':4,'f01.mat.scrap':6,'f01.mat.fiber':4},description:'A rotatable live 3D two-seat bench for the Concourse camp.'},
}
export const ITEM_NAMES:Partial<Record<ItemId,string>>={'f01.mat.scrap':'Scrap','f01.mat.fiber':'Fiber','f01.mat.coolant':'Coolant','f01.mat.wire':'Wire','f01.mat.prism':'Prism','f01.mat.alloy':'Alloy','f01.key.core':'Clearance Core','f01.key.relay':'Relay Seal','f01.key.writ':'Transit Writ'}
export const itemName=(id:string)=>ITEM_NAMES[id as ItemId]??id.split('.').at(-1)!.replaceAll('-',' ')
export const unlockedRecipe=(s:Campaign,id:RecipeId)=>id==='koi'?s.quests.q10==='claimed':id==='bench'?s.facts['floor-cleared']:true
export const KOI_ROUTE=['left','up','right','down'] as const
export type KoiDirection=typeof KOI_ROUTE[number]
export const KOI_TIMING={showBeat:650,answerDelay:3400,answerBeat:1000,tolerance:360}
export type KoiAttempt={id:string;mode:'normal'|'assisted';start:number;entered:KoiDirection[]}
export type FloorActivities={awning:boolean;koiSolved:boolean;koi:KoiAttempt|null;koiMessage:string}
export const activities=(s:Campaign):FloorActivities=>structuredClone(s.activities??{awning:false,koiSolved:false,koi:null,koiMessage:''})
export type Fixture={rotation:0|90|180|270;lit:boolean}
export type CampFixtures=Partial<Record<CampItem,Fixture>>
export const fixtures=(s:Campaign):CampFixtures=>structuredClone(s.fixtures??{})
export const CAMP_SLOTS={koi:{object:'camp-koi',asset:'f01:koi-lamp',x:650,y:590,item:'f01.item.koi-lamp'},bench:{object:'camp-bench',asset:'f01:bastion-bench',x:730,y:740,item:'f01.item.bastion-bench'}} as const
export function campSignature(s:Campaign){const placed=fixtures(s);return JSON.stringify((['koi','bench'] as const).map(key=>[key,placed[key]?.rotation??null]))}
