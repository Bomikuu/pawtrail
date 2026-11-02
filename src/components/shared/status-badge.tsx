import type { ReactNode } from 'react'
export function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'error'
  children: ReactNode
}) {
  return <span className={`status-badge status-${tone}`}>{children}</span>
}
