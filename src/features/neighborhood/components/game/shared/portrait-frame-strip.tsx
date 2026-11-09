import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { completePortraitFrameImages } from '@/features/neighborhood/game/actor-rig/photo-portrait-renderer'

type FrameState = 'rest' | 'half' | 'closed' | 'small' | 'open'
const states: { id: FrameState; label: string }[] = [
  { id: 'rest', label: 'Rest' }, { id: 'half', label: 'Half blink' },
  { id: 'closed', label: 'Closed blink' }, { id: 'small', label: 'Small speech' },
  { id: 'open', label: 'Open speech' },
]
/** Literal decoded complete images, without playback, for inspection. */
export function PortraitFrameStrip({ collectionId, revision, pose, emotion, onSelect }: {
  collectionId: string; revision: string; pose: string; emotion: string
  onSelect: (state: FrameState) => void
}) {
  const [images, setImages] = useState<Awaited<ReturnType<typeof completePortraitFrameImages>>>([])
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let cancelled = false
    setImages([]); setFailed(false)
    void completePortraitFrameImages(collectionId, revision, pose, emotion)
      .then(value => { if (!cancelled) setImages(value) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [collectionId, revision, pose, emotion])
  return <section aria-label="Exported asset frames" className="space-y-3 rounded-md border bg-card p-4">
    <div><h3 className="font-heading text-xl font-semibold">Exported asset frames</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">These are the complete images used for playback. Select one to inspect it at full size.</p></div>
    <div className="flex gap-2 overflow-x-auto pb-2">
      {states.map(state => {
        const image = images.find(value => value.state === state.id)
        return <Button key={state.id} variant="outline" disabled={!image} className="h-auto shrink-0 flex-col gap-2 rounded-md p-2 text-xs text-foreground" onClick={() => onSelect(state.id)}>
          {image ? <img src={image.png} alt="" aria-hidden="true" width={image.width} height={image.height} className="block bg-[#cdd0c2] [image-rendering:pixelated]"/>
            : <span aria-hidden="true" className="block h-30 w-24 animate-pulse rounded-md bg-muted motion-reduce:animate-none"/>}
          {state.label}
        </Button>
      })}
    </div>
    {failed && <p role="alert" className="text-xs text-muted-foreground">The frame images could not load. Reload the preview to try again.</p>}
  </section>
}
