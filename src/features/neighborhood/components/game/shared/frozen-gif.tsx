import { useEffect, useRef, useState } from 'react'
import { Cat } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Draw once, never export pixels: even a cross-origin GIF remains a still preview. */
export function FrozenGif({
  src,
  className,
  fit = 'contain',
}: {
  src: string
  className?: string
  fit?: 'contain' | 'cover'
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    const image = new Image()
    let cancelled = false
    setState('loading')
    image.referrerPolicy = 'no-referrer'
    image.onload = () => {
      const context = canvas.current?.getContext('2d')
      if (cancelled || !context || !image.naturalWidth || !image.naturalHeight)
        return
      const scale = (fit === 'cover' ? Math.max : Math.min)(
        64 / image.naturalWidth,
        64 / image.naturalHeight,
      )
      const width = image.naturalWidth * scale,
        height = image.naturalHeight * scale
      try {
        context.clearRect(0, 0, 64, 64)
        context.imageSmoothingEnabled = false
        context.drawImage(
          image,
          (64 - width) / 2,
          (64 - height) / 2,
          width,
          height,
        )
        setState('ready')
      } catch {
        setState('error')
      }
    }
    image.onerror = () => {
      if (!cancelled) setState('error')
    }
    image.src = src
    return () => {
      cancelled = true
      image.onload = null
      image.onerror = null
      image.src = ''
    }
  }, [src, fit])
  return (
    <span
      aria-hidden="true"
      className={cn('relative grid size-16 place-items-center', className)}
    >
      <canvas
        ref={canvas}
        width={64}
        height={64}
        className={cn(
          'size-full [image-rendering:pixelated]',
          state !== 'ready' && 'invisible',
        )}
      />
      {state !== 'ready' && (
        <Cat
          className={cn(
            'absolute size-6 text-muted-foreground',
            state === 'loading' && 'motion-safe:animate-pulse',
          )}
        />
      )}
    </span>
  )
}
