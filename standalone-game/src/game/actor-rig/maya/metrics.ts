import { reference, type LandmarkPositions } from './reference'
export function comparePortrait(source:ImageData,render:ImageData,points:LandmarkPositions={}){
  const width=source.width,height=source.height,difference=new ImageData(width,height),silhouette=new ImageData(width,height)
  let intersection=0,union=0,error=0,pixels=0
  const edge=(data:Uint8ClampedArray,x:number,y:number)=>{
    if(data[(y*width+x)*4+3]<128)return false
    return [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>x+dx<0||y+dy<0||x+dx>=width||y+dy>=height||data[((y+dy)*width+x+dx)*4+3]<128)
  }
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4,a=source.data[i+3]/255,b=render.data[i+3]/255
    if(a>=.5&&b>=.5)intersection++
    if(a>=.5||b>=.5){union++;pixels++;for(let c=0;c<3;c++)error+=Math.abs((source.data[i+c]*a+245*(1-a))-(render.data[i+c]*b+245*(1-b)))}
    const delta=Math.max(...[0,1,2].map(c=>Math.abs(source.data[i+c]*a-render.data[i+c]*b)),Math.abs(a-b)*255)
    difference.data.set([Math.min(255,delta*3),Math.min(180,delta),Math.min(110,delta*.25),255],i)
    const se=edge(source.data,x,y),re=edge(render.data,x,y)
    silhouette.data.set(se&&re?[255,238,184,255]:se?[32,146,109,255]:re?[212,78,116,255]:[36,32,29,255],i)
  }
  const landmarks=reference.landmarks.map(item=>{
    const target:[number,number]=[item.pixel[0]*2,item.pixel[1]*2],actual=points[item.id]
    return {...item,target,actual,error:actual?Math.hypot(actual[0]-target[0],actual[1]-target[1]):null}
  })
  const clear=landmarks.filter(item=>item.confidence==='clear'&&item.error!==null)
  return {difference,silhouette,iou:union?intersection/union:0,meanColorError:pixels?error/(pixels*3):0,landmarks,meanLandmarkError:clear.length?clear.reduce((sum,item)=>sum+item.error!,0)/clear.length:null}
}
