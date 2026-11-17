import type { Campaign } from './state'
import type { StagePlaytest } from '../stage-editor/playtest'
import type { ActionKey } from '../items/document'
import type { ObjectState } from '../housing/types'
import type { ArenaReport } from '../monsters/arena-contract'
export type FixtureHandle={id:'koi'|'bench';x:number;y:number;rotation:number;occupied:boolean}
export type FloorCombatReport=ArenaReport&{kind:'marshal'|'bastion';name:string;maxHp:number;feedback?:string}
export type FloorView={canvas:HTMLCanvasElement;playPosition:{x:number;y:number}|null;setSuspended:(paused:boolean)=>void;updateObjectStates:(states:Record<string,ObjectState>)=>void;focus:()=>void;pinObject:(id:string|null)=>void;setPlayInput:(x:number,y:number)=>void;interactPlay:()=>void;zoom:(direction:number)=>void;useItem:(key:ActionKey)=>unknown;dispose:()=>void;syncCampaign?:(state:Campaign)=>void;beginEncounter?:()=>boolean;leaveEncounter?:()=>void;resumeCombat?:()=>void;retryVictory?:()=>Promise<unknown>;unrecordedVictory?:boolean;canChangeFixtures?:()=>string;inEncounter?:boolean;targets?:(id:string)=>void}
export type FloorWorldControls={begin?:(play:StagePlaytest)=>boolean;leave?:(play:StagePlaytest)=>void;retryVictory?:()=>Promise<unknown>;unrecordedVictory?:boolean;active?:boolean}
