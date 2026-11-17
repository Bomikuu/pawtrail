// Timed from the reference's relaxed stance: quicker inhale, softer/longer release.
const breathKeys=[[0,0],[.2,.38],[.44,1],[.65,.7],[.84,.18],[1,0]] as const
function breathAt(phase:number){
 const p=((phase%1)+1)%1
 const i=Math.max(0,breathKeys.findIndex((key,index)=>index>0&&key[0]>=p)-1)
 const a=breathKeys[i],b=breathKeys[i+1],span=b[0]-a[0],u=(p-a[0])/span
 const slope=(index:number)=>{
  if(index===0||index===breathKeys.length-1)return 0
  const prev=breathKeys[index-1],current=breathKeys[index],next=breathKeys[index+1]
  const left=(current[1]-prev[1])/(current[0]-prev[0]),right=(next[1]-current[1])/(next[0]-current[0])
  return left*right<=0?0:2*left*right/(left+right)
 }
 return(2*u*u*u-3*u*u+1)*a[1]+(u*u*u-2*u*u+u)*span*slope(i)+(-2*u*u*u+3*u*u)*b[1]+(u*u*u-u*u)*span*slope(i+1)
}
/** One relaxed breathing/weight-transfer cycle. Distances use the shared rig's units. */
export function humanIdle(phase:number,soleHeight=2.08){
 const t=(((phase%1)+1)%1)*Math.PI*2
 const inhale=breathAt(phase),follow=breathAt(phase-.065),weight=Math.sin(t+.35),lag=follow*2-1
 const pelvisX=weight*.23,pelvisZ=Math.cos(t-.2)*.055,hipY=soleHeight+10.35+inhale*.15
 const legs=([0,1] as const).map(i=>{
  const side=i===0?-1:1,y=hipY+side*weight*.018
  // These ankle targets never move: the body balances above a slightly staggered stance.
  const dx=side*.55-pelvisX,dy=soleHeight-y,dz=(i===0?.65:-.5)-pelvisZ
  const distance=Math.hypot(dx,dy,dz),a=5.5,b=5.3
  const clamp=(n:number)=>Math.max(-1,Math.min(1,n))
  const bend=Math.acos(clamp((a*a+distance*distance-b*b)/(2*a*distance)))
  const knee=Math.acos(clamp((distance*distance-a*a-b*b)/(2*a*b)))
  return{y,direction:[dx/distance,dy/distance,dz/distance] as [number,number,number],bend,knee,toeOut:side*.1}
 })
 return{legs,inhale,weight,lag,pelvisX,pelvisZ,bodyY:hipY-13,
  lean:.012-inhale*.028,roll:-weight*.004,shoulderLift:follow*.18,
  headPitch:-.006+follow*.014+Math.sin(t-.7)*.003,headYaw:Math.sin(t-.65)*.006}
}
