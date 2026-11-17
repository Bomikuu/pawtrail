import type {ComponentProps} from 'react'
import {TooltipContent} from '@/components/ui/tooltip'
import {dialogueFrame} from './dialogue-frame'

/** Official tooltip behavior, decorated with the same frame artwork as DialogueHud. */
export function GameTooltipContent({className='',style,...props}:ComponentProps<typeof TooltipContent>){
 return <TooltipContent {...props} showArrow={false}
  className={'max-w-[min(20rem,calc(100vw-2rem))] rounded-md border-[8px] border-transparent bg-[#fff0d1] bg-clip-padding p-3 text-left text-[#57331d] shadow-xl [image-rendering:pixelated] motion-reduce:animate-none '+className}
  style={{...dialogueFrame('panel',24),...style}}/>
}
