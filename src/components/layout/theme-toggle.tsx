'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      className={'theme-toggle size-10'}
      aria-label="Dark mode"
      aria-pressed={resolvedTheme === 'dark'}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-5 dark:block" aria-hidden="true" />
    </Button>
  )
}
