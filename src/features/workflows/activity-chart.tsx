'use client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
export default function ActivityChart({
  data,
  unit,
}: {
  data: { name: string; value: number }[]
  unit: string
}) {
  return (
    <div
      style={{ height: 280, width: '100%', minWidth: 0 }}
      role="img"
      aria-label={`${unit} chart: ${data.map((r) => `${r.name} ${r.value}`).join(', ')}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          accessibilityLayer
          margin={{ top: 16, right: 16, left: 8, bottom: 28 }}
        >
          <CartesianGrid vertical={false} stroke="#ede5d8" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b625b' }} />
          <YAxis
            allowDecimals={unit === 'PHP'}
            tick={{ fontSize: 12, fill: '#6b625b' }}
          />
          <Tooltip />
          <Bar
            dataKey="value"
            name={unit}
            fill="#0f766e"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
