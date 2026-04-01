'use client'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

type DataPoint = {
  month:     string
  techFee:   number
  drugFee:   number
  allUnit?:  number
}

export default function UnitPriceChart({ data }: { data: DataPoint[] }) {
  const fmt = (v: number) => `¥${v.toLocaleString()}`

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">単価内訳</h3>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={m => m.slice(2).replace('-','/')} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `¥${(v/1000).toFixed(0)}k`} width={44} />
          <Tooltip
            formatter={(v: number, name: string) => [fmt(v), name === 'techFee' ? '技術料単価' : name === 'drugFee' ? '薬剤料単価' : '全店単価']}
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
          />
          <Legend
            formatter={v => v === 'techFee' ? '技術料単価' : v === 'drugFee' ? '薬剤料単価' : '全店平均'}
            iconSize={10} wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="drugFee" stackId="a" fill="#ef4444" maxBarSize={28} />
          <Bar dataKey="techFee" stackId="a" fill="#3b82f6" maxBarSize={28} radius={[3,3,0,0]} />
          {data.some(d => d.allUnit != null) && (
            <Line type="monotone" dataKey="allUnit" stroke="#f59e0b" strokeWidth={2} dot={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
