import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import MonthSelector from '@/components/ui/MonthSelector'
import DeviationBadge from '@/components/ui/DeviationBadge'
import StoreRadarChart from '@/components/charts/StoreRadarChart'
import TrendChart from '@/components/charts/TrendChart'
import UnitPriceChart from '@/components/charts/UnitPriceChart'

type Props = {
  params:       { storeId: string }
  searchParams: { month?: string }
}

export default async function StorePage({ params, searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role, store_id').eq('id', user.id).single()
  const { storeId } = params

  // 権限チェック: store_manager / individual は自分の店舗のみ
  if ((profile?.role === 'store_manager' || profile?.role === 'individual')
      && profile?.store_id !== storeId) {
    redirect(`/store/${profile.store_id}`)
  }

  const { data: store } = await supabase.from('stores').select('*').eq('id', storeId).single()
  if (!store) notFound()

  // 利用可能な月
  const { data: months } = await supabase
    .from('deviation_scores').select('year_month')
    .eq('store_id', storeId)
    .order('year_month', { ascending: false })
  const availableMonths = (months ?? []).map(m => m.year_month)

  const currentMonth = searchParams.month ?? availableMonths[0] ?? ''

  // 当月の偏差値
  const { data: score } = await supabase
    .from('deviation_scores').select('*')
    .eq('store_id', storeId).eq('year_month', currentMonth)
    .single()

  // トレンドデータ（直近12ヶ月）
  const trendMonths = availableMonths.slice(0, 12).reverse()

  const { data: trendRevenue } = await supabase
    .from('revenue_analysis').select('year_month, total_revenue, visit_count, tech_fee_unit, drug_fee_unit')
    .eq('store_id', storeId).in('year_month', trendMonths.length ? trendMonths : [''])
    .order('year_month')

  const { data: trendRevisit } = await supabase
    .from('revisit_analysis').select('year_month, overall_revisit_rate, new_revisit_rate')
    .eq('store_id', storeId).in('year_month', trendMonths.length ? trendMonths : [''])
    .order('year_month')

  // レーダーチャートデータ
  const radarData = score ? [
    { subject: '収益',       value: score.revenue_deviation ?? 50,          fullMark: 80 },
    { subject: '受付回数',   value: score.visit_count_deviation ?? 50,       fullMark: 80 },
    { subject: '技術料単価', value: score.tech_fee_unit_deviation ?? 50,     fullMark: 80 },
    { subject: '再来率',     value: score.overall_revisit_deviation ?? 50,   fullMark: 80 },
    { subject: '重複防止',   value: score.duplicate_deviation ?? 50,         fullMark: 80 },
    { subject: 'トレレポ',   value: score.tracing_report_deviation ?? 50,    fullMark: 80 },
  ] : []

  // トレンドデータ整形
  const revenueChartData = trendMonths.map(m => ({
    month: m,
    store: trendRevenue?.find(d => d.year_month === m)?.total_revenue ?? 0,
  }))
  const visitChartData = trendMonths.map(m => ({
    month: m,
    store: trendRevenue?.find(d => d.year_month === m)?.visit_count ?? 0,
  }))
  const unitPriceData = trendMonths.map(m => {
    const r = trendRevenue?.find(d => d.year_month === m)
    return { month: m, techFee: r?.tech_fee_unit ?? 0, drugFee: r?.drug_fee_unit ?? 0 }
  })
  const revisitChartData = trendMonths.map(m => ({
    month: m,
    store: Math.round((trendRevisit?.find(d => d.year_month === m)?.overall_revisit_rate ?? 0) * 100),
  }))
  const newRevisitChartData = trendMonths.map(m => ({
    month: m,
    store: Math.round((trendRevisit?.find(d => d.year_month === m)?.new_revisit_rate ?? 0) * 100),
  }))

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{store.level1} {store.level2 ? `> ${store.level2}` : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {availableMonths.length > 0 && (
            <MonthSelector availableMonths={availableMonths} currentMonth={currentMonth} />
          )}
        </div>
      </div>

      {!score && (
        <div className="card text-center py-16">
          <p className="text-gray-400">選択した月のデータがありません</p>
        </div>
      )}

      {score && (
        <>
          {/* 偏差値サマリー */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: '総合偏差値', value: score.total_deviation, rank: score.total_rank },
              { label: '収益偏差値', value: score.revenue_deviation, rank: score.revenue_rank },
              { label: '受付回数',   value: score.visit_count_deviation, rank: score.visit_count_rank },
              { label: '技術料単価', value: score.tech_fee_unit_deviation, rank: score.tech_fee_unit_rank },
              { label: '再来率',     value: score.overall_revisit_deviation, rank: score.overall_revisit_rank },
              { label: '新患再来率', value: score.new_revisit_deviation, rank: score.new_revisit_rank },
            ].map(c => (
              <div key={c.label} className="card text-center">
                <p className="text-xs text-gray-500 mb-2">{c.label}</p>
                <DeviationBadge value={c.value} rank={c.rank} showRank />
              </div>
            ))}
          </div>

          {/* メインコンテンツ: レーダー + グラフグリッド */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* レーダーチャート */}
            <div className="card lg:row-span-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">収益偏差値</h3>
              <StoreRadarChart data={radarData} />
              {/* 詳細偏差値一覧 */}
              <div className="mt-2 space-y-1.5 border-t border-gray-100 pt-3">
                {[
                  ['重複防止',       score.duplicate_deviation,         score.duplicate_rank],
                  ['一包化',         score.one_pack_deviation,           score.one_pack_rank],
                  ['トレレポ',       score.tracing_report_deviation,     score.tracing_report_rank],
                  ['特定加算',       score.specific_add_deviation,       score.specific_add_rank],
                  ['外来一包化',     score.one_pack_outpatient_deviation, score.one_pack_outpatient_rank],
                  ['継続率',         score.retention_deviation,          score.retention_rank],
                  ['患者対応',       score.patient_response_deviation,   score.patient_response_rank],
                ].map(([label, dev, rank]) => (
                  <div key={label as string} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{label as string}</span>
                    <DeviationBadge value={dev as number} rank={rank as number} showRank />
                  </div>
                ))}
              </div>
            </div>

            {/* 売上推移 */}
            <TrendChart data={revenueChartData} title="店舗売上推移" unit="円" height={180} />

            {/* 受付回数 */}
            <TrendChart data={visitChartData} title="受付回数" unit="件" height={180} formatY={v => `${v.toLocaleString()}`} />

            {/* 単価内訳 */}
            <UnitPriceChart data={unitPriceData} />

            {/* 次回再来率 */}
            <TrendChart data={revisitChartData} title="次回再来率" unit="%" height={180} formatY={v => `${v}%`} />

            {/* 新患次回再来率 */}
            <TrendChart data={newRevisitChartData} title="新患 次回再来率" unit="%" height={180} formatY={v => `${v}%`} />
          </div>

          {/* 数値詳細テーブル */}
          <div className="card mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">詳細数値 ({currentMonth.replace('-','年')}月)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { label: '総売上',        value: `¥${(score.revenue_value ?? 0).toLocaleString()}` },
                { label: '受付回数',      value: `${(score.visit_count_value ?? 0).toLocaleString()}件` },
                { label: '技術料単価',    value: `¥${(score.tech_fee_unit_value ?? 0).toLocaleString()}` },
                { label: '薬剤料単価',    value: `¥${(score.drug_fee_unit_value ?? 0).toLocaleString()}` },
                { label: '全体再来率',    value: `${((score.overall_revisit_value ?? 0) * 100).toFixed(1)}%` },
                { label: '新患再来率',    value: `${((score.new_revisit_value ?? 0) * 100).toFixed(1)}%` },
                { label: '継続率',        value: `${((score.retention_value ?? 0) * 100).toFixed(1)}%` },
                { label: '離脱率',        value: `${((score.dropout_rate ?? 0) * 100).toFixed(1)}%` },
                { label: '重複防止件数',  value: `${score.duplicate_count ?? 0}件` },
                { label: '重複率',        value: `${((score.duplicate_rate ?? 0) * 100).toFixed(2)}%` },
                { label: '一包化件数',    value: `${score.one_pack_count ?? 0}件` },
                { label: 'トレレポ件数',  value: `${score.tracing_report_count ?? 0}件` },
                { label: 'トレレポ率',    value: `${((score.tracing_report_rate ?? 0) * 100).toFixed(2)}%` },
                { label: '特定加算件数',  value: `${score.specific_add_count ?? 0}件` },
                { label: '特定加算率',    value: `${((score.specific_add_rate ?? 0) * 100).toFixed(1)}%` },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-base font-semibold text-gray-900 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
