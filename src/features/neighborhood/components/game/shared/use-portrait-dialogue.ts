import { useEffect, useState } from 'react'

/** The studio uses the same text-reveal → speaking → resting contract as dialogue. */
export function usePortraitDialogue(text: string, paused: boolean) {
  const [speaking, setSpeaking] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => { setSpeaking(false); setCursor(0) }, [text])
  useEffect(() => {
    if (!speaking || paused || !visible) return
    const timer = window.setInterval(() => setCursor(value => Math.min(value + 1, text.length)), 40)
    return () => window.clearInterval(timer)
  }, [speaking, paused, visible, text.length])
  useEffect(() => { if (speaking && cursor >= text.length) setSpeaking(false) }, [cursor, speaking, text.length])
  return {
    speaking,
    visibleText: speaking ? text.slice(0, cursor) : text,
    play: () => { setCursor(0); setSpeaking(true) },
    stop: () => { setSpeaking(false); setCursor(text.length) },
  }
}
