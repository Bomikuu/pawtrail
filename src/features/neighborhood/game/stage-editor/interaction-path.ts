import type { Point } from '../housing/types'

export function clearSegment(a:Point,b:Point,clear:(point:Point)=>boolean){
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3))
  for(let i=1;i<=steps;i++)if(!clear({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps}))return false
  return true
}
type Node={x:number;y:number;cost:number;score:number;parent?:Node}
/** Local 8px approach path; each edge uses the same foot-clearance sweep as walking. */
export function interactionPath(start:Point,end:Point,clear:(point:Point)=>boolean):Point[]|null{
  if(!clear(start)||!clear(end))return null
  if(clearSegment(start,end,clear))return [{...end}]
  const heap:Node[]=[],costs=new Map<string,number>()
  const keyOf=(point:Point)=>Math.round((point.x-start.x)/8)+','+Math.round((point.y-start.y)/8)
  const push=(node:Node)=>{heap.push(node);let index=heap.length-1;while(index){const parent=Math.floor((index-1)/2);if(heap[parent].score<=node.score)break;heap[index]=heap[parent];index=parent}heap[index]=node}
  const pop=()=>{const root=heap[0],last=heap.pop()!;if(heap.length){let index=0;while(index*2+1<heap.length){let child=index*2+1;if(child+1<heap.length&&heap[child+1].score<heap[child].score)child++;if(heap[child].score>=last.score)break;heap[index]=heap[child];index=child}heap[index]=last}return root}
  const first:Node={...start,cost:0,score:Math.hypot(end.x-start.x,end.y-start.y)};push(first);costs.set(keyOf(start),0)
  for(let visits=0;heap.length&&visits<12000;visits++){
    const node=pop(),key=keyOf(node)
    if(node.cost!==(costs.get(key)??Infinity))continue
    if(Math.hypot(end.x-node.x,end.y-node.y)<=12&&clearSegment(node,end,clear)){
      const path:Point[]=[{...end}];let current:Node|undefined=node
      while(current?.parent){path.push({x:current.x,y:current.y});current=current.parent}
      return path.reverse()
    }
    for(const dx of [-8,0,8])for(const dy of [-8,0,8]){
      if(!dx&&!dy)continue
      const next={x:node.x+dx,y:node.y+dy},cost=node.cost+Math.hypot(dx,dy),nextKey=keyOf(next)
      if(cost>=(costs.get(nextKey)??Infinity)||!clear(next)||!clearSegment(node,next,clear))continue
      costs.set(nextKey,cost);push({...next,cost,score:cost+Math.hypot(end.x-next.x,end.y-next.y),parent:node})
    }
  }
  return null
}
