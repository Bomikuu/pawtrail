import {humanGait} from './human-gait'
import {humanIdle} from './human-idle'
import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import actions from './actions.json'
import {attachHair,attachHeadwear,attachTorso,attachHem,attachSword,type CharacterParts} from './appearance-parts'
import {attachLongHair,attachGownBodice,attachGownSkirt,attachAngelWings} from './angel-parts'
import {attachLifeSupport} from './costume-parts'
import {attachOutriderLimbs} from './outrider-parts'
import {canBecomeSuperSaiyan,SUPER_SAIYAN_COLORS,usesWalkingLegs,jetpackLift} from './action-layers'
import {attachJetpack} from './jetpack-parts'
import {isJetpackAction} from './action-playback'
import {catOptions,catBreedColors,catJumpMotion,catBodyScale,type CatOptions} from './cat-appearance'
import {catCoat,attachCatDetails} from './cat-parts'
import {DEFAULT_CHARACTER_FACE,type FaceColors} from './face-details'
import {humanoidPartGeometry,humanoidFaceGeometry,humanoidHairLockGeometry} from './humanoid-base'
import {createFaceContour} from './face-contour'
export type Kind='rescuer'|'orange-tabby'
export type SecondaryMotion={phase:number;locomotion:number}
export type RigPoseOptions={locomotionPhase?:number;gait?:'walk'|'run';secondaryMotion?:SecondaryMotion;idleSoleHeight?:number;referenceStance?:boolean}
export type Rig={kind:Kind;root:T.Group;nodes:T.Object3D[];itemSockets?:Record<string,T.Object3D>;pose:(action:string,phase:number,layers?:RigPoseOptions)=>void}
export {actions}
import BASE_COLORS from './palette.json'
const C=BASE_COLORS
export type AppearanceOptions={baseModel?:'classic'|'refined-v2';colors?:Partial<Record<keyof typeof BASE_COLORS,string>>;accessories?:{glasses?:boolean;facialHair?:'none'|'mustache'|'goatee';faceMarking?:'none'|'freckles'|'beauty-mark'};parts?:CharacterParts;cat?:CatOptions;face?:FaceColors;frame?:{width:number;height:number}}
export const palette=Object.values(BASE_COLORS)
export const appearancePalette=(appearance:AppearanceOptions={})=>[...Object.values({...BASE_COLORS,...catBreedColors(appearance.cat?.breed),...appearance.colors}),...Object.values(appearance.face??{}),...(canBecomeSuperSaiyan(appearance)?Object.values(SUPER_SAIYAN_COLORS):[])]
const shapeCache=new Map<string,T.BufferGeometry>()
const hairPaintCache=new Map<string,T.CanvasTexture>()
function hairTexture(colors=BASE_COLORS){
 const C=colors,key=JSON.stringify([C.hair,C.hairLight,C.hairShade,C.hairSheen])
 const cached=hairPaintCache.get(key);if(cached){cached.userData.actorUsers++;return cached}
 const canvas=document.createElement('canvas');canvas.width=32;canvas.height=16
 const paint=canvas.getContext('2d')!
 paint.fillStyle=C.hair;paint.fillRect(0,0,32,16)
 const block=(color:string,x:number,y:number,w:number,h:number)=>{
  paint.fillStyle=color
  for(let dx=0;dx<w;dx++)paint.fillRect(((x+dx)%32+32)%32,y,1,h)
 }
 // Hand-authored lock clusters, with stepped highlights and deep separations.
 // These pixels live on the hair surface; small accent meshes can be buried
 // inside the rounded crown and disappear at native sprite resolution.
 block(C.hairShade,0,12,32,4)
 for(const [x,y,sweep] of [[1,3,1],[7,1,1],[14,3,-1],[21,2,1],[28,4,-1]]){
  block(C.hairShade,x+3,y+1,2,3)
  block(C.hairShade,x+3+sweep,y+4,1,4)
  block(C.hairShade,x+2+sweep,y+8,2,3)
  block(C.hairLight,x,y,3,2)
  block(C.hairLight,x+sweep,y+2,3,2)
  block(C.hairLight,x+2*sweep,y+4,2,2)
  block(C.hairSheen,x,y,2,1)
  block(C.hairLight,x+2*sweep,y+7,1,2)
 }
 const hairPaint=new T.CanvasTexture(canvas)
 hairPaint.colorSpace=T.SRGBColorSpace
 hairPaint.magFilter=T.NearestFilter;hairPaint.minFilter=T.NearestFilter
 hairPaint.generateMipmaps=false
 hairPaint.userData.actorKey=key;hairPaint.userData.actorUsers=1;hairPaintCache.set(key,hairPaint);return hairPaint
}
function paintHair(mesh:T.Mesh,colors=BASE_COLORS){
 const material=(mesh.material as T.MeshBasicMaterial).clone()
 material.color.set('#ffffff');material.map=hairTexture(colors)
 mesh.material=material
 return mesh
}
function paintedShading(g:T.BufferGeometry){
 const normals=g.getAttribute('normal'),colors=[]
 for(let i=0;i<normals.count;i++){
  const light=normals.getY(i)*.6+normals.getZ(i)*.25-normals.getX(i)*.2
  const shade=light<-.2?.68:light<.1?.84:light>.5?1.08:1
  colors.push(shade,shade,shade)
 }
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g
}
function box(w:number,h:number,d:number,bevel=.35){
 const key=[w,h,d,bevel].join(':');if(shapeCache.has(key))return shapeCache.get(key)!
 const g=paintedShading(new RoundedBoxGeometry(w,h,d,1,Math.min(bevel,w/2,h/2,d/2)))
 g.userData.sharedActorGeometry=true;shapeCache.set(key,g);return g
}
function author(kind:Kind,refined=false){
 const root=new T.Group();root.name=kind==='rescuer'?'PawTrailRescuer':'PawTrailOrangeTabby'
 const nodes:T.Object3D[]=[root],materials=new Map<string,T.MeshBasicMaterial>();let serial=0
 const group=(name:string,parent:T.Object3D,x=0,y=0,z=0)=>{const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);nodes.push(g);return g}
 const material=(color:string)=>{if(!materials.has(color))materials.set(color,new T.MeshBasicMaterial({color,vertexColors:true,toneMapped:false}));return materials.get(color)!}
 const part=(name:string,parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number,bevel=.35)=>{const custom=refined?humanoidPartGeometry(name,w,h,d):undefined;const m=new T.Mesh(custom?paintedShading(custom):box(w,h,d,bevel),material(color));m.name=name+'_'+serial++;m.position.set(x,y,z);parent.add(m);return m}
 const round=(name:string,parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number)=>{const face=refined&&name==='Face',lock=refined&&/^(SideSweptFringe|HairLock|ShortFringe)$/.test(name),shaped=face||lock,g=paintedShading(face?humanoidFaceGeometry():lock?humanoidHairLockGeometry():new T.SphereGeometry(1,12,8));const m=new T.Mesh(g,material(color));m.name=name+'_'+serial++;m.position.set(x,y,z);m.scale.set(face?w*.94:lock?w:w/2,shaped?h:h/2,shaped?d:d/2);if(face)m.add(createFaceContour(g,'#'+new T.Color(color).multiplyScalar(.7).getHexString(),.025));parent.add(m);return m}
 return {root,nodes,group,part,round}
}
function restPose(nodes:T.Object3D[]){
 const defaults=nodes.map(node=>({node,p:node.position.clone(),q:node.quaternion.clone(),s:node.scale.clone()}))
 return ()=>{for(const {node,p,q,s} of defaults){node.position.copy(p);node.quaternion.copy(q);node.scale.copy(s)}}
}
const reveal=(node:T.Object3D,visible:boolean)=>node.scale.setScalar(visible?1:.0001)
export function createRescuer(appearance:AppearanceOptions={}):Rig{
 if(['wide-brim','hood'].includes(appearance.parts?.headwear??'')&&['swept','spiky','hero-spikes'].includes(appearance.parts?.hair??'swept'))appearance={...appearance,parts:{...appearance.parts,hair:'cropped'}}
 if(appearance.parts?.headwear==='space-helmet')appearance={...appearance,parts:{...appearance.parts,hair:'cropped'}}
 const C={...BASE_COLORS,...appearance.colors},paint=(mesh:T.Mesh)=>paintHair(mesh,C)
 const face=appearance.face??{...DEFAULT_CHARACTER_FACE,nose:C.skinShadow,marking:C.hairShade}
 const {root,nodes,group,part,round}=author('rescuer',appearance.baseModel!=='classic'),stance=group('RescuerStance',root),upper=group('UpperBody',stance),chest=group('ChestBreath',upper,0,20.5,0)
 const kit={colors:C,group,part,round,paint,shade:paintedShading},outfit=appearance.parts?.outfit??'vest',hems:T.Group[]=[]
 part('TealShirt',chest,C.shirt,0,0,0,outfit==='gown'?8:9.5,outfit==='gown'?11.2:11.8,outfit==='gown'?4.7:5.4,.7)
 part('ShirtFoldLight',chest,C.shirtLight,-1.2,.7,2.8,.8,7.2,.3,.12)
 part('ShirtHemShade',chest,C.shirtDark,0,-5.1,2.8,3.2,.7,.3,.1)
 if(outfit==='vest'){
 for(const s of [-1,1]){part('BrownVest',chest,C.jacket,s*3.6,0,2.7,2.6,11.8,.7,.1);part('VestSeam',chest,C.jacketLight,s*2.2,0,3.1,.45,10,.3,.08);part('VestPocket',chest,C.jacketDark,s*3.7,-2.5,3.13,1.7,2.1,.25,.1)}
 for(const s of [-1,1]){
  part('VestEdgeStitch',chest,C.jacketLight,s*4.55,.8,2.98,.65,7.5,.25,.1)
  part('PocketFlap',chest,C.jacketLight,s*3.7,-1.45,3.32,1.9,.6,.25,.1)
 }
 }else if(outfit==='gown')attachGownBodice(kit,chest,upper)
 else attachTorso(kit,chest,upper,outfit)
 part('Collar',upper,outfit==='gi'?C.shirt:outfit==='spacesuit'?C.metalShade:C.cream,0,26.1,1.3,3.7,1.6,3,.3);part('Neck',upper,C.skin,0,27.4,0,3.2,2.4,3.4,.4)
 if(!['gown','gi','spacesuit'].includes(outfit)){
 part('Belt',upper,C.shoe,0,14.5,.15,10.2,1.6,5.7,.2);part('Buckle',upper,C.shorts,0,14.5,3.2,1.2,1.2,.4,.1)
 }
 if(outfit!=='gown')part('ContinuousShortsWaist',upper,C.shorts,0,13.4,0,9.6,2.5,5.2,.35)
 if(appearance.parts?.backpack!==false&&outfit==='spacesuit')attachLifeSupport(kit,upper)
 else if(appearance.parts?.backpack!==false){
 part('Backpack',upper,C.backpackDark,0,21,-4.1,7.2,8,3.5,.8);part('BackpackPocket',upper,C.backpack,0,19.8,-6,4.5,3.2,.7,.3)
 part('BackpackPiping',upper,C.backpackLight,-2.8,21,-5.95,.7,5.9,.3,.1)
 part('BackpackPocketStitch',upper,C.backpackLight,0,21.1,-6.45,3.2,.6,.25,.08)
 }
 const transforms=canBecomeSuperSaiyan(appearance)
 const skull=group('Head',upper,0,32,0)
 // Cut-corner low-poly anatomy, composed for the approved small-face sprite style.
 round('Face',skull,C.skin,0,0,.3,appearance.parts?.face==='soft'?10.7:11,appearance.parts?.face==='soft'?11.2:11,9.2)
 const hairRoot=transforms?group('NaturalHair',skull):skull
 let longHair:ReturnType<typeof attachLongHair>|undefined
 if(!appearance.parts?.hair||appearance.parts.hair==='swept'){
 paint(round('HairBack',hairRoot,C.hair,0,1,-2.3,12.3,11.5,6.4))
 paint(round('HairTop',hairRoot,C.hair,0,4.1,-.2,12.9,6.8,10))
 const fringe=paint(round('SideSweptFringe',hairRoot,C.hair,-2.1,2.9,3.9,8.2,5,3.5));fringe.rotation.z=.3
 paint(round('HairLock',hairRoot,C.hair,4.1,2.1,3.1,3.8,5.7,3.8))
 part('HairHighlight',hairRoot,C.hairLight,-2.4,4.1,4.5,3.2,.6,.25,.15)
 part('CrownLightCluster',hairRoot,C.hairLight,-2.9,6.2,.5,2.5,.7,2.3,.2)
 part('SideLockLight',hairRoot,C.hairLight,-4.8,2.7,1.3,.75,2.2,1.2,.15)
 part('BackHairStrand',hairRoot,C.hairLight,-2.8,2,-5.4,.75,2.6,.3,.1)
 }else if(appearance.parts.hair==='long')longHair=attachLongHair(kit,hairRoot)
 else attachHair(kit,hairRoot,appearance.parts.hair)
 const goldenHair=transforms?group('SuperSaiyanHair',skull):undefined
 if(goldenHair){
  const gold={...C,...SUPER_SAIYAN_COLORS}
  attachHair({...kit,colors:gold,paint:(mesh:T.Mesh)=>paintHair(mesh,gold)},goldenHair,'spiky')
  reveal(goldenHair,false)
 }
 const drawEyes=(parent:T.Group,left:string,right:string,glint=C.cream)=>{
  for(const side of [-1,1]){
   round('DarkEye',parent,C.ink,side*2.3,0,0,1.65,2.2,.35)
   round('IrisTint',parent,side<0?right:left,side*2.3,-.45,.2,1.05,.85,.16)
   part('DarkPupil',parent,C.ink,side*2.3,-.1,.3,.45,1.25,.12,.04)
   part('EyeSpark',parent,glint,side*2.3-.22,.45,.38,.3,.35,.12,.03)
  }
 }
 const superEyes=transforms?group('SuperSaiyanEyes',skull,0,-1,5.35):undefined
 if(superEyes){drawEyes(superEyes,SUPER_SAIYAN_COLORS.eye,SUPER_SAIYAN_COLORS.eye,SUPER_SAIYAN_COLORS.eyeLight);reveal(superEyes,false)}
 const headwear=attachHeadwear(kit,skull,appearance.parts?.headwear)
 const eyes=group('EyeBlink',skull,0,-1,5.35)
 drawEyes(eyes,face.leftEye,face.rightEye)
 for(const side of [-1,1])part('Ear',skull,C.skinShadow,side*5.3,-.3,.1,1.4,2.4,1.6,.3)
 if(appearance.parts?.face==='soft'){
  for(const side of [-1,1]){
   const lash=part('SoftOuterLash',eyes,C.ink,side*3.15,.35,.1,.65,.9,.3,.05);lash.rotation.z=-side*.35
   round('CheekBlush',skull,C.blush,side*3.35,-2,4.85,1.7,.75,.35)
  }
 }
 if(appearance.accessories?.glasses){
  const glasses=group('Glasses',skull,0,-.8,5.7)
  for(const side of [-1,1]){
   for(const y of [-1.65,1.65])part('GlassesRim',glasses,C.ink,side*2.65,y,0,4.8,.55,.45,.1)
   for(const x of [-2.15,2.15])part('GlassesSide',glasses,C.ink,side*2.65+x,0,0,.55,3.3,.45,.1)
   part('LensGlint',glasses,C.cream,side*2.65-.9,.8,.28,.8,.6,.2,.05)
   part('GlassesArm',glasses,C.ink,side*5,0,-2.6,.55,.6,5.2,.1)
  }
  part('GlassesBridge',glasses,C.ink,0,.2,.15,1.4,.6,.5,.1)
 }
 const closedEyes=group('RestingEyes',skull,0,-1,5.35)
 for(const s of [-1,1])part('ClosedEye',closedEyes,C.ink,s*2.3,0,0,1.8,.6,.25,.05)
 reveal(closedEyes,false)
 const angryBrows=group('AngryBrows',skull,0,.5,5.5)
 for(const s of [-1,1]){const brow=part('Brow',angryBrows,C.ink,s*2.3,0,0,2.2,.65,.3,.04);brow.rotation.z=s*.35}
 reveal(angryBrows,false)
 const yawn=group('Yawn',skull,0,-3,5.15)
 round('OpenMouth',yawn,C.ink,0,0,0,1.8,2,.4);reveal(yawn,false)
 part('Smile',skull,C.mouth,0,-3.3,4.95,1.8,.45,.18,.05)
 if(appearance.accessories?.facialHair==='mustache')for(const side of [-1,1]){
  const mark=part('Mustache',skull,face.marking,side*.9,-2.75,5.25,1.55,.65,.3,.08);mark.rotation.z=side*.18
  part('MustacheTip',skull,face.marking,side*1.65,-2.6,5.15,.55,.45,.3,.05)
 }
 if(appearance.accessories?.facialHair==='goatee'){
  part('Goatee',skull,face.marking,0,-4,4.85,1.5,1.5,.4,.18)
  part('GoateeTip',skull,face.marking,0,-4.85,4.5,.85,.55,.35,.1)
 }
 if(appearance.accessories?.faceMarking==='freckles')for(const side of [-1,1])for(const [x,y] of [[2.5,-2.1],[3.2,-1.85],[3.7,-2.4]])part('Freckle',skull,face.marking,side*x,y,4.95,.35,.35,.16,.02)
 if(appearance.accessories?.faceMarking==='beauty-mark')part('BeautyMark',skull,face.marking,2.3,-3,4.95,.45,.45,.18,.04)
 const trousers=appearance.parts?.legs==='trousers'||outfit==='spacesuit'||outfit==='gi'
 const powerFists:T.Group[]=[]
 const hips:T.Group[]=[],knees:T.Group[]=[],ankles:T.Group[]=[],shoulders:T.Group[]=[],elbows:T.Group[]=[],wrists:T.Group[]=[]
 for(const s of [-1,1]){
  const hip=group(s<0?'HipLeft':'HipRight',stance,s*2.6,13,0);hips.push(hip)
  if(outfit!=='gown'){
  part('CargoShorts',hip,C.shorts,0,-2.7,0,outfit==='gi'?5.2:outfit==='spacesuit'?5:4.4,5.7,outfit==='spacesuit'?5.8:5.1,.5);if(!['gi','spacesuit','outrider'].includes(outfit))part('CargoPocket',hip,C.jacketLight,s*2.2,-2.3,0,.45,2.2,2.7,.12)
  part('ShortsOuterSeam',hip,C.shortsDark,s*1.8,-2.9,2.5,.55,4.3,.3,.1)
  part('ShortsTopFold',hip,C.shortsLight,-.6,-1.1,2.7,1.5,.65,.3,.1)
  }
  const knee=group(s<0?'KneeLeft':'KneeRight',hip,0,-5.5,0);knees.push(knee)
  part('Shin',knee,trousers?C.shorts:C.skin,0,-2.6,0,trousers?3.3:2.8,5.2,trousers?3.7:3.2,.5)
  part('ShinEdgeShade',knee,trousers?C.shortsDark:C.skinShadow,1.15,-2.7,trousers?1.9:1.65,.5,3.3,.25,.1)
  const ankle=group(s<0?'AnkleLeft':'AnkleRight',knee,0,-5.3,0);ankles.push(ankle)
  if(outfit==='gown'){
   round('GownSlipper',ankle,C.ribbon,0,-.8,.8,3.2,1.6,4.7)
   part('SlipperStrap',ankle,C.gold,0,.1,1.4,3,.5,.7,.1)
  }else{
  part('Boot',ankle,outfit==='spacesuit'?C.jacket:C.shoe,0,-1.05,.95,3.7,2.1,5.6,.45);part('BootCuff',ankle,outfit==='gi'?C.shirt:outfit==='spacesuit'?C.metalShade:C.jacketLight,0,.8,.1,3.4,1.2,3.9,.2)
  part('BootToeLight',ankle,outfit==='gi'?C.shirtLight:outfit==='spacesuit'?C.jacketLight:C.jacketLight,-.6,-.65,3.67,1.7,.55,.3,.1)
  part('BootSole',ankle,C.ink,0,-1.88,.95,3.8,.4,5.6,.1)
  }
  if(outfit==='spacesuit'){part('SuitAnkleRing',ankle,C.metalShade,0,1.1,0,3.8,1.3,4.3,.2);part('BootToeGuard',ankle,C.metal,-.1,-.6,3.7,3.1,1,.6,.15)}
  const shoulder=group(s<0?'ShoulderLeft':'ShoulderRight',upper,s*6,25,0);shoulders.push(shoulder)
  if(outfit==='gown'){round('GownPuffSleeve',shoulder,C.gown,0,-2,0,4.8,4.6,5);part('SleeveGoldCuff',shoulder,C.gold,0,-4,0,3.2,.65,3.9,.2)}
  else if(outfit==='spacesuit'){round('PaddedSuitSleeve',shoulder,C.jacket,0,-2.3,0,4.5,5.8,5.2);part('SuitShoulderPatch',shoulder,C.orange,s*1.9,-1,1.1,.7,2.2,2,.15)}
  else part('JacketSleeve',shoulder,outfit==='gi'?C.shirt:C.jacket,0,-2.3,0,3.2,4.7,4,.6)
  const elbow=group(s<0?'ElbowLeft':'ElbowRight',shoulder,0,-4.6,0);elbows.push(elbow)
  part('Forearm',elbow,outfit==='spacesuit'?C.jacket:C.skin,0,-1.8,0,outfit==='spacesuit'?3.6:2.5,3.7,outfit==='spacesuit'?4:3,.4)
  const wrist=group(s<0?'WristLeft':'WristRight',elbow,0,-3.8,0);wrists.push(wrist)
  part('Hand',wrist,['spacesuit','outrider'].includes(outfit)?C.cream:C.skin,0,-.2,0,2.8,2.1,3,.45)
  if(outfit==='gi'||outfit==='spacesuit')part('WristCuff',wrist,outfit==='gi'?C.shirt:C.metalShade,0,.7,0,3.4,1.8,3.6,.25)
  const fist=group('PowerFist_'+s,wrist);powerFists.push(fist)
  part('ClenchedFist',fist,outfit==='spacesuit'?C.cream:C.skin,0,-.25,.3,3.5,2.7,3.4,.45)
  part('FistKnuckleLight',fist,outfit==='spacesuit'?C.jacketLight:C.skinLight,-.6,.25,2.05,2,.55,.3,.1)
  part('CurledThumb',fist,outfit==='spacesuit'?C.jacketDark:C.skinShadow,s*1.45,-.5,1.1,.8,1.4,1.8,.2);reveal(fist,false)
  part('SleeveEdgeLight',shoulder,outfit==='gi'?C.shirtLight:C.jacketLight,-.7,-3.8,1.85,1.5,.6,.3,.1)
  if(outfit==='outrider')attachOutriderLimbs(kit,hip,knee,shoulder,elbow,wrist,s)
  const hem=attachHem(kit,hip,outfit,s<0?0:1);if(hem)hems.push(hem)
 }
 const jetpack=attachJetpack(kit,upper,outfit!=='spacesuit'||appearance.parts?.backpack===false);reveal(jetpack,false)
 const gown=outfit==='gown'?attachGownSkirt(kit,stance):undefined
 const angelWings=appearance.parts?.wings==='feathered'?attachAngelWings(kit,upper):[]
 const equippedSword=appearance.parts?.held==='sword'?attachSword(kit,wrists[1],upper):undefined
 if(equippedSword){reveal(equippedSword.held,false);reveal(equippedSword.stowed,false)}
 const food=group('OfferedFood',wrists[0],0,-1.2,1.6)
 round('FoodBowl',food,C.shirtDark,0,0,0,5.5,1.8,4.5);round('KibbleInBowl',food,C.kibble,0,.65,0,4.2,.7,3.2)
 const bottle=group('HeldWaterBottle',wrists[0],0,-.8,1.1)
 part('Bottle',bottle,C.shirt,0,0,0,2.6,4.4,2.6,.4);part('BottleCap',bottle,C.cream,0,2.4,0,1.8,.8,1.8,.15)
 const parcel=group('HeldSupplies',wrists[1],0,-.7,1.8)
 part('SupplyBag',parcel,C.shorts,0,0,0,4.5,4.6,3.4,.4);part('BagPaw',parcel,C.cream,0,0,1.8,1.5,1.5,.3,.2)
 const cloth=group('CleaningCloth',wrists[0],0,-1.2,1)
 part('Cloth',cloth,C.cream,0,0,0,4.8,.6,4,.15)
 for(const prop of [food,bottle,parcel,cloth])reveal(prop,false)
 // Bend the torso around the waist instead of tilting the entire upper body
 // about the feet. The zero pose is identical to the approved walking rig.
 const spine=group('SpineBend',upper,0,14,0)
 for(const child of [...upper.children])if(child!==spine){spine.add(child);child.position.y-=14}
 const pillow=group('SleepPillow',stance,0,32,-4.8)
 round('Pillow',pillow,C.cream,0,0,0,13.8,9.4,2.5)
 part('PillowSeam',pillow,C.creamShadow,0,-3.4,1.25,10.8,.55,.25,.1)
 const blanket=group('SleepBlanket',stance,0,15.5,3.8)
 part('Blanket',blanket,C.shirtLight,0,0,0,10.7,8.7,1.5,.6)
 part('BlanketHem',blanket,C.cream,0,3.6,.85,10.3,.8,.3,.1)
 part('BlanketFold',blanket,C.shirtDark,2.5,-.2,.85,.7,5.5,.3,.1)
 reveal(pillow,false);reveal(blanket,false)
 const reset=restPose(nodes)
 const idleDown=new T.Vector3(0,-1,0),idleUp=new T.Vector3(0,1,0),idleAim=new T.Vector3(),idleToe=new T.Quaternion()
 function pose(action:string,phase:number,layers:RigPoseOptions={}){
  reset()
  const locomoting=usesWalkingLegs(action)&&typeof layers.locomotionPhase==='number'
  const stridePhase=locomoting?layers.locomotionPhase!:phase,strideT=stridePhase*Math.PI*2
  const t=phase*Math.PI*2,explicitRun=['run','power_run','rescue_dash'].includes(action),walking=action==='walk'||explicitRun||locomoting,running=explicitRun||walking&&layers.gait==='run'
  const gaitPose=humanGait(stridePhase,running)
  const idlePose=action==='idle'&&!walking&&!layers.referenceStance?humanIdle(phase,layers.idleSoleHeight??(outfit==='gown'?1.6:2.08)):undefined
  upper.position.y=walking?gaitPose.bodyY:Math.sin(t)*.24
  upper.position.x=walking?gaitPose.pelvisX:0
  upper.position.z=walking?gaitPose.bodyZ:0
  chest.scale.y=1+(walking?0:Math.sin(t)*.015)
  skull.rotation.x=walking?gaitPose.headPitch:Math.sin(t)*.016
  skull.rotation.y=walking?-gaitPose.torsoYaw*.3:Math.sin(t)*.02
  skull.rotation.z=walking?-gaitPose.torsoRoll*.5:0
  eyes.scale.y=!walking&&phase>=.75&&phase<.875?.12:1
  for(let i=0;i<2;i++){
   if(walking){
    const leg=gaitPose.legs[i],arm=gaitPose.arms[i]
    hips[i].position.x+=gaitPose.pelvisX;hips[i].position.y=leg.y;hips[i].position.z=leg.z
    hips[i].rotation.set(leg.hip,leg.yaw,leg.roll)
    knees[i].rotation.x=leg.knee;ankles[i].rotation.set(leg.ankle,0,leg.ankleRoll)
    shoulders[i].rotation.set(...arm.shoulder);elbows[i].rotation.set(...arm.elbow);wrists[i].rotation.set(...arm.wrist)
   }else{
    shoulders[i].rotation.x=Math.sin(t)*.035*(i===0?1:-1)
    elbows[i].rotation.x=-.14
   }
  }
  if(walking){spine.rotation.set(gaitPose.lean,gaitPose.torsoYaw,gaitPose.torsoRoll)}
  if(idlePose){
   const p=idlePose
   upper.position.set(p.pelvisX,p.bodyY,p.pelvisZ)
   chest.scale.set(1+p.inhale*.003,1+p.inhale*.009,1+p.inhale*.012)
   spine.rotation.set(p.lean,0,p.roll)
   skull.rotation.set(p.headPitch,p.headYaw,-p.roll*.4)
   for(let i=0;i<2;i++){
    const side=i===0?-1:1,leg=p.legs[i]
    hips[i].position.set(side*2.6+p.pelvisX,leg.y,p.pelvisZ)
    // Aim the two-bone chain at a fixed ankle, then cancel its rotation at the foot.
    // Unlike a body bob plus bent knees, this keeps the whole sole flat and planted.
    hips[i].quaternion.setFromUnitVectors(idleDown,idleAim.set(...leg.direction))
    hips[i].rotateX(-leg.bend);knees[i].rotation.set(leg.knee,0,0)
    ankles[i].quaternion.copy(hips[i].quaternion).multiply(knees[i].quaternion).invert()
     .multiply(idleToe.setFromAxisAngle(idleUp,leg.toeOut))
    shoulders[i].position.y+=p.shoulderLift-side*p.weight*.025
    shoulders[i].rotation.set(-.025+p.lag*.012,side*.01,side*(.045+p.lag*.007))
    elbows[i].rotation.set(-.2+p.lag*.015,0,side*.012)
    wrists[i].rotation.set(-.025+p.lag*.008,side*p.lag*.008,side*.012)
   }
  }
  const strideArms=shoulders.map((node,i)=>({shoulder:node.rotation.clone(),elbow:elbows[i].rotation.clone(),wrist:wrists[i].rotation.clone()}))
  const walkingY=upper.position.y
  const walkingLegs=locomoting?[...hips,...knees,...ankles].map(node=>({node,p:node.position.clone(),q:node.quaternion.clone()})):[]
  const crouch=(amount:number)=>{const a=-1.6*amount,k=2.1*amount,y=5.5*Math.cos(a)+5.3*Math.cos(a+k)+2.1;upper.position.y=y-13;for(let i=0;i<2;i++){hips[i].position.y=y;hips[i].rotation.x=a;knees[i].rotation.x=k;ankles[i].rotation.x=-a-k}}
  if(isJetpackAction(action)){
   const ease=phase*phase*(3-2*phase)
   const lift=action==='jetpack_takeoff'?ease:action==='jetpack_land'?1-ease:1
   const bob=action==='jetpack'?Math.sin(t)*.45:0
   stance.position.y=jetpackLift(appearance)*lift+bob
   upper.position.y=0;spine.rotation.x=-.055*lift;skull.rotation.x=-.025*lift
   chest.scale.y=1+Math.sin(t)*.012;reveal(jetpack,true)
   for(let i=0;i<2;i++){
    const side=i===0?-1:1
    hips[i].rotation.x=-.22*lift;knees[i].rotation.x=.38*lift;ankles[i].rotation.x=-.16*lift
    shoulders[i].rotation.set(-.18*lift,0,side*.22*lift);elbows[i].rotation.x=-.65*lift
    wrists[i].rotation.x=-.12*lift
   }
  }else if(action==='feed'||action==='water'){
   const reach=(1-Math.cos(t))/2
   crouch(.75+reach*.2);spine.rotation.x=.18+reach*.2;spine.rotation.z=Math.sin(t)*.035
   skull.rotation.x=.14+reach*.12
   shoulders[0].rotation.x=-.2-reach*.5;elbows[0].rotation.x=-1+reach*.95
   shoulders[0].rotation.z=-.18;wrists[0].rotation.x=.18+reach*.18
   shoulders[1].rotation.x=-.45;elbows[1].rotation.x=-.95+Math.sin(t+.4)*.25
   wrists[1].rotation.z=Math.sin(t)*.15
   reveal(food,action==='feed');reveal(bottle,action==='water');reveal(parcel,action==='feed')
   bottle.rotation.x=.1+reach*.6
  }else if(action==='pet'||action==='clean'||action==='play'){
   const stroke=Math.sin(t)
   crouch(action==='play'?.75:.92+stroke*.05)
   spine.rotation.x=.28+stroke*.1;spine.rotation.z=-.08+Math.cos(t)*.035
   skull.rotation.x=.2+stroke*.06
   shoulders[0].rotation.x=-.9+stroke*.35;elbows[0].rotation.x=-.35+Math.cos(t)*.25
   shoulders[0].rotation.z=-.3+Math.cos(t)*.18;wrists[0].rotation.x=.3+stroke*.22
   shoulders[1].rotation.x=-.1;elbows[1].rotation.x=-.25
   reveal(cloth,action==='clean')
   if(action==='play'){shoulders[0].rotation.z=Math.sin(t)*.3;skull.rotation.y=Math.sin(t)*.06}
  }else if(action==='sit'||action==='float'||action==='ride'){
   const breathe=Math.sin(t)
   upper.position.y=-7.2+breathe*.25;spine.rotation.x=.08+breathe*.025;chest.scale.y=1+breathe*.035
   skull.rotation.x=.06+breathe*.035
   for(let i=0;i<2;i++){
    hips[i].position.y=5.8;hips[i].rotation.x=-Math.PI/2;knees[i].rotation.x=2.4;ankles[i].rotation.x=Math.PI/2-2.4
    hips[i].rotation.z=i===0?-.06:.06
    shoulders[i].rotation.x=-.35;elbows[i].rotation.x=-.35+breathe*.06;wrists[i].rotation.x=.35
   }
   if(action==='float'){stance.position.y=4.5+breathe*.6;spine.rotation.z=Math.sin(t)*.04;skull.rotation.x=-.08}
   if(action==='ride'){
    stance.position.y=breathe*.2;spine.rotation.z=Math.sin(t)*.045;skull.rotation.x=-.08
    for(let i=0;i<2;i++){shoulders[i].rotation.z=i===0?-.65:.65;elbows[i].rotation.x=-.65;wrists[i].rotation.x=-.1}
   }
  }else if(action==='sleep'){
   const breathe=Math.sin(t)
   stance.rotation.x=-Math.PI/2;stance.rotation.z=.06;stance.position.set(0,6,24)
   upper.position.z=breathe*.35;chest.scale.z=1+breathe*.14;skull.rotation.x=.25+breathe*.02
   reveal(eyes,false);reveal(closedEyes,true);reveal(pillow,true);reveal(blanket,true)
   blanket.position.z+=breathe*.45
   for(let i=0;i<2;i++){
    hips[i].rotation.x=i===0?-2.15:-1.95;knees[i].rotation.x=i===0?2.8:2.6;ankles[i].rotation.x=-.65
    shoulders[i].position.z+=3.4;shoulders[i].rotation.x=0;shoulders[i].rotation.z=i===0?-.1:.1
    elbows[i].rotation.x=0;elbows[i].rotation.z=i===0?1.15:-1.15
    wrists[i].rotation.z=i===0?.15:-.15
   }
  }else if(action==='pick_up'){
   const reach=(1-Math.cos(t))/2;crouch(reach);spine.rotation.x=reach*.38;skull.rotation.x=reach*.3
   shoulders[1].rotation.x=-.3-reach*.7;elbows[1].rotation.x=-.1-reach*.3;reveal(parcel,phase>=.5)
  }else if(action==='hold_item'||action==='give_gift'){
   shoulders[1].rotation.x=-.8;elbows[1].rotation.x=-.7;reveal(parcel,true)
   if(action==='give_gift'){shoulders[1].rotation.x-=Math.sin(Math.PI*phase)*.35;elbows[1].rotation.x+=Math.sin(Math.PI*phase)*.3}
  }else if(action==='wave'){
   const gesture=Math.sqrt(Math.max(0,Math.sin(Math.PI*phase)));shoulders[0].rotation.z=(-2.35+Math.sin(t)*.2)*gesture;shoulders[0].rotation.x=-.1*gesture;elbows[0].rotation.z=Math.sin(t)*.25*gesture;elbows[0].rotation.x=-.2*gesture
  }else if(action==='cheer'){
   const gesture=Math.sqrt(Math.max(0,Math.sin(Math.PI*phase)));for(let i=0;i<2;i++){shoulders[i].rotation.z=(i===0?-1:1)*(2.15+Math.sin(t)*.15)*gesture;elbows[i].rotation.x=-.25*gesture}
   upper.position.y=Math.max(0,Math.sin(t))*1.2
  }else if(action==='clap'){
   for(let i=0;i<2;i++){shoulders[i].rotation.x=-1;shoulders[i].rotation.z=(i===0?1:-1)*(.22+(1+Math.cos(t))*.12);elbows[i].rotation.x=-.6;elbows[i].rotation.z=(i===0?1:-1)*.45}
  }else if(action==='dance'){
   stance.rotation.z=Math.sin(t)*.09;stance.position.x=Math.sin(t)*.75;upper.position.y=Math.sin(t*2)*.4
   spine.rotation.y=Math.sin(t)*.12;skull.rotation.z=Math.sin(t+.5)*.08
   for(let i=0;i<2;i++){const s=i===0?1:-1;shoulders[i].rotation.z=-s*(.55+Math.sin(t)*.3);hips[i].rotation.x=s*Math.sin(t)*.2;knees[i].rotation.x=Math.max(0,Math.sin(t)*s)*.3}
  }else if(action==='laugh'){
   const chuckle=Math.sin(t*2)
   upper.position.y=chuckle*.65;spine.rotation.x=.12+chuckle*.06;skull.rotation.x=-.2-chuckle*.05
   chest.scale.y=1+chuckle*.05;reveal(eyes,false);reveal(closedEyes,true);reveal(yawn,true)
   yawn.scale.set(1.45,.55+Math.max(0,chuckle)*.35,1)
   shoulders[0].rotation.set(-.65,0,-.15);elbows[0].rotation.set(-1.2,0,.7);wrists[0].rotation.z=.3
   shoulders[1].rotation.set(-.25,0,.3);elbows[1].rotation.x=-.6
  }else if(action==='inspect'){
   skull.rotation.y=Math.sin(t)*.15;skull.rotation.x=.09;shoulders[0].rotation.x=-.5;elbows[0].rotation.x=-1.65
  }else if(action==='sad'){
   spine.rotation.x=.16;skull.rotation.x=.22+Math.sin(t*2)*.06
   chest.scale.y=1+Math.sin(t*3)*.035;upper.position.y=Math.sin(t*3)*.35
   reveal(eyes,false);reveal(closedEyes,true)
   shoulders[0].rotation.set(-1.15,0,.3);elbows[0].rotation.set(-1.25,0,.45);wrists[0].rotation.z=Math.sin(t*2)*.2
   shoulders[1].rotation.x=.1;elbows[1].rotation.x=-.08
  }else if(action==='happy'){
   const hop=Math.max(0,Math.sin(t)),anticipation=Math.max(0,-Math.sin(t))
   crouch(anticipation*.2);stance.position.y=hop*4
   reveal(eyes,false);reveal(closedEyes,true)
   for(let i=0;i<2;i++){shoulders[i].rotation.z=(i===0?-1:1)*(1.4+hop*.7);elbows[i].rotation.x=-.2;knees[i].rotation.x+=hop*.3}
   skull.rotation.x=-.1
  }else if(action==='gentle_approach'){
   spine.rotation.x=.13;skull.rotation.x=.1;upper.position.y-=1
   for(let i=0;i<2;i++){shoulders[i].rotation.x=-.3;elbows[i].rotation.x=-.45;wrists[i].rotation.x=.12}
  }else if(action==='power_up'||action==='power_run'){
   const breathe=(1-Math.cos(t))/2,rumble=Math.sin(t*4)*.17
   if(!locomoting&&!running)crouch(.35+breathe*.12)
   stance.position.x=rumble*(locomoting?.4:1);spine.rotation.x=-.05-breathe*.04
   chest.scale.set(1+breathe*.055,1+breathe*.045,1+breathe*.065)
   skull.rotation.x=.1+Math.sin(t*2)*.025;skull.rotation.y=0
   eyes.scale.y=.78;reveal(angryBrows,true);reveal(yawn,true);yawn.scale.set(1.3,.55+breathe*.25,1)
   for(let i=0;i<2;i++){
    const side=i===0?-1:1
    hips[i].position.x=side*(locomoting||running?2.6:3.65)
    shoulders[i].rotation.set(-.2,0,side*(.48+breathe*.06))
    elbows[i].rotation.set(-1.4-breathe*.12,0,-side*.18)
    wrists[i].rotation.set(-.15,0,-side*.2);reveal(powerFists[i],true)
   }
  }else if(action==='angry'){
   reveal(angryBrows,true);spine.rotation.x=.08;skull.rotation.x=.05
   chest.scale.z=1+Math.sin(t*2)*.055
   for(let i=0;i<2;i++){shoulders[i].rotation.z=i===0?-.25:.25;elbows[i].rotation.z=i===0?1.2:-1.2;elbows[i].rotation.x=-.1}
   skull.rotation.y=Math.sin(t)*.08
  }else if(action==='surprised'){
   const startle=Math.pow(Math.max(0,Math.sin(t)),2)
   stance.position.y=startle*2.5;spine.rotation.x=-.1-startle*.08;skull.rotation.x=-.12
   reveal(yawn,true);yawn.scale.set(.9,.8,1);eyes.scale.y=1.3
   for(let i=0;i<2;i++){
    shoulders[i].rotation.z=(i===0?-1:1)*(.7+startle*.35)
    shoulders[i].rotation.x=-.4;elbows[i].rotation.x=-1.1;knees[i].rotation.x=startle*.22
   }
  }else if(action==='sick'){
   const cough=Math.pow(Math.max(0,Math.sin(t*2)),3)
   spine.rotation.x=.2+cough*.14;skull.rotation.x=.13+cough*.12;upper.position.y=-cough*.5
   reveal(eyes,false);reveal(closedEyes,true);reveal(yawn,true);yawn.scale.set(.7,.4+cough*.4,1)
   shoulders[0].rotation.set(-1.3,0,.3);elbows[0].rotation.set(-1.35,0,.4);wrists[0].rotation.x=.2
   shoulders[1].rotation.set(-.5,0,-.1);elbows[1].rotation.x=-1.1
  }else if(action==='tired'){
   const yawning=(1-Math.cos(t))/2
   spine.rotation.x=.11;skull.rotation.x=-yawning*.15
   reveal(eyes,false);reveal(closedEyes,true);reveal(yawn,true);yawn.scale.y=.35+yawning*.8
   shoulders[0].rotation.set(-1.4,0,.3);elbows[0].rotation.set(-1.3,0,.45);wrists[0].rotation.x=.2
   shoulders[1].rotation.x=.12;chest.scale.y=1+Math.sin(t)*.045
  }
  if(locomoting){upper.position.y=walkingY-(action==='gentle_approach'?1:0);for(const {node,p,q} of walkingLegs){node.position.copy(p);node.quaternion.copy(q)}}
  if(running&&['run','power_run','rescue_dash','power_up'].includes(action)){
   // Action layers can brace the torso, but do not introduce a second arm cycle.
   spine.rotation.x=action==='rescue_dash'?.32:gaitPose.lean;skull.rotation.x=gaitPose.headPitch
   for(let i=0;i<2;i++){shoulders[i].rotation.copy(strideArms[i].shoulder);elbows[i].rotation.copy(strideArms[i].elbow);wrists[i].rotation.copy(strideArms[i].wrist);reveal(powerFists[i],action!=='run')}
  }
  if(goldenHair&&superEyes){
   const powered=action==='power_up'||action==='power_run'
   reveal(hairRoot,!powered);reveal(goldenHair,powered);reveal(superEyes,powered)
   if(powered){reveal(eyes,false);superEyes.scale.y=.85}
  }
  hems.forEach((hem,index)=>{hem.rotation.x=Math.sin(t+index*Math.PI)*(walking?.12:.025)})
  if(longHair){
   const lean=spine.rotation.x+skull.rotation.x
   longHair.roots.forEach((root,index)=>{root.rotation.x=-lean*.55+Math.sin(t+index*.4)*(walking?.045:.025);root.rotation.z=Math.sin(t+index*.5)*(walking?.06:.025)})
   longHair.tails.forEach((tail,index)=>{tail.rotation.x=Math.sin(t+.6+index*.4)*(walking?.09:.035);tail.rotation.z=Math.sin(t+.8+index*.4)*.04})
  }
  if(gown){
   const waist=(hips[0].position.y+hips[1].position.y)/2+1.1
   const gathered=T.MathUtils.clamp((waist-1.7)/12.6,.28,1.1)
   gown.position.y=waist;gown.scale.set(1+(1-gathered)*.18,gathered,1+(1-gathered)*.12)
   gown.rotation.z=Math.sin(t)*(walking?.025:.01);gown.rotation.y=Math.sin(t)*.025
   if(action==='sleep'){gown.scale.x=.9;gown.scale.z=.6}
  }
  for(const {root,elbow,side} of angelWings){
   const folded=['sit','sleep','pet','feed','water','clean','pick_up'].includes(action)
   const flourish=['happy','float','dance','cheer'].includes(action)
   root.rotation.y=side*(folded?.65:.12+Math.sin(t)*(flourish?.3:walking?.13:.07))
   root.rotation.z=side*(.04+Math.sin(t)*.03)
   elbow.rotation.y=side*(folded?.35:.04);elbow.rotation.z=side*Math.sin(t+.4)*.04
   if(action==='sleep'){root.position.z+=5.5;root.scale.set(.45,.72,.7);root.rotation.y=side*.35}
  }
  if(headwear&&appearance.parts?.headwear==='halo'){
   headwear.position.y=(['spiky','hero-spikes'].includes(appearance.parts?.hair??'')?6:0)+Math.sin(t)*.25
   headwear.rotation.x=-(stance.rotation.x+spine.rotation.x+skull.rotation.x)
  }

  if(headwear&&appearance.parts?.headwear==='wide-brim')reveal(headwear,action!=='sleep')
  if(equippedSword){
   const inHand=['idle','walk','inspect'].includes(action)
   reveal(equippedSword.held,inHand);reveal(equippedSword.stowed,!inHand&&action!=='sleep')
   if(inHand){shoulders[1].rotation.x-=.15;elbows[1].rotation.x=Math.min(elbows[1].rotation.x,-.45);wrists[1].rotation.x=-.1;equippedSword.held.rotation.x=.1}
  }
 }
 pose('idle',0);return {kind:'rescuer',root,nodes,pose}
}
export function createCat(appearance:AppearanceOptions={}):Rig{
 const feline=catOptions(appearance.cat),C={...BASE_COLORS,...catBreedColors(feline.breed),...appearance.colors}
 const face=appearance.face??{leftEye:feline.pattern==='colorpoint'?C.shirtLight:C.gold,rightEye:feline.pattern==='colorpoint'?C.shirtLight:C.gold,nose:C.skinShadow,marking:C.ink}
 const tabby=['mackerel','classic-tabby'].includes(feline.pattern),pointed=feline.pattern==='colorpoint',persian=feline.breed==='persian',slim=feline.breed==='siamese'
 const {root,nodes,group,part,round}=author('orange-tabby'),stance=group('CatStance',root),upper=group('CatUpperBody',stance),chest=group('CatBreath',upper,0,8.4,-1.4)
 root.scale.setScalar(catBodyScale(feline.bodySize))
 catCoat(round('Body',chest,C.orange,0,0,0,slim?9.1:persian?12.5:10.7,persian?10.5:9.6,slim?17:16),C,feline,'body')
 part('BackFurLight',chest,C.furLight,-2.1,4.1,-1.8,1.1,.7,3.7,.2)
 part('HaunchFurLight',chest,C.furLight,-2.7,2.9,-5.7,.9,1.2,1.6,.2)
 if(tabby)for(const s of [-1,1])for(const z of [-4,0,4]){const stripe=part('TabbyBodyStripe',chest,C.stripe,s*4.9,1.3,z,1,3.8,1.5,.08);stripe.rotation.z=s*.25}
 if(tabby)for(const z of [-5,-1,3])part('TabbyDorsalStripe',chest,C.stripe,0,4.8,z,1.8,.45,3.9,.08)
 round('WhiteBib',upper,C.cream,0,7,5.6,5.8,5.5,2.8)
 const head=group('CatHead',upper,0,12,6)
 catCoat(round('CatFace',head,C.orange,0,0,0,persian?14.1:slim?11.3:12.3,persian?11:10.2,persian?9:10),C,feline,'head')
 part('CheekFurLight',head,C.furLight,-3.4,1.1,3.8,1.1,1.5,.4,.15)
 const muzzle=group('MuzzleNod',head)
 round('WhiteMuzzle',muzzle,pointed?C.stripe:C.cream,0,-2.1,persian?3.8:4.25,persian?8:7.4,4.1,persian?1.3:2)
 part('MuzzleEdgeShade',muzzle,C.creamShadow,2.7,-2.3,4.8,.8,1.7,.4,.15)
 const facePlane=persian?4.85:5.8
 const eyes=group('CatEyeBlink',head,0,-.15,facePlane-.1)
 const closedEyes=group('CatContentEyes',head,0,-.15,facePlane-.1)
 for(const s of [-1,1])part('ContentEye',closedEyes,C.ink,s*2.8,0,0,1.9,.6,.25,.05)
 reveal(closedEyes,false)
 const angryBrows=group('CatAngryBrows',head,0,1.2,facePlane-.1)
 for(const s of [-1,1]){const brow=part('CatBrow',angryBrows,C.ink,s*2.8,0,0,2.2,.6,.3,.04);brow.rotation.z=s*.35}
 reveal(angryBrows,false)
 const yawn=group('CatYawn',head,0,-2.3,facePlane+.05)
 round('CatOpenMouth',yawn,C.ink,0,0,0,2.1,2,.4);reveal(yawn,false)
 const ears:T.Group[]=[]
 for(const s of [-1,1]){
  part('CatEye',eyes,C.ink,s*2.8,0,0,2,2.1,.25,.03)
  part('CatIris',eyes,s<0?face.rightEye:face.leftEye,s*2.8,-.1,.17,1.55,1.9,.15,.03)
  part('CatPupil',eyes,C.ink,s*2.8,-.05,.27,.55,1.7,.15,.02)
  part('EyeCatchlight',eyes,C.cream,s*2.8-.35,.55,.36,.45,.5,.1,.02)
  const ear=group(s<0?'EarLeft':'EarRight',head,s*(persian?4.5:4),4.4,-.2)
  ears.push(ear);ear.rotation.z=-s*(slim?.27:.15)
  const earMesh=new T.Mesh(new T.ConeGeometry(persian?2.4:2.7,slim?6.8:persian?4.2:5,3),new T.MeshBasicMaterial({color:pointed?C.stripe:C.orange,toneMapped:false}))
  earMesh.name='PointedEar'+s;ear.add(earMesh)
  part('EarInside',ear,C.skinShadow,0,-.3,1,1.3,slim?3:2.1,.3,.15)
  if(tabby)for(let i=0;i<2;i++)part('CheekStripe',head,C.stripe,s*(4.4+i*.35),-.2-i*1.2,4.1-i*.35,1.3,.65,.45,.05)
  for(let i=0;i<2;i++){const whisker=part('Whisker',head,C.creamShadow,s*5.9,-1.3-i*.85,3.3,2.8,.3,.25,.03);whisker.rotation.z=s*(i?.1:-.12)}
 }
 part('Nose',head,face.nose,0,-1.3,facePlane,1.15,.85,.4,.1);part('Mouth',muzzle,C.ink,0,-2.5,facePlane-.15,1.1,.4,.15,.03)
 if(feline.faceMarking==='mustache'||feline.faceMarking==='split-mustache')for(const side of [-1,1]){
  const curl=part('MustacheMarking',head,face.marking,side*1.35,-1.95,facePlane+.05,2.05,.85,.23,.08)
  curl.rotation.z=side*.22
  part('MustacheOuterCurl',head,face.marking,side*2.35,-1.6,facePlane-.08,.8,.65,.22,.05)
  if(feline.faceMarking==='mustache')part('MustacheBridge',head,face.marking,side*.45,-1.75,facePlane+.1,.65,.6,.22,.04)
 }
 if(feline.faceMarking==='tuxedo'){
  part('FaceBlaze',head,C.cream,0,.65,facePlane-.65,1.2,3.8,.35,.1)
  for(const side of [-1,1])round('TuxedoMuzzlePatch',head,C.cream,side*1.7,-1.8,facePlane-.7,3.6,2.4,1.5)
 }
 if(feline.faceMarking==='freckles')for(const side of [-1,1])for(const [x,y] of [[1.4,-1.7],[2.5,-2],[1.9,-2.6]])part('MuzzleFreckle',head,face.marking,side*x,y,facePlane+.1,.42,.42,.17,.02)
 if(tabby){
  for(const x of [-2,0,2]){const stripe=part('ForeheadM',head,C.stripe,x,2.7,4.2,.9,2.6,.55,.05);stripe.rotation.z=x*.23}
  for(const s of [-1,1]){const stroke=part('ForeheadMJoin',head,C.stripe,s,3.3,4.1,1.5,.8,.6,.05);stroke.rotation.z=s*.48}
 }
 const legs:T.Group[]=[],paws:T.Group[]=[]
 for(const s of [-1,1])for(const front of [false,true]){const name=(s<0?'Left':'Right')+(front?'Front':'Back'),leg=group('Leg'+name,stance,s*3.2,6.4,front?4.4:-5.5);legs.push(leg);part('LegFur',leg,pointed?C.stripe:C.orange,0,-2.3,0,2.6,4.6,2.8,.45);const paw=group('Paw'+name,leg,0,-4.5,.4);paws.push(paw);part('CreamPaw',paw,pointed?C.stripe:C.cream,0,-.85,.3,2.9,1.7,3.7,.4);if(tabby)part('LegStripe',leg,C.stripe,0,-2.8,1.48,2.7,.8,.4,.08)}
 const tail=group('CatTail',upper,2.7,9,-8),tip=group('CatTailTip',tail,0,5.2,-1)
 const plume=feline.tail==='plume',shortTail=feline.tail==='bobtail'||feline.tail==='stub',tailColor=pointed?C.stripe:C.orange
 part('TailBase',tail,tailColor,0,2.3,-.3,plume?3.8:2.4,5.7,plume?3.8:2.4,.55)
 round('TailTip',tip,tailColor,0,1.4,0,plume?4.7:2.3,4.2,plume?4.7:2.3)
 if(tabby)for(const y of [.7,2.6,4.5])part('TailRing',tail,C.stripe,0,y,-.3,plume?3.9:2.5,.8,plume?3.9:2.5,.1)
 if(tabby)for(const y of [0,1.8,3.2])part('TailTipRing',tip,C.stripe,0,y,0,plume?4.6:2.4,.65,plume?4.6:2.4,.1)
 if(shortTail){tail.scale.y=feline.tail==='stub'?.22:.4;tip.scale.setScalar(.0001)}
 else if(plume){for(let i=0;i<4;i++)part('TailPlumeTuft',tip,i%2?C.furLight:tailColor,i%2?1.5:-1.5,i*.8,0,2.5,2,3,.25)}
 else tail.scale.y=1.2
 const details=attachCatDetails({colors:C,group,part,round,paint:mesh=>mesh,shade:paintedShading},feline,upper,chest,head,paws,ears)
 const bowl=group('CareBowl',stance,0,1,8.8)
 round('BowlBase',bowl,C.shirtDark,0,0,0,8,1.9,6)
 round('BowlRim',bowl,C.cream,0,.7,0,7.7,.65,5.7)
 round('BowlContents',bowl,C.kibble,0,1.05,0,6.1,.5,4.4)
 const water=group('WaterSurface',bowl,0,1.35,0);round('Water',water,C.shirt,0,0,0,6.2,.3,4.5)
 const haunches=group('SeatedHaunches',upper,0,4.2,-2.8)
 round('Haunches',haunches,C.orange,0,0,0,10.7,6.8,9.5)
 reveal(haunches,false)
 reveal(bowl,false);reveal(water,false)
 const reset=restPose(nodes)
 function pose(action:string,phase:number,layers:RigPoseOptions={}){
  reset()
  const locomoting=usesWalkingLegs(action)&&typeof layers.locomotionPhase==='number',stride=(locomoting?layers.locomotionPhase!:phase)*Math.PI*2
  const t=phase*Math.PI*2,running=action==='run'||layers.gait==='run',walking=action==='walk'||action==='run'||locomoting
  upper.position.y=walking?Math.cos(stride*2)*(running?.35:.12):Math.sin(t)*.16;chest.scale.y=1+(walking?0:Math.sin(t)*.025);head.rotation.x=walking?-.025:Math.sin(t)*.02;head.rotation.y=walking?0:Math.sin(t)*.025;eyes.scale.y=!walking&&phase>=.75&&phase<.875?.12:1;tail.rotation.z=Math.sin(t)*(feline.tailMotion==='swish'?.45:walking?.12:.2);tail.rotation.x=feline.tailMotion==='upright'?-.2:.2;tip.rotation.z=Math.sin(t+.6)*.28;tip.rotation.x=-.4;for(let i=0;i<legs.length;i++){const a=walking?Math.sin(stride+(i===0||i===3?0:Math.PI))*(running?.7:.42):0;legs[i].rotation.x=a;paws[i].rotation.x=-a}
  const strideLegs=locomoting?[...legs,...paws].map(node=>({node,p:node.position.clone(),q:node.quaternion.clone()})):[]
  if(action==='roll_yarn'){
   const roll=t
   stance.rotation.z=roll;stance.position.set(Math.sin(roll)*8,8-Math.cos(roll)*8,0)
   head.rotation.z=-.08;head.rotation.x=-.12
   for(let i=0;i<4;i++){legs[i].rotation.x=-.8+Math.sin(t*2+i)*.35;paws[i].rotation.x=.5}
   tail.rotation.x=-.5;tail.rotation.z=Math.sin(t)*.5
   reveal(eyes,false);reveal(closedEyes,true)
  }else if(action==='jump'||action==='pounce'){
   const motion=catJumpMotion(phase)
   stance.position.y=motion.lift*(action==='pounce'?6:10)-motion.crouch*1.5
   stance.rotation.x=action==='pounce'?-motion.lift*.22:Math.sin(phase*Math.PI*2)*.08
   chest.scale.y=1-motion.crouch*.08
   head.rotation.x=-motion.lift*.14;tail.rotation.x=.2+motion.lift*.4
   for(let i=0;i<4;i++){legs[i].position.y-=motion.crouch;legs[i].rotation.x=motion.lift*(i%2?-.5:.65);paws[i].rotation.x=-legs[i].rotation.x*.6}
  }else if(action==='knead'){
   head.position.y=10.6;head.rotation.x=.18;chest.rotation.x=.08
   reveal(eyes,false);reveal(closedEyes,true)
   for(const i of [1,3]){const press=Math.sin(t+(i===1?0:Math.PI));legs[i].position.y+=Math.max(0,press)*1.8;legs[i].rotation.x=-.18+press*.12;paws[i].rotation.x=.15}
   tail.rotation.z=Math.sin(t*.5)*.12
  }else if(action==='chase_tail'){
   stance.rotation.y=t;stance.rotation.z=Math.sin(t)*.1
   chest.rotation.y=.22;head.rotation.y=.65;tail.rotation.z=-.9;tip.rotation.z=-.85
   for(let i=0;i<4;i++){legs[i].rotation.x=Math.sin(t*2+(i===0||i===3?0:Math.PI))*.5;paws[i].rotation.x=-legs[i].rotation.x}
  }else if(action==='tail_wag'){
   tail.rotation.z=Math.sin(t)*.85;tip.rotation.z=Math.sin(t+.9)*.65
   head.rotation.y=Math.sin(t)*.05
  }else if(action==='sniff'){
   head.position.y=9.2;head.rotation.x=.28;head.rotation.y=Math.sin(t)*.22
   muzzle.position.z=Math.sin(t*3)*.18;ears.forEach((ear,i)=>{ear.rotation.x=Math.sin(t+i)*.12})
  }else if(action==='shake'){
   const shake=Math.sin(t*3)
   upper.rotation.z=shake*.14;head.rotation.y=shake*.35;chest.scale.x=1+Math.abs(shake)*.04
   tail.rotation.z=Math.sin(t*3+.6)*.5;ears.forEach((ear,i)=>{ear.rotation.z+=Math.sin(t*3+i)*.25})
  }else if(action==='fly'){
   stance.position.y=6+Math.sin(t)*.5;head.rotation.x=-.12
   for(let i=0;i<4;i++){legs[i].rotation.x=i%2?-.35:.5;paws[i].rotation.x=-legs[i].rotation.x*.7}
   tail.rotation.z=Math.sin(t)*.2
  }else if(action==='eat'||action==='drink'){
   const dip=(1-Math.cos(t))/2
   stance.position.z=-5.3;chest.rotation.x=.08+dip*.08
   head.position.set(Math.sin(t)*.35,10.4-3.6*dip+Math.sin(t*2)*.2,5.6+1.6*dip)
   head.rotation.x=.15+dip*.48;head.rotation.z=Math.sin(t)*.05
   muzzle.position.y=Math.sin(t*2)*.4;tail.rotation.z=Math.sin(t)*.24;tip.rotation.z=Math.sin(t+.7)*.45
   for(const i of [1,3]){legs[i].rotation.x=-dip*.06;paws[i].rotation.x=dip*.06}
   reveal(bowl,true);reveal(water,action==='drink')
  }else if(action==='sit'||action==='groom'||action==='float'||action==='ride'){
   const breathe=Math.sin(t)
   chest.position.set(0,8.1,-2.5);chest.scale.set(1.08,1.08+breathe*.05,.62)
   head.position.set(0,13.4+breathe*.25,3.6);head.rotation.x=-.05+breathe*.025
   reveal(haunches,true)
   tail.position.set(3.2,3.5,-4.2);tail.rotation.set(Math.PI/2,0,-.45+breathe*.06);tip.rotation.set(-.15,0,.75)
   for(const i of [0,2]){legs[i].position.y=3.9;legs[i].rotation.x=-1.1;paws[i].rotation.x=1.1}
   if(action==='groom'){head.rotation.x=.3+Math.sin(t*2)*.12;head.rotation.z=.12;legs[1].rotation.x=-1.8;legs[1].position.y=7.5;paws[1].rotation.x=-.4;reveal(eyes,false);reveal(closedEyes,true)}
   if(action==='float'){stance.position.y=3.5+breathe*.6;head.rotation.x=-.1}
   if(action==='ride'){stance.position.y=breathe*.2;head.rotation.x=-.08;tail.rotation.z=-.45+Math.sin(t)*.22}
  }else if(action==='sleep'||action==='lie_down'){
   const breathe=Math.sin(t)
   stance.position.z=-2;upper.position.y=-3.2+breathe*.25
   chest.scale.set(1.15,1.05+breathe*.1,.7);chest.rotation.y=.25
   head.position.set(2.7,8.7+breathe*.22,3.3);head.rotation.y=-.8;head.rotation.z=-.15;head.rotation.x=.1
   if(action==='sleep'){reveal(eyes,false);reveal(closedEyes,true)}
   for(let i=0;i<4;i++){legs[i].position.y=2.5;legs[i].rotation.x=-1.25;paws[i].rotation.x=1.25;legs[i].scale.y=.65}
   tail.position.set(2.7,5.8,-5.5);tail.rotation.set(Math.PI/2,0,-.55+breathe*.04);tip.rotation.set(-.15,0,.75)
  }else if(action==='pet'){
   const rub=Math.sin(t)
   upper.position.x=rub*.5;chest.scale.y=1.02+rub*.04
   head.rotation.x=-.2+rub*.12;head.rotation.y=rub*.2;head.rotation.z=rub*.16
   head.position.set(rub*.7,12.4+Math.max(0,rub)*.8,6)
   reveal(eyes,false);reveal(closedEyes,true);tail.rotation.z=rub*.5;tip.rotation.z=Math.sin(t+.7)*.4
   ears.forEach((ear,i)=>{ear.rotation.z+=Math.sin(t+.3+i*.25)*.12;ear.rotation.x=-.12+rub*.08})
  }else if(action==='happy'){
   const hop=Math.max(0,Math.sin(t));stance.position.y=hop*3;head.rotation.x=-.09
   reveal(eyes,false);reveal(closedEyes,true);tail.rotation.z=Math.sin(t*2)*.4
   for(let i=0;i<4;i++){legs[i].rotation.x=(i%2?-.3:.3)*hop;paws[i].rotation.x=-legs[i].rotation.x}
  }else if(action==='play'){
   chest.position.y=7.6+Math.sin(t)*.3;head.rotation.z=Math.sin(t)*.12;legs[1].rotation.x=-.9+Math.sin(t)*.6;paws[1].rotation.x=.4;tail.rotation.z=Math.sin(t)*.25
  }else if(action==='stretch'){
   const reach=(1-Math.cos(t))/2;chest.rotation.x=-.2*reach;head.position.y=12-4*reach;head.rotation.x=.12*reach;chest.scale.z=1+.12*reach
   for(const i of [1,3]){legs[i].rotation.x=-.65*reach;paws[i].rotation.x=.65*reach;legs[i].position.z+=2*reach}
  }else if(action==='scratch'||action==='climb'){
   chest.rotation.x=-.55;chest.position.y=9.5;head.position.y=14;head.position.z=3.8
   for(const i of [1,3]){legs[i].rotation.x=-1.6+Math.sin(t+(i===1?0:Math.PI))*.35;legs[i].position.y=9;paws[i].rotation.x=-.25}
   if(action==='climb')upper.position.y=Math.sin(t)*.35
  }else if(action==='sad'){
   head.position.y=10.6;head.rotation.x=.22;head.rotation.z=Math.sin(t*2)*.04
   chest.scale.y=1+Math.sin(t*3)*.035;tail.rotation.x=-1.05;tip.rotation.x=-.75
   reveal(eyes,false);reveal(closedEyes,true);ears.forEach(ear=>{ear.rotation.x=.4})
  }else if(action==='angry'){
   reveal(angryBrows,true);head.rotation.x=.06;head.rotation.y=Math.sin(t)*.06
   chest.scale.y=1.12+Math.sin(t*2)*.035;tail.rotation.z=Math.sin(t*2)*.32
   ears.forEach(ear=>{ear.rotation.x=.45})
  }else if(action==='dance'){
   stance.rotation.z=Math.sin(t)*.1;stance.position.x=Math.sin(t)*.75
   upper.position.y=Math.max(0,Math.sin(t*2))*.6;head.rotation.z=-Math.sin(t)*.12
   tail.rotation.z=Math.sin(t)*.4
   for(let i=0;i<4;i++){const a=Math.sin(t+(i===0||i===3?0:Math.PI))*.5;legs[i].rotation.x=a;paws[i].rotation.x=-a}
  }else if(action==='surprised'){
   const startle=Math.pow(Math.max(0,Math.sin(t)),2)
   stance.position.y=startle*3;chest.scale.y=1.12+startle*.05
   head.position.y=12.8+startle*.4;head.rotation.x=-.13;eyes.scale.y=1.4
   reveal(yawn,true);yawn.scale.set(.8,.65,1)
   ears.forEach(ear=>{ear.rotation.x=-.2;ear.rotation.z*=.3})
   tail.rotation.x=.15;tip.rotation.x=-.1
   for(let i=0;i<4;i++){legs[i].rotation.x=(i%2?-.35:.35)*startle;paws[i].rotation.x=-legs[i].rotation.x}
  }else if(action==='laugh'){
   const chuckle=Math.sin(t*2)
   upper.position.y=chuckle*.4;chest.scale.y=1+chuckle*.065
   head.rotation.x=-.16-chuckle*.08;head.rotation.z=Math.sin(t)*.08
   reveal(eyes,false);reveal(closedEyes,true);reveal(yawn,true);yawn.scale.set(1.4,.55+Math.max(0,chuckle)*.35,1)
   tail.rotation.z=Math.sin(t*2)*.35;ears.forEach(ear=>{ear.rotation.x=-.1})
  }else if(action==='sick'){
   const cough=Math.pow(Math.max(0,Math.sin(t*2)),3)
   head.position.y=10.4-cough*.6;head.rotation.x=.16+cough*.15;upper.position.y=-cough*.4
   chest.scale.y=1+Math.sin(t)*.05;tail.rotation.x=-.9;tip.rotation.x=-.65
   reveal(eyes,false);reveal(closedEyes,true);reveal(yawn,true);yawn.scale.set(.7,.3+cough*.45,1)
   ears.forEach(ear=>{ear.rotation.x=.4})
  }else if(action==='tired'){
   const yawning=(1-Math.cos(t))/2
   head.position.y=10.7;head.rotation.x=-yawning*.12;chest.scale.y=1+Math.sin(t)*.065
   reveal(eyes,false);reveal(closedEyes,true);reveal(yawn,true);yawn.scale.y=.3+yawning
   ears.forEach(ear=>{ear.rotation.x=.25});tail.rotation.x=-.8
  }
  if(locomoting)for(const {node,p,q} of strideLegs){node.position.copy(p);node.quaternion.copy(q)}
  for(const wing of details.wings){
   const folded=['sleep','lie_down','groom','roll_yarn'].includes(action),flying=action==='fly'
   wing.root.rotation.y=wing.side*(folded?1.05:.25)
   wing.root.rotation.z=wing.side*(flying?Math.sin(t)*.7:.12+Math.sin(t)*.07)
   wing.tip.rotation.z=wing.side*(flying?Math.sin(t+.6)*.35:.08)
  }
 }
 pose('idle',0);return {kind:'orange-tabby',root,nodes,pose}
}
/** Original compact neighborhood hatchback, using the actors' exact materials. */
export function createEmoteCar(){
 const {root,group,part,round}=author('rescuer');root.name='PawTrailRooftopHatchback'
 const body=group('CarSuspension',root),wheels:T.Group[]=[]
 part('Undercarriage',body,C.ink,0,4.8,0,23,2.4,43,.6)
 part('OrangeBody',body,C.orange,0,9.3,0,26,8.8,50,2)
 part('LowerSill',body,C.stripe,0,6.3,0,26.4,1.8,46,.45)
 part('Hood',body,C.shortsLight,0,13.3,18.5,24,1.6,12,.7)
 part('HoodCenterSeam',body,C.orange,-.4,14.2,18.5,.7,.25,10,.08)
 part('HatchDeck',body,C.shortsLight,0,13.1,-19,24,1.4,10,.6)
 part('CabinGlass',body,C.shirtDark,0,16.6,-3,22,7.8,24,1)
 const windshield=part('Windshield',body,C.shirt,0,17.1,9.4,19.6,5.5,.6,.2);windshield.rotation.x=-.22
 part('WindshieldSkyReflection',body,C.shirtLight,-5.2,18.3,9.25,5.5,.6,.8,.1)
 part('WiperLeft',body,C.ink,-4.2,14.7,10.2,5,.4,.4,.05)
 part('WiperRight',body,C.ink,4.2,14.7,10.2,5,.4,.4,.05)
 part('CreamRoof',body,C.cream,0,21,-3,23.5,1.8,25.5,.9)
 part('RoofEdge',body,C.creamShadow,0,20,-3,23.8,.7,25.8,.25)
 part('RoofPawPad',body,C.shirt,0,22,-3,4,.25,4,.6)
 for(const [x,z] of [[-2,-5],[0,-6],[2,-5]])round('RoofPawToe',body,C.shirt,x,22,z,1.4,.35,1.5)
 for(const side of [-1,1]){
  part('RoofRail',body,C.shoe,side*9.3,22.5,-3,.8,.9,23,.15)
  part('SideWindows',body,C.shirt,side*11.25,17,-3,.5,5,19,.15)
  part('WindowTopGlint',body,C.shirtLight,side*11.57,19,-3,.25,.55,16,.05)
  part('WindowPillar',body,C.creamShadow,side*11.63,17,-3,.5,6,1,.08)
  part('DoorHandle',body,C.cream,side*13.1,11.5,-2,.5,.8,2.8,.1)
  for(const z of [-11,5])part('DoorSeam',body,C.stripe,side*13.02,10.7,z,.3,4.6,.4,.04)
  part('WingMirrorStalk',body,C.ink,side*13.8,14.6,7,2.4,.6,.7,.1)
  part('WingMirror',body,C.orange,side*15,15.2,7,2,2,3.4,.4)
  part('MirrorGlass',body,C.creamShadow,side*15.1,15.3,5.25,1.7,1.4,.3,.08)
  part('SideCreamStripe',body,C.cream,side*13.15,8.3,0,.4,.65,42,.1)
  part('Headlight',body,C.cream,side*8.1,10,25.2,5.5,2.6,.7,.4)
  part('HeadlightLens',body,C.shortsLight,side*9.5,10,25.65,.55,1.8,.25,.08)
  part('RearLight',body,C.jacketLight,side*9.8,10,-25.2,3.2,3,.7,.25)
  part('RearIndicator',body,C.cream,side*9.8,10.8,-25.65,2.5,.55,.25,.08)
  for(const axle of [-16.5,16.5]){
   const wheel=group('Wheel_'+side+'_'+axle,root,side*12.8,4.5,axle);wheels.push(wheel)
   const tire=new T.Mesh(paintedShading(new T.CylinderGeometry(4.5,4.5,3.3,12)),new T.MeshBasicMaterial({color:C.ink,vertexColors:true,toneMapped:false}))
   tire.rotation.z=Math.PI/2;wheel.add(tire)
   const hub=new T.Mesh(new T.CylinderGeometry(2.8,2.8,.4,12),new T.MeshBasicMaterial({color:C.creamShadow,toneMapped:false}));hub.rotation.z=Math.PI/2;hub.position.x=side*1.85;wheel.add(hub)
   for(let i=0;i<3;i++){const spoke=part('WheelSpoke',wheel,C.cream,side*2.1,0,0,.35,4.8,.6,.05);spoke.rotation.x=i*Math.PI/3}
   part('WheelCenter',wheel,C.shoe,side*2.3,0,0,.4,1.1,1.1,.1)
   part('OrangeValveMarker',wheel,C.orange,side*2.35,2.5,0,.4,.8,.8,.1)
  }
 }
 part('FrontGrille',body,C.ink,0,9.2,25.6,8,3.2,.6,.15)
 for(const y of [8.4,9.4,10.4])part('GrilleSlat',body,C.creamShadow,0,y,26,6.8,.3,.25,.05)
 part('FrontBumper',body,C.creamShadow,0,6.1,25.5,24,1.8,1.5,.4)
 part('RearBumper',body,C.creamShadow,0,6.1,-25.5,24,1.8,1.5,.4)
 part('RearWindow',body,C.shirt,0,17.2,-15.25,18.8,4.7,.55,.15)
 part('HatchHandle',body,C.cream,0,11.5,-25.6,3,.7,.4,.08)
 part('BlankFrontPlate',body,C.cream,0,6.5,26.5,4.8,1.4,.25,.05)
 return {root,pose:(phase:number)=>{body.position.y=Math.sin(phase*Math.PI*4)*.18;for(const wheel of wheels)wheel.rotation.x=phase*Math.PI*2}}
}

