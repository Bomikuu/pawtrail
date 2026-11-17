import type {ItemSound} from '../items/document'
/** Short original cues. The caller owns cancellation; output uses the existing effects channel. */
export function playItemSound(ctx:AudioContext,destination:AudioNode,kind:ItemSound){
 const now=ctx.currentTime,duration=kind==='wave'?.42:kind==='swing'?.18:.13,gain=ctx.createGain(),osc=ctx.createOscillator(),filter=ctx.createBiquadFilter(),buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),samples=buffer.getChannelData(0)
 for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(1-i/samples.length)
 const noise=ctx.createBufferSource();noise.buffer=buffer;filter.type='bandpass';filter.frequency.setValueAtTime(kind==='wave'?900:kind==='swing'?2200:400,now);filter.frequency.exponentialRampToValueAtTime(100,now+duration)
 noise.connect(filter);filter.connect(gain);osc.type=kind==='impact'?'triangle':'sine';osc.frequency.setValueAtTime(kind==='wave'?260:kind==='swing'?180:110,now);osc.frequency.exponentialRampToValueAtTime(45,now+duration);osc.connect(gain);gain.connect(destination);gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.12,now+.01);gain.gain.exponentialRampToValueAtTime(.001,now+duration);noise.start(now);osc.start(now);noise.stop(now+duration);osc.stop(now+duration)
 let ended=false;osc.onended=()=>{ended=true;noise.disconnect();osc.disconnect();filter.disconnect();gain.disconnect()}
 return()=>{if(ended)return;gain.gain.cancelScheduledValues(ctx.currentTime);gain.gain.setTargetAtTime(0,ctx.currentTime,.01);try{noise.stop(ctx.currentTime+.04);osc.stop(ctx.currentTime+.04)}catch{}}
}
