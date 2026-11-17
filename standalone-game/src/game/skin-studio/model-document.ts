export const studioJoints=[
  ['Head','Head'],['SpineBend','Torso'],['ShoulderLeft','Left upper arm'],['ElbowLeft','Left forearm'],['WristLeft','Left hand'],
  ['ShoulderRight','Right upper arm'],['ElbowRight','Right forearm'],['WristRight','Right hand'],
  ['HipLeft','Left thigh'],['KneeLeft','Left knee'],['AnkleLeft','Left foot'],['HipRight','Right thigh'],['KneeRight','Right knee'],['AnkleRight','Right foot'],
] as const
export type StudioJoint=typeof studioJoints[number][0]
export const attachmentJoints=[['Head','Head'],['ChestBreath','Chest'],['SpineBend','Waist'],['UpperBody','Upper body'],...studioJoints.filter(([name])=>!['Head','SpineBend'].includes(name))] as const
export type AttachmentJoint=typeof attachmentJoints[number][0]
export const geometryShapes=['box','sphere','cylinder','cone','plane','crescent'] as const
export type GeometryShape=typeof geometryShapes[number]
export type Triple=[number,number,number]
export type StudioPose={root:Triple;angles:Partial<Record<StudioJoint,Triple>>}
export type StudioGeometry={id:string;name:string;shape:GeometryShape;parent:AttachmentJoint;position:Triple;rotation:Triple;scale:Triple;color:string;visible:boolean;texture?:string;textureLayout?:'box-2x2'}
export type StudioKeyframe={id:string;time:number;pose:StudioPose}
export type VertexOffset=[number,number,number,number]
export type MeshVertexEdit={mesh:string;vertexCount:number;offsets:VertexOffset[]}
export type VertexMeshInfo={id:string;label:string;vertices:number;points:number;linked:number;added:boolean}
export type VertexSelection={mesh:string;point:number;position:Triple;indices:number[]}
export type ModelDocument={version:2;geometry:StudioGeometry[];meshEdits:MeshVertexEdit[];pose:StudioPose;duration:number;loop:boolean;frames:StudioKeyframe[]}
export type StudioWorkspace='texture'|'geometry'|'pose'
export type ModelEditorView={mode:StudioWorkspace;geometry:string|null;joint:StudioJoint;transform:'translate'|'rotate'|'scale';snap:boolean;time:number;motionPlaying:boolean;editMode:'object'|'vertices';mesh:string|null;vertex:number|null}
export type ModelEditorEvent={type:'select-geometry';id:string}|{type:'select-joint';joint:StudioJoint}|{type:'start'}|{type:'geometry';id:string;position:Triple;rotation:Triple;scale:Triple}|{type:'joint';joint:StudioJoint;rotation:Triple}|{type:'vertex-catalog';meshes:VertexMeshInfo[]}|{type:'select-mesh';id:string}|{type:'select-vertex';selection:VertexSelection|null}|{type:'vertices';edit:MeshVertexEdit}|{type:'model-error';message:string}
export const studioId=()=>crypto.randomUUID().replaceAll('-','')
export function posePreset(kind:'neutral'|'t-pose'|'arms-up'|'sit'):StudioPose{
  const angles=Object.fromEntries(studioJoints.map(([joint])=>[joint,[0,0,0]])) as Record<StudioJoint,Triple>
  if(kind==='t-pose'||kind==='arms-up'){angles.ShoulderLeft=[0,0,kind==='t-pose'?-90:-155];angles.ShoulderRight=[0,0,kind==='t-pose'?90:155]}
  if(kind==='sit'){angles.HipLeft=angles.HipRight=[-90,0,0];angles.KneeLeft=angles.KneeRight=[90,0,0]}
  return {root:[0,kind==='sit'?-5:0,0],angles}
}
export const emptyModelDocument=():ModelDocument=>({version:2,geometry:[],meshEdits:[],pose:posePreset('neutral'),duration:2,loop:true,frames:[]})
export function newGeometry(shape:GeometryShape):StudioGeometry{
  return {id:studioId(),name:shape[0].toUpperCase()+shape.slice(1),shape,parent:'Head',position:[0,9,0],rotation:[0,0,0],scale:shape==='plane'?[8,8,1]:[4,4,4],color:'#c88445',visible:true}
}
/** Data-only local packages: no paths, arbitrary object keys, executable code or model URLs. */
export function readModelDocument(input:unknown):ModelDocument{
  if(input===undefined)return emptyModelDocument()
  const fail=():never=>{throw new Error('The skin package contains invalid geometry or motion data.')}
  const record=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:fail()
  const number=(value:unknown,min:number,max:number)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max?value:fail()
  const triple=(value:unknown,min:number,max:number):Triple=>Array.isArray(value)&&value.length===3?value.map(v=>number(v,min,max)) as Triple:fail()
  const id=(value:unknown)=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(value)&&!['__proto__','constructor','prototype'].includes(value)?value:fail()
  const pose=(value:unknown):StudioPose=>{const data=record(value),angles=record(data.angles),result:StudioPose={root:triple(data.root,-40,40),angles:{}};for(const [joint,rotation]of Object.entries(angles)){if(!studioJoints.some(([name])=>name===joint))fail();result.angles[joint as StudioJoint]=triple(rotation,-180,180)}return result}
  const data=record(input)
  if(![1,2].includes(data.version as number)||!Array.isArray(data.geometry)||data.geometry.length>24||!Array.isArray(data.frames)||data.frames.length>24||typeof data.loop!=='boolean')return fail()
  const duration=number(data.duration,.5,12),ids=new Set<string>();let textureBytes=0
  const geometry=data.geometry.map(value=>{const part=record(value),key=id(part.id);if(ids.has(key))fail();ids.add(key)
    if(typeof part.name!=='string'||part.name.length<1||part.name.length>48||!geometryShapes.includes(part.shape as GeometryShape)||!attachmentJoints.some(([name])=>name===part.parent)||typeof part.color!=='string'||!/^#[a-f0-9]{6}$/i.test(part.color)||typeof part.visible!=='boolean')fail()
    if(part.textureLayout!==undefined&&(part.textureLayout!=='box-2x2'||part.shape!=='box'))fail()
    if(part.texture!==undefined){if(typeof part.texture!=='string'||!/^data:image\/png;base64,[a-zA-Z0-9+/=]+$/.test(part.texture)||part.texture.length>180_000)fail();textureBytes+=(part.texture as string).length}
    return {id:key,name:part.name,shape:part.shape,parent:part.parent,position:triple(part.position,-40,40),rotation:triple(part.rotation,-180,180),scale:triple(part.scale,.1,30),color:part.color,visible:part.visible,...(part.texture?{texture:part.texture}:{}),...(part.textureLayout?{textureLayout:part.textureLayout}:{})} as StudioGeometry
  })
  if(textureBytes>2_000_000)fail()
  ids.clear();const times=new Set<number>()
  const frames=data.frames.map(value=>{const frame=record(value),key=id(frame.id),time=number(frame.time,0,duration);if(ids.has(key)||times.has(time))fail();ids.add(key);times.add(time);return {id:key,time,pose:pose(frame.pose)}}).sort((a,b)=>a.time-b.time)
  const edits=data.meshEdits??[]
  if(!Array.isArray(edits)||edits.length>64)fail()
  const meshIds=new Set<string>();let total=0
  const meshEdits=(edits as unknown[]).map(value=>{
    const edit=record(value)
    if(typeof edit.mesh!=='string'||!/^[a-zA-Z0-9_:/.-]{1,600}$/.test(edit.mesh)||meshIds.has(edit.mesh)||!Array.isArray(edit.offsets)||edit.offsets.length>8192)fail()
    const mesh=edit.mesh as string;meshIds.add(mesh)
    const vertexCount=number(edit.vertexCount,1,65536);if(!Number.isInteger(vertexCount))fail()
    const vertices=new Set<number>()
    const offsets=(edit.offsets as unknown[]).map(offset=>{
      if(!Array.isArray(offset)||offset.length!==4)fail()
      const row=offset as unknown[],index=number(row[0],0,vertexCount-1)
      if(!Number.isInteger(index)||vertices.has(index))fail();vertices.add(index)
      return [index,number(row[1],-40,40),number(row[2],-40,40),number(row[3],-40,40)] as VertexOffset
    })
    total+=offsets.length;if(total>100_000)fail()
    return {mesh,vertexCount,offsets}
  })
  return {version:2,geometry,meshEdits,pose:pose(data.pose),duration,loop:data.loop,frames}
}