export function animationClips(r:Rig){
 const clips:T.AnimationClip[]=[]
 for(const [action,config] of Object.entries(actions[r.kind])){const duration=('frames' in config?Number(config.frames):8)/config.fps,times:number[]=[],tracks:T.KeyframeTrack[]=[],data=r.nodes.map(()=>({p:[] as number[],q:[] as number[],s:[] as number[]}))
  for(let f=0;f<=32;f++){times.push(f/32*duration);r.pose(action,config.repeat===0?f/32:(f%32)/32);r.root.updateMatrixWorld(true);r.nodes.forEach((n,i)=>{data[i].p.push(...n.position.toArray());data[i].q.push(...n.quaternion.toArray());data[i].s.push(...n.scale.toArray())})}
  r.nodes.forEach((n,i)=>{tracks.push(new T.VectorKeyframeTrack(n.name+'.position',times,data[i].p),new T.QuaternionKeyframeTrack(n.name+'.quaternion',times,data[i].q),new T.VectorKeyframeTrack(n.name+'.scale',times,data[i].s))});clips.push(new T.AnimationClip(action,duration,tracks))
 }
 r.pose('idle',0);return clips
}

/** Shared box geometry and hair maps outlive a single appearance edit. */
export function disposeRig(rig:Rig){
 const materials=new Set<T.Material>(),geometries=new Set<T.BufferGeometry>()
 rig.root.traverse(object=>{if(object instanceof T.Mesh){
  if(!object.geometry.userData.sharedActorGeometry)geometries.add(object.geometry)
  for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material)
 }})
 for(const geometry of geometries)geometry.dispose()
 for(const material of materials){
  const map=(material as T.MeshBasicMaterial).map
  if(map?.userData.actorKey&&--map.userData.actorUsers===0){hairPaintCache.delete(map.userData.actorKey);map.dispose()}
  else if(map?.userData.catCoat||map?.userData.actorOwned)map.dispose()
  material.dispose()
 }
 rig.root.removeFromParent()
}
