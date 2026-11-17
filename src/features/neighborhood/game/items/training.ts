import {starterStage,type StageDocument} from '../stage-editor/data'
import type {AbilityTarget} from './runtime'
export function trainingStage():StageDocument{const stage=starterStage('yard');stage.name='Item training garden';stage.objects=[0,1,2].map(i=>({id:'training-wall-'+i,asset:'wall:wood:north',x:288+i*32,y:196,elevation:0,layer:'world',bias:0,rotation:0}));return stage}
export const trainingSpawn={x:320,y:352}
export const trainingTargets:AbilityTarget[]=[{id:'near-left',rect:{x:286,y:278,width:20,height:22},kind:'training',eligible:true},{id:'near-right',rect:{x:336,y:262,width:20,height:22},kind:'training',eligible:true},{id:'large-target',rect:{x:292,y:216,width:56,height:22},kind:'training',eligible:true},{id:'behind-wall',rect:{x:308,y:158,width:24,height:22},kind:'training',eligible:true}]
