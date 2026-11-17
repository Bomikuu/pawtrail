import * as T from 'three'
import type {StudioGeometry} from './model-document'
/** Actual thin curved geometry; both faces and the edge remain visible when rotated. */
function crescentGeometry(){
 const profile=new T.Shape();profile.moveTo(-.18,-.5)
 profile.bezierCurveTo(-.4,-.15,-.29,.21,.38,.5)
 profile.bezierCurveTo(-.02,.22,-.08,-.06,.08,-.32)
 profile.lineTo(-.18,-.5);profile.closePath()
 const geometry=new T.ExtrudeGeometry(profile,{depth:1,bevelEnabled:false,steps:1,curveSegments:10});geometry.translate(0,0,-.5)
 const positions=geometry.getAttribute('position'),uv=geometry.getAttribute('uv')
 for(let i=0;i<uv.count;i++)uv.setXY(i,positions.getX(i)+.5,positions.getY(i)+.5)
 return geometry
}
export function createStudioGeometry(kind:StudioGeometry['shape'],layout?:StudioGeometry['textureLayout']){
 const geometry=kind==='crescent'?crescentGeometry():kind==='sphere'?new T.SphereGeometry(.5,16,12):kind==='cylinder'?new T.CylinderGeometry(.5,.5,1,12):kind==='cone'?new T.ConeGeometry(.5,1,12):kind==='plane'?new T.PlaneGeometry(1,1):new T.BoxGeometry(1,1,1)
 if(kind==='box'&&layout==='box-2x2'){
  const uv=geometry.getAttribute('uv')
  // Three.js box faces: +X, -X, +Y, -Y, +Z, -Z. Canvas atlas origin is top-left.
  const faces=[[.5,.5],[.5,.5],[0,0],[0,0],[0,.5],[0,.5]]
  for(let face=0;face<6;face++)for(let vertex=0;vertex<4;vertex++){const i=face*4+vertex;uv.setXY(i,faces[face][0]+uv.getX(i)*.5,faces[face][1]+uv.getY(i)*.5)}
  uv.needsUpdate=true
 }
 const normals=geometry.getAttribute('normal'),colors:number[]=[]
 for(let i=0;i<normals.count;i++){const light=normals.getY(i)*.6+normals.getZ(i)*.25-normals.getX(i)*.2,shade=light<-.2?.68:light<.1?.84:light>.5?1.08:1;colors.push(shade,shade,shade)}
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));return geometry
}
