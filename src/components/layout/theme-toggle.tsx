'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => undefined
const clientSnapshot = () => true
const serverSnapshot = () => false

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot,
  )
  return (
    <Button
      variant="ghost"
      size="icon"
      className="theme-toggle size-11"
      aria-label="Dark mode"
      aria-pressed={mounted ? resolvedTheme === 'dark' : undefined}
      disabled={!mounted}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-5 dark:block" aria-hidden="true" />
    </Button>
  )
}
