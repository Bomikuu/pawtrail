import { useEffect, useRef } from 'react'
import { publish } from '@/features/neighborhood/game/store'
export function GameCanvas({ attempt }: { attempt: number }) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let canceled = false,
      game:
        | ReturnType<(typeof import('@/features/neighborhood/game/create-game'))['createGame']>
        | undefined
    publish({ phase: 'loading', load: 0, error: '' })
    import('@/features/neighborhood/game/create-game')
      .then(({ createGame }) => {
        if (!canceled && host.current) game = createGame(host.current)
      })
      .catch(() => {
        if (!canceled)
          publish({
            phase: 'error',
            error:
              'The neighborhood could not start. Please reload or try a browser with canvas support.',
          })
      })
    return () => {
      canceled = true
      game?.destroy(true)
    }
  }, [attempt])
  return (
    <div ref={host} className="absolute inset-0 overflow-hidden bg-[#6a9039]" />
  )
}
