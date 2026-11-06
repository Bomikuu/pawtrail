'use client'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark')
    const sync = (event: StorageEvent) => {
      if (event.key !== 'pawtrail:theme') return
      const next =
        event.newValue === 'dark' ||
        (event.newValue !== 'light' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.dataset.theme = next ? 'dark' : 'light'
      setDark(next)
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  function toggle() {
    const next = !dark
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
    setDark(next)
    try {
      localStorage.setItem('pawtrail:theme', next ? 'dark' : 'light')
    } catch {
      /* The current page still changes if storage is unavailable. */
    }
  }
  return (
    <Button
      variant="ghost"
      className="theme-toggle"
      aria-label="Dark mode"
      aria-pressed={dark}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
    >
      {dark ? (
        <Sun size={20} aria-hidden="true" />
      ) : (
        <Moon size={20} aria-hidden="true" />
      )}
    </Button>
  )
}
