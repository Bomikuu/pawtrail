import { phase6Command,PHASE6_KINDS,type Phase6Action } from './phase6-commands'
import { firstLoopCommand, type FirstLoopAction } from './commands'
import { phase4Command, PHASE4_KINDS, type Phase4Action } from './phase4-commands'
import type { Campaign } from './state'
import { phase5Command,PHASE5_KINDS,type Phase5Action } from './phase5-commands'
export type FloorAction=FirstLoopAction|Phase4Action|Phase5Action|Phase6Action
export function floorCommand(state:Campaign,action:FloorAction,id:string){return PHASE6_KINDS.has(action.kind)?phase6Command(state,action as Phase6Action,id):PHASE5_KINDS.has(action.kind)?phase5Command(state,action as Phase5Action,id):PHASE4_KINDS.has(action.kind)?phase4Command(state,action as Phase4Action,id):firstLoopCommand(state,action as FirstLoopAction,id)}
