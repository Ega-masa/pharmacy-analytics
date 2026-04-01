'use client'
import { useRouter, useSearchParams } from 'next/navigation'

type Props = { availableMonths: string[]; currentMonth: string }

export default function MonthSelector({ availableMonths, currentMonth }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', e.target.value)
    router.push('?' + params.toString())
  }

  return (
    <select
      value={currentMonth}
      onChange={onChange}
      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30"
    >
      {availableMonths.map(m => (
        <option key={m} value={m}>{m.replace('-', '年').replace(/(\d+)$/, '$1月')}</option>
      ))}
    </select>
  )
}
