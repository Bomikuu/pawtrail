import { useEffect, useState, useSyncExternalStore } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActorAppearance } from '@/game/actor-rig/appearance'
import type { CreatorPreviewModel } from '@/game/creator/preview-models'
import { creatorPortraitCollection } from '@/game/creator/preview-models'
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
  const preview = useSyncExternalStore(actorComparison.subscribe, actorComparison.getSnapshot, actorComparison.getSnapshot)
  const collection = creatorPortraitCollection(model,preview.portraitCollection)
  const pose = resolvePortraitAngle(collection, preview.portraitPose)
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
      playerVoice={false}
      key={model + name}
      dialogue={{
        name:model==='peony'?'Rika Hoshino · Peony-7 cockpit':name,
        subtitle: 'Character dialogue preview',
        portraitCollection: collection,
        portraitPose: pose,
        portraitSubject: { kind: 'actor', appearance },
        text: model==='rika'||model==='peony'
          ? 'Peony is ready. We have fresh water, rescue carriers, and room for one more passenger. Let’s check the road together.\n\nTake your time with frightened animals. I can move a fallen beam, but earning their trust is the delicate part.\n\nAnother safe arrival. That is the score I care about. There is a quiet berth back at the hangar if they need to rest.'
          : model === 'mira'
          ? 'The glasshouses are quiet tonight. There is fresh water beneath the lantern; let’s check whether our small neighbors found it.\n\nYou can stay beside me. We will give the frightened ones room, and let them decide when they are ready.\n\nOne safe arrival is enough to make this a good evening. Come along; I kept a warm corner for them.'
          : model === 'aurelia'
          ? 'The sanctuary grows quiet after dusk. Walk with me; we should check the animals before the lanterns go out.\n\nLet the frightened ones come to us. A little patience, fresh water, and a safe place to rest are a fine beginning.\n\nYou need not carry every worry alone. Bring them home, and we will find a place for them together.'
          : model === 'sieghart'
          ? 'The road is quiet. Keep close until we reach the next camp.\n\nStrength is useful. Knowing when to lower your guard matters more. Give a frightened animal space.\n\nThere is room by the fire. Bring them along; I can spare another bowl.'
          : model === 'sieg'
          ? 'Storm’s turning. We should check the animals near the harbor before the rain reaches them.\n\nKeep your steps quiet. A frightened animal needs room to decide we can be trusted.\n\nThe lantern at the waystation stays lit. If you find someone who needs shelter, bring them there. I’ll make space.'
          : 'A little kindness can change an animal’s whole day. Let’s see who we can help around the neighborhood.\n\nLet’s head out together! The new area is full of interesting animals, and I think you’ll love it!\n\nA fresh bowl of water or a quiet place to rest can make a difference. When an animal needs a hand, we can find a kind way to help.',
      }}
      onClose={() => changeOpen(false)}
      onChoice={() => changeOpen(false)}
    />}
  </>
}
