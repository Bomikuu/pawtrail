'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'
const ActivityChart = dynamic(() => import('./activity-chart'), {
  ssr: false,
  loading: () => <p role="status">Loading the chart…</p>,
})
export function ChartPanel({
  data,
  title,
  unit = 'count',
}: {
  data: { name: string; value: number }[]
  title: string
  unit?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <details
      className="activity-chart-panel"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>{title}</summary>
      <p>The same values are available in the text record on this page.</p>
      {open && <ActivityChart data={data} unit={unit} />}
    </details>
  )
}
