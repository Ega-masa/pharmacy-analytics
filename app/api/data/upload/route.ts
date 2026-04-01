import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin','data_entry'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { type, yearMonth, rows } = await req.json()

  if (!type || !yearMonth || !Array.isArray(rows))
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  // 店舗マスタ（store_code → id のマップを作成）
  const { data: stores } = await supabase.from('stores').select('id, store_code, name')
  const storeMap = new Map<string, string>()
  const storeNameMap = new Map<string, string>()
  ;(stores ?? []).forEach(s => {
    if (s.store_code) storeMap.set(s.store_code.trim(), s.id)
    storeNameMap.set(s.name.trim(), s.id)
  })

  function resolveStoreId(row: Record<string, unknown>): string | null {
    const code = String(row.storeCode ?? '').trim()
    const name = String(row.storeName ?? '').trim()
    return storeMap.get(code) ?? storeNameMap.get(name) ?? null
  }

  let saved = 0

  if (type === 'revenue') {
    for (const row of rows as Record<string, unknown>[]) {
      const storeId = resolveStoreId(row)
      if (!storeId) continue
      await supabase.from('revenue_analysis').upsert({
        year_month:              yearMonth,
        store_id:                storeId,
        total_revenue:           row.totalRevenue,
        prescription_revenue:    row.prescriptionRevenue,
        prescription_unit_price: row.prescriptionUnitPrice,
        visit_count:             row.visitCount,
        prescription_score:      row.prescriptionScore,
        dispensing_base_fee:     row.dispensingBaseFee,
        drug_preparation_fee:    row.drugPreparationFee,
        addition_fee:            row.additionFee,
        guidance_mgmt_fee:       row.guidanceMgmtFee,
        drug_fee:                row.drugFee,
        tech_fee_unit:           row.techFeeUnit,
        drug_fee_unit:           row.drugFeeUnit,
      }, { onConflict: 'year_month,store_id' })
      saved++
    }
  }

  if (type === 'revisit') {
    for (const row of rows as Record<string, unknown>[]) {
      const storeId = resolveStoreId(row)
      if (!storeId) continue
      await supabase.from('revisit_analysis').upsert({
        year_month:              yearMonth,
        store_id:                storeId,
        overall_patient_count:   row.overallPatientCount,
        overall_revisit_rate:    row.overallRevisitRate,
        overall_visited:         row.overallVisited,
        overall_unvisited_med:   row.overallUnvisitedMed,
        overall_unvisited_drop:  row.overallUnvisitedDrop,
        new_patient_count:       row.newPatientCount,
        new_revisit_rate:        row.newRevisitRate,
        renew_patient_count:     row.renewPatientCount,
        renew_revisit_rate:      row.renewRevisitRate,
        returning_patient_count: row.returningPatientCount,
        returning_revisit_rate:  row.returningRevisitRate,
      }, { onConflict: 'year_month,store_id' })
      saved++
    }
  }

  if (type === 'pharma_out') {
    for (const row of rows as Record<string, unknown>[]) {
      const storeId = resolveStoreId(row)
      if (!storeId) continue
      await supabase.from('pharma_mgmt_outpatient').upsert({
        year_month:                       yearMonth,
        store_id:                         storeId,
        medication_guidance_outpatient:   row.medicationGuidanceOutpatient,
        medication_guidance_special:      row.medicationGuidanceSpecial,
        medication_guidance_online:       row.medicationGuidanceOnline,
        family_pharmacist_count:          row.familyPharmacistCount,
        family_pharmacist_possible:       row.familyPharmacistPossible,
        family_pharmacist_rate:           row.familyPharmacistRate,
        specific_drug_count:              row.specificDrugCount,
        specific_drug_target:             row.specificDrugTarget,
        specific_drug_rate:               row.specificDrugRate,
        duplicate_prevention_count:       row.duplicatePreventionCount,
        duplicate_residual_count:         row.duplicateResidualCount,
        outpatient_support_1:             row.outpatientSupport1,
        outpatient_support_2_under42:     row.outpatientSupport2Under42,
        outpatient_support_2_over43:      row.outpatientSupport2Over43,
        med_info_1:                       row.medInfo1,
        med_info_2_hospital:              row.medInfo2Hospital,
        med_info_2_refill:                row.medInfo2Refill,
        med_info_3:                       row.medInfo3,
        post_dispense_mgmt_1:             row.postDispenseMgmt1,
        post_dispense_mgmt_2:             row.postDispenseMgmt2,
        medical_dx_1:                     row.medicalDx1,
        medical_dx_2:                     row.medicalDx2,
        medical_dx_3:                     row.medicalDx3,
      }, { onConflict: 'year_month,store_id' })
      saved++
    }
  }

  if (type === 'pharma_home') {
    for (const row of rows as Record<string, unknown>[]) {
      const storeId = resolveStoreId(row)
      if (!storeId) continue
      await supabase.from('pharma_mgmt_home').upsert({
        year_month:          yearMonth,
        store_id:            storeId,
        home_visit_single:   row.homeVisitSingle,
        home_visit_multi:    row.homeVisitMulti,
        home_visit_other:    row.homeVisitOther,
      }, { onConflict: 'year_month,store_id' })
      saved++
    }
  }

  if (type === 'regional') {
    for (const row of rows as Record<string, unknown>[]) {
      const storeId = resolveStoreId(row)
      if (!storeId) continue
      await supabase.from('regional_support').upsert({
        year_month:         yearMonth,
        store_id:           storeId,
        achievement_count:  row.achievementCount,
        prescription_count: row.prescriptionCount,
        item1_night:        row.item1Night,
        item2_narcotics:    row.item2Narcotics,
        item3_duplicate:    row.item3Duplicate,
        item4_family:       row.item4Family,
        item5_out_support:  row.item5OutSupport,
        item6_drug_adjust:  row.item6DrugAdjust,
        item7_home_single:  row.item7HomeSingle,
        item8_med_info:     row.item8MedInfo,
        item9_pediatric:    row.item9Pediatric,
      }, { onConflict: 'year_month,store_id' })
      saved++
    }
  }

  return NextResponse.json({ savedCount: saved })
}
