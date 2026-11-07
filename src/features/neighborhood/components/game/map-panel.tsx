import { useEffect, useRef } from 'react'
import type { Progress } from '@/features/neighborhood/game/types'
export function WorldMap({ progress }: { progress: Progress }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let canceled = false
    const draw = async () => {
      const map = await fetch(
        '/pawtrail-game/maps/' + progress.position.scene + '.json',
      ).then((r) => r.json())
      const texture = new Image()
      texture.src = '/pawtrail-game/game-assets/terrain.png'
      await texture.decode()
      if (canceled || !ref.current) return
      const canvas = ref.current
      canvas.width = map.width * 8
      canvas.height = map.height * 8
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      map.layers[0].data.forEach((gid: number, i: number) => {
        const index = gid - 1
        ctx.drawImage(
          texture,
          (index % 16) * 32,
          Math.floor(index / 16) * 32,
          32,
          32,
          (i % map.width) * 8,
          Math.floor(i / map.width) * 8,
          8,
          8,
        )
      })
      for (const o of map.layers[2].objects) {
        const properties = Object.fromEntries(
          o.properties.map((p: { name: string; value: unknown }) => [
            p.name,
            p.value,
          ]),
        )
        if (!['building', 'portal', 'npc', 'exit'].includes(o.type)) continue
        ctx.fillStyle = o.type === 'building' ? '#a54922' : '#fae8ce'
        ctx.fillRect(o.x / 4 - 3, o.y / 4 - 3, 6, 6)
        if (o.type === 'building' || o.type === 'portal') {
          ctx.font = '8px sans-serif'
          ctx.fillStyle = '#321b1f'
          ctx.fillText(String(properties.label), o.x / 4 - 16, o.y / 4 + 10)
        }
      }
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(
        progress.position.x / 4,
        progress.position.y / 4,
        4,
        0,
        Math.PI * 2,
      )
      ctx.fill()
      ctx.strokeStyle = '#321b1f'
      ctx.stroke()
    }
    void draw().catch(() => {})
    return () => {
      canceled = true
    }
  }, [progress.position.scene, progress.position.x, progress.position.y])
  return (
    <div className="space-y-4">
      <canvas
        ref={ref}
        className="w-full rounded-xl border [image-rendering:pixelated]"
        role="img"
        aria-label="Map of your current area. White marker shows your position."
      />
      <p className="text-xs text-muted-foreground">
        White marker: you · terracotta: buildings · cream: neighbors and exits
      </p>
      <p className="text-sm">
        Garden:{' '}
        {progress.unlocks.includes('garden')
          ? 'unlocked, southwest gate'
          : 'finish Welcome to PawTrail'}
        . Riverside:{' '}
        {progress.unlocks.includes('riverside')
          ? 'unlocked, east park trail'
          : 'help restore the shelter'}
        .
      </p>
    </div>
  )
}
