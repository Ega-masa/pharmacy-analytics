'use client'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts'

type Props = {
  data: {
    subject: string
    value: number
    fullMark: number
  }[]
}

export default function StoreRadarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: '#6b7280' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[20, 80]}
          tick={{ fontSize: 9, fill: '#9ca3af' }}
          tickCount={4}
        />
        <Radar
          name="偏差値"
          dataKey="value"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(v: number) => [`${v}`, '偏差値']}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
