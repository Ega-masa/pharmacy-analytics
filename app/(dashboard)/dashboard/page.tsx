import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DeviationBadge from '@/components/ui/DeviationBadge'
import MonthSelector from '@/components/ui/MonthSelector'

type Props = { searchParams: { month?: string } }

export default async function DashboardPage({ searchParams }: Props) {
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role, store_id').eq('id', user.id).single()

  const role = profile?.role ?? ''

  // 利用可能な月一覧
  const { data: months } = await supabase
    .from('deviation_scores')
    .select('year_month')
    .order('year_month', { ascending: false })
  const availableMonths = [...new Set((months ?? []).map(m => m.year_month))]
  const currentMonth = searchParams.month ?? availableMonths[0] ?? ''

  // 店舗ダッシュボードか全店一覧かを分岐
  if (role === 'store_manager' || role === 'individual') {
    redirect(`/store/${profile?.store_id}`)
  }

  // 管理者: 全店一覧
  const { data: scores } = await supabase
    .from('deviation_scores')
    .select('*, stores(name)')
    .eq('year_month', currentMonth)
    .order('total_rank', { ascending: true })

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">全店ダッシュボード</h1>
          <p className="text-sm text-gray-500 mt-0.5">{availableMonths.length} ヶ月分のデータ</p>
        </div>
        {availableMonths.length > 0 && (
          <MonthSelector availableMonths={availableMonths} currentMonth={currentMonth} />
        )}
      </div>

      {!currentMonth && (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-base">まだデータがありません。</p>
          <Link href="/input" className="btn-primary mt-4 inline-block">データを入力する</Link>
        </div>
      )}

      {currentMonth && (
        <>
          {/* サマリーカード */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: '対象店舗数', value: scores?.length ?? 0, unit: '店舗' },
              { label: '平均偏差値', value: scores?.length ? Math.round((scores.reduce((a,b) => a + (b.total_deviation ?? 50), 0)) / scores.length) : '-', unit: '' },
              { label: '上位10%', value: scores?.filter(s => (s.total_deviation ?? 0) >= 60).length ?? 0, unit: '店舗' },
              { label: '要注意(<45)', value: scores?.filter(s => (s.total_deviation ?? 50) < 45).length ?? 0, unit: '店舗' },
            ].map(c => (
              <div key={c.label} className="card">
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="text-2xl font-bold text-brand mt-1">{c.value}<span className="text-sm text-gray-400 ml-1">{c.unit}</span></p>
              </div>
            ))}
          </div>

          {/* 店舗テーブル */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">順位</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">店舗名</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">総合偏差値</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">収益</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">受付回数</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">技術料単価</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">再来率</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">重複防止</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">トレレポ</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">詳細</th>
                </tr>
              </thead>
              <tbody>
                {(scores ?? []).map((s, i) => (
                  <tr key={s.store_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 text-gray-500 font-medium">{i + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-900">
                      {(s.stores as { name: string } | null)?.name ?? s.store_id}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <DeviationBadge value={s.total_deviation} />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <DeviationBadge value={s.revenue_deviation} />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <DeviationBadge value={s.visit_count_deviation} />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <DeviationBadge value={s.tech_fee_unit_deviation} />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <DeviationBadge value={s.overall_revisit_deviation} />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <DeviationBadge value={s.duplicate_deviation} />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <DeviationBadge value={s.tracing_report_deviation} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link href={`/store/${s.store_id}?month=${currentMonth}`}
                        className="text-brand text-xs hover:underline">詳細 →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!scores || scores.length === 0) && (
              <p className="text-center text-gray-400 py-8">選択した月のデータがありません</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
