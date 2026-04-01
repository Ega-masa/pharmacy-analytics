'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BubbleChart from '@/components/charts/BubbleChart'

type DataItem = {
  storeId: string
  storeName: string
  visitCount: number
  techFeeUnit: number
  totalRevenue: number
  overallRevisitDev: number
  totalDev: number
  revenueDev: number
}

type AxisKey = 'visitCount' | 'techFeeUnit' | 'totalRevenue' | 'overallRevisitDev' | 'totalDev'

const AXIS_OPTIONS: { key: AxisKey; label: string }[] = [
  { key: 'visitCount',       label: '受付回数' },
  { key: 'techFeeUnit',      label: '技術料単価' },
  { key: 'totalRevenue',     label: '総売上' },
  { key: 'overallRevisitDev',label: '再来率偏差値' },
  { key: 'totalDev',         label: '総合偏差値' },
]

export default function BubbleChartClient({ data, currentMonth }: { data: DataItem[]; currentMonth: string }) {
  const [xKey, setXKey] = useState<AxisKey>('visitCount')
  const [yKey, setYKey] = useState<AxisKey>('techFeeUnit')
  const [zKey, setZKey] = useState<AxisKey>('totalRevenue')
  const router = useRouter()

  const bubbleData = data.map(d => ({
    storeId:   d.storeId,
    storeName: d.storeName,
    x: d[xKey],
    y: d[yKey],
    z: d[zKey],
  }))

  const xAvg = bubbleData.reduce((a, b) => a + b.x, 0) / (bubbleData.length || 1)
  const yAvg = bubbleData.reduce((a, b) => a + b.y, 0) / (bubbleData.length || 1)

  const xLabel = AXIS_OPTIONS.find(o => o.key === xKey)?.label ?? ''
  const yLabel = AXIS_OPTIONS.find(o => o.key === yKey)?.label ?? ''
  const zLabel = AXIS_OPTIONS.find(o => o.key === zKey)?.label ?? ''

  function AxisSelect({ value, onChange, label }: { value: AxisKey; onChange: (v: AxisKey) => void; label: string }) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 shrink-0">{label}</label>
        <select
          value={value}
          onChange={e => onChange(e.target.value as AxisKey)}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          {AXIS_OPTIONS.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="card">
      {/* 軸選択 */}
      <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-gray-100">
        <AxisSelect value={xKey} onChange={setXKey} label="X軸:" />
        <AxisSelect value={yKey} onChange={setYKey} label="Y軸:" />
        <AxisSelect value={zKey} onChange={setZKey} label="バブル径:" />
        <p className="text-xs text-gray-400 self-center ml-auto">
          バブルをクリックすると店舗詳細を表示します
        </p>
      </div>
      <BubbleChart
        data={bubbleData}
        xLabel={xLabel}
        yLabel={yLabel}
        zLabel={zLabel}
        xAvg={xAvg}
        yAvg={yAvg}
        onClickStore={id => router.push(`/store/${id}?month=${currentMonth}`)}
      />
    </div>
  )
}
