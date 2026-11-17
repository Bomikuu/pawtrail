import type { ItemId, StageId } from './state'
export const FLOOR_MOBS=[
 {id:'switchyard-gunner',stage:'f01.stage.switchyard',creature:'prism-gunner',x:700,y:275,pocket:[635,210,200,125]},
 {id:'pump-wisp',stage:'f01.stage.undergrid',creature:'arc-wisp',x:280,y:260,pocket:[130,160,280,160]},
 {id:'utility-hound',stage:'f01.stage.undergrid',creature:'rivet-hound',x:1090,y:715,pocket:[950,630,260,180]},
 {id:'rainline-hound',stage:'f01.stage.skybridge',creature:'rivet-hound',x:420,y:410,pocket:[300,360,260,150]},
 {id:'rainline-gunner',stage:'f01.stage.skybridge',creature:'prism-gunner',x:1000,y:410,pocket:[880,350,280,180]},
] as const
export type SpawnId=typeof FLOOR_MOBS[number]['id']
export const RESOURCE_NODES:Record<string,{stage:StageId;scope:'profile'|'expedition';items:Partial<Record<ItemId,number>>;scrip:number;label:string}>={
 'coolant-reservoir':{stage:'f01.stage.undergrid',scope:'expedition',items:{'f01.mat.coolant':3},scrip:0,label:'Coolant reservoir'},
 'relay-west':{stage:'f01.stage.undergrid',scope:'expedition',items:{'f01.mat.wire':2},scrip:0,label:'West cable cabinet'},
 'relay-east':{stage:'f01.stage.undergrid',scope:'expedition',items:{'f01.mat.wire':2},scrip:0,label:'East cable cabinet'},
 'archive-locker':{stage:'f01.stage.skybridge',scope:'profile',items:{'f01.mat.prism':1},scrip:20,label:'Maintenance locker'},
 'bay-toolkit':{stage:'f01.stage.market',scope:'profile',items:{'f01.mat.fiber':4,'f01.mat.wire':2},scrip:0,label:'Repair-bay toolkit'},
 'advert-cache':{stage:'f01.stage.market',scope:'profile',items:{'f01.mat.wire':2,'f01.mat.prism':1},scrip:0,label:'Advertisement maintenance cache'},
}
export const INCOMING_DAMAGE={'arc-pulse':11,'rivet-lunge':12,'prism-mark':14,vent:10} as const
export function deterministicRoll(key:string){let hash=2166136261;for(const c of key){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619)>>>0}return hash/0x100000000}
export function mobLoot(spawn:SpawnId,expedition:string){
 const definition=FLOOR_MOBS.find(row=>row.id===spawn)!,key=expedition+':'+spawn
 const scrip=2+Math.floor(deterministicRoll(key+':scrip')*3),scrap=1+Math.floor(deterministicRoll(key+':scrap')*2),bonus=deterministicRoll(key+':bonus')
 const items:Partial<Record<ItemId,number>>={'f01.mat.scrap':scrap}
 if(definition.creature==='rivet-hound'&&bonus<.35)items['f01.mat.wire']=1
 if(definition.creature==='prism-gunner'){if(bonus<.45)items['f01.mat.wire']=1;else if(bonus<.6)items['f01.mat.prism']=1}
 if(definition.creature==='arc-wisp'){if(bonus<.5)items['f01.mat.coolant']=1;else if(bonus<.7)items['f01.mat.wire']=1}
 return{scrip,items}
}
