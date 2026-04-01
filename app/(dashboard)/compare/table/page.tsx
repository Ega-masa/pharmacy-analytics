import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MonthSelector from '@/components/ui/MonthSelector'
import DeviationBadge from '@/components/ui/DeviationBadge'

type Props = { searchParams: { month?: string; sort?: string; dir?: string } }

export default async function CompareTablePage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin','store_manager'].includes(profile?.role ?? '')) redirect('/dashboard')

  const { data: months } = await supabase
    .from('deviation_scores').select('year_month')
    .order('year_month', { ascending: false })
  const availableMonths = [...new Set((months ?? []).map(m => m.year_month))]

  const currentMonth = searchParams.month ?? availableMonths[0] ?? ''
  const sortKey = searchParams.sort ?? 'total_rank'
  const sortDir = searchParams.dir ?? 'asc'

  const { data: scores } = await supabase
    .from('deviation_scores')
    .select('*, stores(name, level1)')
    .eq('year_month', currentMonth)
    .order(sortKey, { ascending: sortDir === 'asc' })

  function sortLink(key: string) {
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'
    return `?month=${currentMonth}&sort=${key}&dir=${newDir}`
  }

  function SortTh({ k, label }: { k: string; label: string }) {
    const active = sortKey === k
    return (
      <th className="py-2 px-2 text-xs font-semibold text-gray-500 text-center">
        <Link href={sortLink(k)} className={`hover:text-brand transition-colors ${active ? 'text-brand' : ''}`}>
          {label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
        </Link>
      </th>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">全店比較</h1>
        {availableMonths.length > 0 && (
          <div className="flex items-center gap-3">
            <MonthSelector availableMonths={availableMonths} currentMonth={currentMonth} />
            <Link href={`/compare/bubble?month=${currentMonth}`} className="btn-secondary text-xs">
              バブルチャート →
            </Link>
          </div>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 sticky left-0 bg-gray-50">店舗名</th>
              <SortTh k="total_rank"                label="総合" />
              <SortTh k="revenue_rank"              label="収益順位" />
              <SortTh k="revenue_deviation"         label="収益偏差値" />
              <SortTh k="visit_count_rank"          label="回数順位" />
              <SortTh k="visit_count_deviation"     label="受付偏差値" />
              <SortTh k="tech_fee_unit_rank"        label="技術料順位" />
              <SortTh k="tech_fee_unit_deviation"   label="技術料偏差値" />
              <SortTh k="drug_fee_unit_deviation"   label="薬剤料偏差値" />
              <SortTh k="overall_revisit_rank"      label="再来順位" />
              <SortTh k="overall_revisit_deviation" label="再来偏差値" />
              <SortTh k="new_revisit_deviation"     label="新患再来偏差値" />
              <SortTh k="retention_deviation"       label="継続率偏差値" />
              <SortTh k="patient_response_deviation"label="患者対応偏差値" />
              <SortTh k="duplicate_deviation"       label="重複偏差値" />
              <SortTh k="one_pack_deviation"        label="一包化偏差値" />
              <SortTh k="tracing_report_deviation"  label="トレレポ偏差値" />
              <SortTh k="specific_add_deviation"    label="特定加算偏差値" />
              <th className="py-2 px-2 text-xs font-semibold text-gray-500 text-center">詳細</th>
            </tr>
          </thead>
          <tbody>
            {(scores ?? []).map((s, i) => (
              <tr key={s.store_id} className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                <td className="py-2.5 px-3 font-medium text-gray-900 sticky left-0 bg-inherit">
                  {(s.stores as { name: string; level1: string } | null)?.name}
                  {(s.stores as { name: string; level1: string } | null)?.level1 &&
                    <span className="text-xs text-gray-400 ml-1">({(s.stores as { name: string; level1: string }).level1})</span>}
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-bold text-brand">{s.total_rank}位</span>
                </td>
                <td className="py-2.5 px-2 text-center text-xs text-gray-500">{s.revenue_rank}位</td>
                <td className="py-2.5 px-2 text-center"><DeviationBadge value={s.revenue_deviation} /></td>
                <td className="py-2.5 px-2 text-center text-xs text-gray-500">{s.visit_count_rank}位</td>
                <td className="py-2.5 px-2 text-center"><DeviationBadge value={s.visit_count_deviation} /></td>
                <td className="py-2.5 px-2 text-center text-xs text-gray-500">{s.tech_fee_unit_rank}位</td>
                <td className="py-2.5 px-2 text-center"><DeviationBadge value={s.tech_fee_unit_deviation} /></td>
                <td className="py-2.5 px-2 text-center"><DeviationBadge value={s.drug_fee_unit_deviation} /></td>
                <td className="py-2.5 px-2 text-center text-xs text-gray-500">{s.overall_revisit_rank}位</td>
                <td className="py-2.5 px-2 text-center"><DeviationBadge value={s.overall_revisit_deviation} /></td>
                <td className="py-2.5 px-2 text-center"><DeviationBadge value={s.new_revisit_deviation} /></td>
                <td className="py-2.5 px-2 text-center"><DeviationBadge value={s.retention_deviation} /></td>
                <td className="py-2.5 px-2 text-center"><DeviationBadge value={s.patient_response_deviation} /></td>
                <td className="py-2.5 px-2 text-center"><DeviationBadge value={s.duplicate_deviation} /></td>
                <td className="py-2.5 px-2 text-center"><DeviationBadge value={s.one_pack_deviation} /></td>
                <td className="py-2.5 px-2 text-center"><DeviationBadge value={s.tracing_report_deviation} /></td>
                <td className="py-2.5 px-2 text-center"><DeviationBadge value={s.specific_add_deviation} /></td>
                <td className="py-2.5 px-2 text-center">
                  <Link href={`/store/${s.store_id}?month=${currentMonth}`} className="text-brand text-xs hover:underline">詳細</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!scores || scores.length === 0) && (
          <p className="text-center text-gray-400 py-8">データがありません</p>
        )}
      </div>
    </div>
  )
}
