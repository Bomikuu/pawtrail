import * as T from 'three'
import type {Rig} from '../actor-rig/rigs'
import type {StudioPose,StudioKeyframe,Triple} from '../skin-studio/model-document'
import type {ItemAction} from './document'
/** Shortest-path quaternion interpolation, shared by studio clips and equipped actions. */
export function samplePose(frames:StudioKeyframe[],time:number,fallback:StudioPose,duration:number,loop=false,flow=false):StudioPose{
 if(!frames.length)return fallback
 let before=frames[0],after=frames.at(-1)!
 if(time<=before.time)return structuredClone(before.pose)
 const upper=frames.findIndex(frame=>frame.time>=time)
 if(upper>=0){before=frames[Math.max(0,upper-1)];after=frames[upper]}
 else if(loop&&after.time<duration){before=after;after={...frames[0],time:duration}}
 else return structuredClone(after.pose)
 const t=T.MathUtils.clamp((time-before.time)/Math.max(.001,after.time-before.time),0,1),blend=flow?(before===frames[0]?t*t*(2-t):after===frames.at(-1)?t*(1+t-t*t):t):t*t*(3-2*t),angles:StudioPose['angles']={}
 for(const joint of new Set([...Object.keys(before.pose.angles),...Object.keys(after.pose.angles)])){const key=joint as keyof StudioPose['angles'],a=before.pose.angles[key]??[0,0,0],b=after.pose.angles[key]??[0,0,0],qa=new T.Quaternion().setFromEuler(new T.Euler(...a.map(T.MathUtils.degToRad) as Triple)),qb=new T.Quaternion().setFromEuler(new T.Euler(...b.map(T.MathUtils.degToRad) as Triple)),e=new T.Euler().setFromQuaternion(qa.slerp(qb,blend));angles[key]=[e.x,e.y,e.z].map(T.MathUtils.radToDeg) as Triple}
 return{root:before.pose.root.map((n,i)=>T.MathUtils.lerp(n,after.pose.root[i],blend)) as Triple,angles}
}
export function applyItemPose(rig:Rig,action:ItemAction,timeMs:number){const pose=samplePose(action.frames,timeMs/1000,{root:[0,0,0],angles:{}},action.duration/1000,false,true);for(const joint of action.mask){const node=rig.root.getObjectByName(joint),rotation=pose.angles[joint];if(node&&rotation)node.rotation.set(...rotation.map(T.MathUtils.degToRad) as Triple)}}
export function itemRotation(action:ItemAction,time:number):Triple{const frames=action.itemFrames;if(!frames.length)return[0,0,0];let a=frames[0],b=frames.at(-1)!;if(time<=a.time)return a.rotation;const i=frames.findIndex(f=>f.time>=time);if(i<0)return b.rotation;a=frames[Math.max(0,i-1)];b=frames[i];const t=(time-a.time)/Math.max(1,b.time-a.time);return a.rotation.map((v,i)=>v+((((b.rotation[i]-v)+540)%360)-180)*t) as Triple}
