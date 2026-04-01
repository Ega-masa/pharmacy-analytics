import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcAllDeviations, StoreMetrics, calcRankDesc, calcRankAsc } from '@/lib/calculations/deviationScore'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin','data_entry'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { yearMonth } = await req.json()
  if (!yearMonth) return NextResponse.json({ error: 'yearMonth is required' }, { status: 400 })

  // 各テーブルから当月データを取得
  const [revResult, revisitResult, pharmaResult] = await Promise.all([
    supabase.from('revenue_analysis').select('*').eq('year_month', yearMonth),
    supabase.from('revisit_analysis').select('*').eq('year_month', yearMonth),
    supabase.from('pharma_mgmt_outpatient').select('*').eq('year_month', yearMonth),
  ])

  const revRows     = revResult.data ?? []
  const revisitRows = revisitResult.data ?? []
  const pharmaRows  = pharmaResult.data ?? []

  // store_id をキーにしてマージ
  const storeIds = [...new Set(revRows.map(r => r.store_id))]

  const metrics: StoreMetrics[] = storeIds.map(sid => {
    const rev     = revRows.find(r => r.store_id === sid)
    const revisit = revisitRows.find(r => r.store_id === sid)
    const pharma  = pharmaRows.find(r => r.store_id === sid)

    const visitCount  = rev?.visit_count ?? 0
    const dupCount    = (pharma?.duplicate_prevention_count ?? 0) + (pharma?.duplicate_residual_count ?? 0)
    const onePackOut  = (pharma?.outpatient_support_2_under42 ?? 0) + (pharma?.outpatient_support_2_over43 ?? 0)
    const tracingCnt  = pharma?.med_info_2_hospital ?? 0
    const specCount   = pharma?.specific_drug_count ?? 0
    const specTarget  = pharma?.specific_drug_target ?? 0

    return {
      storeId:             sid,
      totalRevenue:        rev?.total_revenue ?? 0,
      visitCount,
      techFeeUnit:         rev?.tech_fee_unit ?? 0,
      drugFeeUnit:         rev?.drug_fee_unit ?? 0,
      overallRevisitRate:  revisit?.overall_revisit_rate ?? 0,
      newRevisitRate:      revisit?.new_revisit_rate ?? 0,
      retentionRate:       revisit?.returning_revisit_rate ?? 0,
      dropoutRate:         1 - (revisit?.overall_revisit_rate ?? 1),
      duplicateCount:      dupCount,
      duplicateRate:       visitCount > 0 ? dupCount / visitCount : 0,
      onePackCount:        onePackOut,
      onePackRate:         visitCount > 0 ? onePackOut / visitCount : 0,
      onePackOutpatientCount: onePackOut,
      tracingReportCount:  tracingCnt,
      tracingReportRate:   visitCount > 0 ? tracingCnt / visitCount : 0,
      specificAddCount:    specCount,
      specificAddRate:     specTarget > 0 ? specCount / specTarget : 0,
    }
  })

  if (metrics.length === 0)
    return NextResponse.json({ error: 'データが見つかりません' }, { status: 404 })

  const deviations = calcAllDeviations(metrics)

  // deviation_scores に upsert
  const upserts = deviations.map((d, i) => {
    const m = metrics[i]
    return {
      year_month:                    yearMonth,
      store_id:                      d.storeId,
      total_store_count:             metrics.length,
      // 収益
      revenue_value:                 m.totalRevenue,
      revenue_deviation:             d.revenueDeviation,
      revenue_rank:                  d.revenueRank,
      visit_count_value:             m.visitCount,
      visit_count_deviation:         d.visitCountDeviation,
      visit_count_rank:              d.visitCountRank,
      tech_fee_unit_value:           m.techFeeUnit,
      tech_fee_unit_deviation:       d.techFeeUnitDeviation,
      tech_fee_unit_rank:            d.techFeeUnitRank,
      drug_fee_unit_value:           m.drugFeeUnit,
      drug_fee_unit_deviation:       d.drugFeeUnitDeviation,
      drug_fee_unit_rank:            d.drugFeeUnitRank,
      total_deviation:               d.totalDeviation,
      total_rank:                    d.totalRank,
      // 再来
      overall_revisit_value:         m.overallRevisitRate,
      overall_revisit_deviation:     d.overallRevisitDeviation,
      overall_revisit_rank:          d.overallRevisitRank,
      new_revisit_value:             m.newRevisitRate,
      new_revisit_deviation:         d.newRevisitDeviation,
      new_revisit_rank:              d.newRevisitRank,
      dropout_rate:                  m.dropoutRate,
      retention_value:               m.retentionRate,
      retention_deviation:           d.retentionDeviation,
      retention_rank:                d.retentionRank,
      patient_response_deviation:    d.patientResponseDeviation,
      patient_response_rank:         d.patientResponseRank,
      // 薬学管理
      duplicate_count:               m.duplicateCount,
      duplicate_rate:                m.duplicateRate,
      duplicate_deviation:           d.duplicateDeviation,
      duplicate_rank:                d.duplicateRank,
      one_pack_count:                m.onePackCount,
      one_pack_rate:                 m.onePackRate,
      one_pack_deviation:            d.onePackDeviation,
      one_pack_rank:                 d.onePackRank,
      one_pack_outpatient_count:     m.onePackOutpatientCount,
      one_pack_outpatient_deviation: d.onePackOutpatientDeviation,
      one_pack_outpatient_rank:      d.onePackOutpatientRank,
      tracing_report_count:          m.tracingReportCount,
      tracing_report_rate:           m.tracingReportRate,
      tracing_report_deviation:      d.tracingReportDeviation,
      tracing_report_rank:           d.tracingReportRank,
      specific_add_count:            m.specificAddCount,
      specific_add_rate:             m.specificAddRate,
      specific_add_deviation:        d.specificAddDeviation,
      specific_add_rank:             d.specificAddRank,
      updated_at:                    new Date().toISOString(),
    }
  })

  const { error } = await supabase
    .from('deviation_scores')
    .upsert(upserts, { onConflict: 'year_month,store_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ count: upserts.length })
}
