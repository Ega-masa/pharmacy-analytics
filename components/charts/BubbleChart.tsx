'use client'
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label
} from 'recharts'

type BubblePoint = {
  storeName:   string
  x:           number
  y:           number
  z:           number
  storeId:     string
}

type Props = {
  data:    BubblePoint[]
  xLabel:  string
  yLabel:  string
  zLabel:  string
  xAvg?:   number
  yAvg?:   number
  onClickStore?: (storeId: string) => void
}

const COLORS = [
  '#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6',
  '#ec4899','#06b6d4','#84cc16','#f97316','#6366f1',
]

export default function BubbleChart({ data, xLabel, yLabel, zLabel, xAvg, yAvg, onClickStore }: Props) {
  return (
    <ResponsiveContainer width="100%" height={480}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          type="number" dataKey="x" name={xLabel}
          tick={{ fontSize: 11 }}
          label={{ value: xLabel, position: 'insideBottom', offset: -10, fontSize: 12 }}
        />
        <YAxis
          type="number" dataKey="y" name={yLabel}
          tick={{ fontSize: 11 }}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, fontSize: 12 }}
        />
        <ZAxis type="number" dataKey="z" name={zLabel} range={[60, 600]} />
        {xAvg != null && (
          <ReferenceLine x={xAvg} stroke="#94a3b8" strokeDasharray="4 4">
            <Label value="平均" fontSize={10} fill="#94a3b8" position="top" />
          </ReferenceLine>
        )}
        {yAvg != null && (
          <ReferenceLine y={yAvg} stroke="#94a3b8" strokeDasharray="4 4">
            <Label value="平均" fontSize={10} fill="#94a3b8" position="right" />
          </ReferenceLine>
        )}
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={({ payload }) => {
            if (!payload?.length) return null
            const d = payload[0].payload as BubblePoint
            return (
              <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-xs">
                <p className="font-semibold text-gray-900 mb-1">{d.storeName}</p>
                <p className="text-gray-600">{xLabel}: {d.x.toLocaleString()}</p>
                <p className="text-gray-600">{yLabel}: {d.y.toLocaleString()}</p>
                <p className="text-gray-600">{zLabel}: {d.z.toLocaleString()}</p>
              </div>
            )
          }}
        />
        <Scatter
          data={data}
          fill="#3b82f6"
          fillOpacity={0.7}
          onClick={(d) => onClickStore?.(d.storeId)}
          cursor={onClickStore ? 'pointer' : 'default'}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
