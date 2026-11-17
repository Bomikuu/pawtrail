/** Painted 2D parts with pinned roots; face/body/grip remain intact artwork. */
export type IllustrationRigPart = {
  id: string
  rect: [number, number, number, number]
  offset: [number, number]
  root: [number, number]
  direction: [number, number]
  length: number
  amplitude: number
  phase: number
  cycles?: number
  pulse?: { min: number; max: number; cycles: number }
}
export type IllustrationMotionRig = {
  atlas: string
  cycleMs: number
  parts: IllustrationRigPart[]
}

type Point = { x: number; y: number }

function paintTriangle(context: CanvasRenderingContext2D, image: HTMLImageElement,
  rect: IllustrationRigPart['rect'], source: Point[], target: Point[]) {
  const [s0, s1, s2] = source, [d0, d1, d2] = target
  const sx1 = s1.x-s0.x, sy1 = s1.y-s0.y, sx2 = s2.x-s0.x, sy2 = s2.y-s0.y
  const determinant = sx1*sy2-sx2*sy1
  if (Math.abs(determinant) < .0001) return
  const dx1=d1.x-d0.x, dy1=d1.y-d0.y, dx2=d2.x-d0.x, dy2=d2.y-d0.y
  const a=(dx1*sy2-dx2*sy1)/determinant, b=(dy1*sy2-dy2*sy1)/determinant
  const c=(dx2*sx1-dx1*sx2)/determinant, d=(dy2*sx1-dy1*sx2)/determinant
  context.save()
  context.beginPath()
  // Tiny shared-edge overlap avoids antialiased cracks between adjacent quads.
  const center={x:(d0.x+d1.x+d2.x)/3,y:(d0.y+d1.y+d2.y)/3}
  target.forEach((point,index)=>{
    const x=point.x-center.x,y=point.y-center.y,length=Math.hypot(x,y)||1
    const px=point.x+x/length*.22,py=point.y+y/length*.22
    if(index)context.lineTo(px,py);else context.moveTo(px,py)
  })
  context.closePath();context.clip()
  context.transform(a,b,c,d,d0.x-a*s0.x-c*s0.y,d0.y-b*s0.x-d*s0.y)
  context.drawImage(image,...rect,0,0,rect[2],rect[3])
  context.restore()
}

export function drawIllustrationMotion(context: CanvasRenderingContext2D, image: HTMLImageElement,
  rig: IllustrationMotionRig, elapsedMs: number) {
  const clock=elapsedMs/rig.cycleMs*Math.PI*2
  for(const part of rig.parts){
    const partClock=clock*(part.cycles??1)
    const opacity=context.globalAlpha
    if(part.pulse)context.globalAlpha*=part.pulse.min+(part.pulse.max-part.pulse.min)*(.5+.5*Math.sin(clock*part.pulse.cycles+part.phase))
    const [width,height]=part.rect.slice(2),[ox,oy]=part.offset
    if(part.amplitude===0){context.drawImage(image,...part.rect,ox,oy,width,height);context.globalAlpha=opacity;continue}
    const magnitude=Math.hypot(...part.direction),dx=part.direction[0]/magnitude,dy=part.direction[1]/magnitude
    const horizontal=Math.abs(dx)>Math.abs(dy),columns=horizontal?12:3,rows=horizontal?3:12
    const original:Point[]=[],deformed:Point[]=[]
    for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++){
      const x=column/columns*width,y=row/rows*height
      const progress=Math.max(0,Math.min(1,((x+ox-part.root[0])*dx+(y+oy-part.root[1])*dy)/part.length))
      const flex=progress*progress
      const wave=Math.sin(partClock+part.phase-progress*1.35)*part.amplitude*flex
      const follow=Math.sin(partClock+part.phase-progress*1.75+.45)*part.amplitude*.13*flex
      original.push({x,y});deformed.push({x:x+ox-dy*wave+dx*follow,y:y+oy+dx*wave+dy*follow})
    }
    for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
      const a=row*(columns+1)+column,b=a+1,c=a+columns+1,d=c+1
      for(const ids of [[a,b,c],[b,d,c]])paintTriangle(context,image,part.rect,ids.map(i=>original[i]),ids.map(i=>deformed[i]))
    }
    context.globalAlpha=opacity
  }
}
