import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MonthSelector from '@/components/ui/MonthSelector'
import Link from 'next/link'
import BubbleChartClient from './BubbleChartClient'

type Props = { searchParams: Promise<{ month?: string; x?: string; y?: string; z?: string }> }

export default async function BubblePage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin','store_manager'].includes(profile?.role ?? '')) redirect('/dashboard')

  const { data: months } = await supabase
    .from('deviation_scores').select('year_month').order('year_month', { ascending: false })
  const availableMonths = [...new Set((months ?? []).map(m => m.year_month))]

  const sp = await searchParams
  const currentMonth = sp.month ?? availableMonths[0] ?? ''

  const { data: scores } = await supabase
    .from('deviation_scores')
    .select('*, stores(name), revenue_analysis(total_revenue, visit_count, tech_fee_unit)')
    .eq('year_month', currentMonth)

  // バブルデータ生成（デフォルト: X=受付回数, Y=技術料単価, Z=売上）
  const bubbleData = (scores ?? []).map(s => {
    const rev = (s.revenue_analysis as {total_revenue:number; visit_count:number; tech_fee_unit:number} | null)
    return {
      storeId:   s.store_id,
      storeName: (s.stores as {name:string})?.name ?? s.store_id,
      visitCount:    rev?.visit_count ?? 0,
      techFeeUnit:   rev?.tech_fee_unit ?? 0,
      totalRevenue:  rev?.total_revenue ?? 0,
      overallRevisitDev: s.overall_revisit_deviation ?? 50,
      totalDev:          s.total_deviation ?? 50,
      revenueDev:        s.revenue_deviation ?? 50,
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">バブルチャート比較</h1>
        {availableMonths.length > 0 && (
          <div className="flex items-center gap-3">
            <MonthSelector availableMonths={availableMonths} currentMonth={currentMonth} />
            <Link href={`/compare/table?month=${currentMonth}`} className="btn-secondary text-xs">
              一覧表 →
            </Link>
          </div>
        )}
      </div>
      <BubbleChartClient data={bubbleData} currentMonth={currentMonth} />
    </div>
  )
}
