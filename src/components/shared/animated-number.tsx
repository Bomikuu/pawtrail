'use client'
import { useEffect, useMemo, useRef } from 'react'

export function AnimatedNumber({
  value,
  compact = false,
}: {
  value: number
  compact?: boolean
}) {
  const node = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(
        'en-PH',
        compact
          ? { notation: 'compact', maximumFractionDigits: 1 }
          : { maximumFractionDigits: 0 },
      ),
    [compact],
  )
  const final = formatter.format(value)
  useEffect(() => {
    const element = node.current
    if (!element) return
    element.textContent = final
    if (started.current || value === 0 || !('IntersectionObserver' in window))
      return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (preference.matches) {
      started.current = true
      return
    }
    let frame = 0
    const finish = () => {
      cancelAnimationFrame(frame)
      element.textContent = final
    }
    const onVisibility = () => {
      if (document.hidden) finish()
    }
    const onPreference = () => {
      if (preference.matches) finish()
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        observer.disconnect()
        if (preference.matches || document.hidden) {
          finish()
          return
        }
        element.textContent = '0'
        const start = performance.now()
        const tick = (time: number) => {
          const progress = Math.min((time - start) / 700, 1)
          const amount = Math.round(value * (1 - Math.pow(1 - progress, 3)))
          element.textContent = formatter.format(amount)
          if (progress < 1) frame = requestAnimationFrame(tick)
          else element.textContent = final
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.35 },
    )
    observer.observe(element)
    document.addEventListener('visibilitychange', onVisibility)
    preference.addEventListener('change', onPreference)
    return () => {
      observer.disconnect()
      finish()
      document.removeEventListener('visibilitychange', onVisibility)
      preference.removeEventListener('change', onPreference)
    }
  }, [value, formatter, final])
  return (
    <span className="animated-number">
      <span className="sr-only">{final}</span>
      <span className="animated-number-measure" aria-hidden="true">
        {final}
      </span>
      <span className="animated-number-value" ref={node} aria-hidden="true">
        {final}
      </span>
    </span>
  )
}
