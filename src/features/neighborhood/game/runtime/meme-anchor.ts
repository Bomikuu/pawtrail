import type Phaser from 'phaser'
import {
  MEME_EVENT,
  MEME_ANCHOR_EVENT,
  MEME_LIFETIME,
  catMeme,
  type MemeRequest,
  type MemeAnchor,
} from '../cat-memes'

type ActorPoint = { x: number; y: number; active: boolean; visible: boolean }

/** Project GIF overlays through the current camera without putting foreign media in Phaser. */
export function installMemeAnchors(
  scene: Phaser.Scene,
  actor: (id: string) => ActorPoint | undefined,
) {
  const active = new Map<string, number>()
  const receive = (event: Event) => {
    const request = (event as CustomEvent<MemeRequest>).detail
    if (request && catMeme(request.id))
      active.set(request.actorId, Date.now() + MEME_LIFETIME)
  }
  const project = () => {
    if (!active.size) return
    const rect = scene.game.canvas.getBoundingClientRect()
    const view = scene.cameras.main.worldView
    for (const [actorId, until] of active) {
      if (until < Date.now()) {
        active.delete(actorId)
        continue
      }
      const point = actor(actorId)
      const x =
        point && view.width
          ? rect.left + ((point.x - view.x) / view.width) * rect.width
          : 0
      const feetY =
        point && view.height
          ? rect.top + ((point.y - view.y) / view.height) * rect.height
          : 0
      const y = feetY - (view.height ? (52 / view.height) * rect.height : 0)
      const visible =
        !!point?.active &&
        point.visible &&
        rect.width > 0 &&
        x >= rect.left &&
        x <= rect.right &&
        feetY >= rect.top &&
        feetY <= rect.bottom
      window.dispatchEvent(
        new CustomEvent<MemeAnchor>(MEME_ANCHOR_EVENT, {
          detail: {
            actorId,
            visible,
            viewportTop: rect.top,
            x: Math.max(rect.left + 56, Math.min(rect.right - 56, x)),
            y,
          },
        }),
      )
    }
  }
  const dispose = () => {
    active.clear()
    window.removeEventListener(MEME_EVENT, receive)
    scene.events.off('postupdate', project)
    scene.events.off('shutdown', dispose)
    scene.events.off('destroy', dispose)
  }
  window.addEventListener(MEME_EVENT, receive)
  scene.events.on('postupdate', project)
  scene.events.once('shutdown', dispose)
  scene.events.once('destroy', dispose)
}
