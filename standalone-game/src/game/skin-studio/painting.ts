export type PaintTool='brush'|'eraser'|'pick'|'fill'
export type ModelPaintHit={part:string;x:number;y:number}
export type ModelPaintEvent={phase:'start'|'move'|'end';hits:ModelPaintHit[]}
export type ModelPaintOptions={mode:'orbit'|'paint';tool:PaintTool;brush:number;readOnly:boolean;surface?:string}
export const brushSizes=[1,2,4,8,12,16,24,32]

/** Hard circular stamps: whole native pixels only, including restoration. */
export function stampRound(canvas:HTMLCanvasElement,original:HTMLCanvasElement,x:number,y:number,size:number,color:string|null){
  const context=canvas.getContext('2d')!,radius=size/2,left=x-Math.floor(size/2),top=y-Math.floor(size/2),cx=left+radius
  context.fillStyle=color??'#000000'
  for(let row=0;row<size;row++){
    const y=top+row;if(y<0||y>=canvas.height)continue
    const dy=row+.5-radius,span=Math.sqrt(Math.max(0,radius*radius-dy*dy))
    const start=Math.max(0,Math.ceil(cx-span-.5)),end=Math.min(canvas.width-1,Math.floor(cx+span-.5))
    if(end<start)continue
    if(color===null){context.clearRect(start,y,end-start+1,1);context.drawImage(original,start,y,end-start+1,1,start,y,end-start+1,1)}
    else context.fillRect(start,y,end-start+1,1)
  }
}
export function floodFill(canvas:HTMLCanvasElement,x:number,y:number,color:string){
  const context=canvas.getContext('2d')!,{width,height}=canvas,image=context.getImageData(0,0,width,height),data=image.data,origin=(y*width+x)*4
  const old=Array.from(data.slice(origin,origin+4)),next=[1,3,5].map(index=>parseInt(color.slice(index,index+2),16)).concat(255)
  if(old.every((value,index)=>value===next[index]))return
  const queue=[y*width+x]
  while(queue.length){const pixel=queue.pop()!,at=pixel*4;if(!old.every((value,index)=>data[at+index]===value))continue;data.set(next,at);const xx=pixel%width,yy=Math.floor(pixel/width);if(xx)queue.push(pixel-1);if(xx<width-1)queue.push(pixel+1);if(yy)queue.push(pixel-width);if(yy<height-1)queue.push(pixel+width)}
  context.putImageData(image,0,0)
}
