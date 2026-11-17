import type { Campaign, StageId } from './state'
export function recoveryStage(state:Campaign):StageId{return state.location.checkpoint==='f01.dispatch'?'f01.stage.switchyard':'f01.stage.arrival'}
