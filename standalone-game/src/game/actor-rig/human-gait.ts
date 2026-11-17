/** Shared human gait. Distances are rig units; phase is one complete left/right cycle. */
export const HUMAN_GAIT={walkCycleDistance:78,runCycleDistance:100,blendMs:130,turnSpeed:12} as const
const tau=Math.PI*2
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
const smooth=(a:number,b:number,x:number)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)}
export function humanGait(phase:number,running:boolean){
 const cycle=((phase%1)+1)%1,t=cycle*tau,contact=running?.36:.61
 const pelvisX=-Math.sin(t)*(running?.28:.48),pelvisYaw=Math.sin(t)*(running?.13:.105),pelvisRoll=Math.sin(t)*(running?.025:.038)
 const stepBeat=(cycle*2)%1,flight=running?Math.sin(clamp((stepBeat-.72)/.28,0,1)*Math.PI)*.65:0
 const hipY=running?11.95+flight-Math.cos(t*2)*.18:12.6-Math.cos(t*2)*.2
 const legs=([0,1] as const).map(i=>{
  const side=i===0?-1:1,s=(cycle+i*.5)%1,stride=running?5.05:3.25
  let z:number,lift:number,pitch:number
  if(s<contact){
   const stance=s/contact
   z=stride*(1-2*stance)
   const toeOff=smooth(.7,1,stance)
   lift=toeOff*(running?.7:.22)
   pitch=-(running?.24:.15)*(1-smooth(0,.22,stance))+toeOff*(running?.48:.27)
  }else{
   const swing=(s-contact)/(1-contact)
   // A fast heel recovery followed by a softer reaching/landing phase.
   const travel=swing-Math.sin(tau*swing)/tau
   z=stride*(2*travel-1)
   lift=Math.sin(Math.PI*swing)**(running?1.05:1.25)*(running?3.6:1.45)
   pitch=(running?.5:.23)*(1-smooth(0,.48,swing))-(running?.2:.13)*smooth(.76,1,swing)
  }
  const ankleY=2.08*Math.cos(pitch)+Math.max(3.75*Math.sin(pitch),-1.85*Math.sin(pitch))+lift,down=Math.max(1,hipY-ankleY)
  const distance=clamp(Math.hypot(down,z),.4,10.79)
  const knee=Math.acos(clamp((distance*distance-5.5*5.5-5.3*5.3)/(2*5.5*5.3),-1,1))
  const hip=-Math.atan2(z,down)-Math.atan2(5.3*Math.sin(knee),5.5+5.3*Math.cos(knee))
  return{hip,knee,ankle:-hip-knee+pitch,y:hipY+side*Math.sin(t)*.055,z:-side*2.6*Math.sin(pelvisYaw),yaw:pelvisYaw,roll:pelvisRoll,ankleRoll:-pelvisRoll*.65}
 })
 const arms=([0,1] as const).map(i=>{
  const side=i===0?-1:1,a=t+i*Math.PI,wave=Math.cos(a-.12),lag=Math.cos(a-.46)
  return{
   shoulder:[wave*(running?.9:.43),side*.045+Math.sin(a-.2)*.055,side*(running?.12:.07)+Math.sin(a)*.025] as [number,number,number],
   elbow:[running?-1.32+lag*.21:-.23-Math.max(0,-lag)*.3,side*(running?.055:.025),side*(running?.055:.025)] as [number,number,number],
   wrist:[-.06+Math.sin(a-.65)*(running?.075:.04),Math.sin(a-.35)*.045,side*.025] as [number,number,number],
  }
 })
 return{legs,arms,pelvisX,pelvisYaw,pelvisRoll,bodyY:hipY-13,bodyZ:running?.35:.08,lean:running?.23:.065,torsoYaw:-pelvisYaw*.8,torsoRoll:-pelvisRoll*.55,headPitch:running?-.075:-.035}
}
