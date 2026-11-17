/** The wood frame stays in both states; selection adds a gently glowing pixel rim. */
export function CharacterIcon({src,active=false}:{src:string;active?:boolean}){
  return <span className="relative block size-12 shrink-0">
    <img src="/pawtrail-game/actor-studio/icons/pixel-frame.svg" width={48} height={48} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 size-12 [image-rendering:pixelated]"/>
    <img src={src} width={40} height={40} alt="" className="pointer-events-none absolute left-1 top-1 size-10 object-contain [image-rendering:pixelated]"/>
    {active&&<img src="/pawtrail-game/actor-studio/icons/pixel-frame-active.svg" width={48} height={48} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 size-12 drop-shadow-[0_0_6px_#f5b547] [image-rendering:pixelated] motion-safe:animate-pulse motion-reduce:animate-none"/>}
  </span>
}
