import { useEffect, useState, useSyncExternalStore } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActorAppearance } from '@/game/actor-rig/appearance'
import type { CreatorPreviewModel } from '@/game/creator/preview-models'
import { actorComparison } from '@/game/runtime/actor-comparison-state'
import { GameDialogue } from './dialogue'
import { resolvePortraitAngle } from './shared/portrait-angle-select'

/** Uses the real dialogue HUD and selected actor's existing authored speech frames. */
export function ActorDialoguePreview({ name, appearance, model }: {
  name: string
  appearance: ActorAppearance
  model: CreatorPreviewModel
}) {
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dialogue') === '1')
  const collection = model === 'yae' ? 'yae-miko-refined-cel' : model === 'amber' ? 'amber-refined-cel' : undefined
  const selected = useSyncExternalStore(actorComparison.subscribe, () => actorComparison.getSnapshot().portraitPose, () => actorComparison.getSnapshot().portraitPose)
  const pose = resolvePortraitAngle(collection, selected)
  useEffect(() => {
    if (!open) return
    const wasPaused = actorComparison.getSnapshot().paused
    actorComparison.patch({ paused: true, inputX: 0, inputY: 0 })
    return () => actorComparison.patch({ paused: wasPaused, inputX: 0, inputY: 0 })
  }, [open])
  const changeOpen = (value: boolean) => {
    setOpen(value)
    const query = new URLSearchParams(window.location.search)
    if (value) query.set('dialogue', '1')
    else query.delete('dialogue')
    window.history.replaceState(null, '', window.location.pathname + '?' + query.toString())
  }
  return <>
    <Button type="button" variant="outline" onClick={() => changeOpen(true)}><MessageCircle className="size-4" />Dialogue</Button>
    {open && <GameDialogue
      key={model + name}
      dialogue={{
        name,
        subtitle: 'Character dialogue preview',
        portraitCollection: collection,
        portraitPose: pose,
        portraitSubject: { kind: 'actor', appearance },
        text: 'A little kindness can change an animal’s whole day. Let’s see who we can help around the neighborhood.\n\nLet’s head out together! The new area is full of interesting animals, and I think you’ll love it!\n\nA fresh bowl of water or a quiet place to rest can make a difference. When an animal needs a hand, we can find a kind way to help.',
      }}
      onClose={() => changeOpen(false)}
      onChoice={() => changeOpen(false)}
    />}
  </>
}
