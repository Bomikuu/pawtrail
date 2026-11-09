import { useEffect, useState } from 'react'

/** Keep a closing panel for its short exit, then release focus and DOM space. */
export function useRetainedPanel<T>(value: T | null, exitMs = 140) {
  const [retained, setRetained] = useState<T | null>(value)
  useEffect(() => {
    if (value) {
      setRetained(value)
      return
    }
    const timer = setTimeout(() => setRetained(null), exitMs)
    return () => clearTimeout(timer)
  }, [value, exitMs])
  return { value: value ?? retained, exiting: !value }
}
export function usePanelPresence(open: boolean) {
  const [present, setPresent] = useState(open)
  useEffect(() => {
    if (open) {
      setPresent(true)
      return
    }
    const timer = setTimeout(() => setPresent(false), 140)
    return () => clearTimeout(timer)
  }, [open])
  return open || present
}
export const panelMotion =
  'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-2 duration-200 data-[state=closed]:duration-100 motion-reduce:animate-none motion-reduce:data-[state=closed]:opacity-0'
