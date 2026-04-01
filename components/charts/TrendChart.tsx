'use client'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

type DataPoint = { month: string; store: number; all?: number }
type Props = {
  data: DataPoint[]
  title: string
  storeColor?: string
  allColor?: string
  unit?: string
  barDataKey?: string
  lineDataKey?: string
  formatY?: (v: number) => string
  height?: number
}

export default function TrendChart({
  data, title,
  storeColor = '#3b82f6',
  allColor   = '#ef4444',
  unit       = '',
  barDataKey = 'store',
  lineDataKey= 'all',
  formatY,
  height = 200,
}: Props) {
  const fmt = formatY ?? ((v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` :
    v >= 1_000     ? `${(v / 1_000).toFixed(0)}k` :
    `${v}`
  )

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={m => m.slice(2).replace('-', '/')}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={fmt}
            width={44}
          />
          <Tooltip
            formatter={(v: number, name: string) =>
              [`${fmt(v)}${unit}`, name === barDataKey ? '店舗' : '全店平均']
            }
            labelFormatter={m => `${m.replace('-', '年')}月`}
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
          />
          <Legend
            formatter={v => v === barDataKey ? '店舗' : '全店平均'}
            iconSize={10}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey={barDataKey} fill={storeColor} maxBarSize={28} radius={[3,3,0,0]} />
          {data.some(d => d.all != null) && (
            <Line
              type="monotone"
              dataKey={lineDataKey}
              stroke={allColor}
              strokeWidth={2}
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
