type Props = { value: number | null; rank?: number | null; showRank?: boolean }

export function deviationColor(v: number) {
  if (v >= 60) return 'bg-red-100 text-red-700'
  if (v >= 55) return 'bg-orange-100 text-orange-700'
  if (v >= 45) return 'bg-yellow-100 text-yellow-700'
  if (v >= 40) return 'bg-blue-100 text-blue-700'
  return 'bg-blue-200 text-blue-900'
}

export default function DeviationBadge({ value, rank, showRank = false }: Props) {
  if (value == null) return <span className="text-gray-300 text-xs">-</span>
  return (
    <div className="flex items-center gap-1.5">
      <span className={`deviation-badge ${deviationColor(value)}`}>{value}</span>
      {showRank && rank != null && (
        <span className="text-xs text-gray-400">{rank}位</span>
      )}
    </div>
  )
}
