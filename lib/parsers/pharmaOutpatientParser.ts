/**
 * 薬学管理料（外来）TSVパーサー
 * - 階層名 = '薬局' かつ 薬剤師列が空（店舗集計行）のみ対象
 */

export type PharmaOutpatientRow = {
  storeName:                   string
  storeCode:                   string
  medicationGuidanceOutpatient: number
  medicationGuidanceSpecial:   number
  medicationGuidanceOnline:    number
  familyPharmacistCount:       number
  familyPharmacistPossible:    number
  familyPharmacistRate:        number
  specificDrugCount:           number
  specificDrugTarget:          number
  specificDrugRate:            number
  duplicatePreventionCount:    number
  duplicateResidualCount:      number
  outpatientSupport1:          number
  outpatientSupport2Under42:   number
  outpatientSupport2Over43:    number
  medInfo1:                    number
  medInfo2Hospital:            number
  medInfo2Refill:              number
  medInfo3:                    number
  postDispenseMgmt1:           number
  postDispenseMgmt2:           number
  medicalDx1:                  number
  medicalDx2:                  number
  medicalDx3:                  number
}

function toNum(v: string | undefined): number {
  if (!v || v.trim() === '' || v.trim() === 'NaN') return 0
  const n = parseFloat(v.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

export function parsePharmaOutpatientTsv(text: string): PharmaOutpatientRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  let headerIdx = 0
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].includes('お客様管理番号') || lines[i].includes('服薬管理指導料')) {
      headerIdx = i
      break
    }
  }

  const headers = lines[headerIdx].split('\t').map(h => h.trim())
  const idx = (keyword: string) => headers.findIndex(h => h.includes(keyword))

  const colStoreName   = idx('薬局')
  const colStoreCode   = idx('お客様管理番号')
  const colLevel       = idx('階層名')
  const colPharmacist  = idx('薬剤師')

  // 服薬管理指導料
  const colMgmtOut    = idx('服薬管理指導料外来の合計')
  const colMgmtSp     = idx('服薬管理指導料特養等の合計')
  const colMgmtOnline = idx('服薬管理指導料通信機器の合計')
  // かかりつけ
  const colFamCount   = idx('かかりつけ薬剤師指導料_有効算定件数')
  const colFamPoss    = idx('かかりつけ薬剤師指導料_算定可能件数')
  const colFamRate    = idx('かかりつけ薬剤師指導料_算定率')
  // 特定薬剤管理指導加算1
  const colSpecCount  = idx('特定薬剤管理指導加算１（イ・ロ合算）_有効算定件数')
  const colSpecTarget = idx('特定薬剤管理指導加算１（イ・ロ合算）_対象処方件数')
  const colSpecRate   = idx('特定薬剤管理指導加算１（イ・ロ合算）_算定率')
  // 重複投薬
  const colDupPrev    = idx('重複投薬・相互作用等防止加算の合計_調剤管理料・残薬以外')
  const colDupResid   = idx('重複投薬・相互作用等防止加算の合計_調剤管理料・残薬調整')
  // 外来服薬支援料
  const colOut1       = idx('外来服薬支援料の合計_１')
  const colOut2u42    = idx('外来服薬支援料の合計_２（４２日分以下）')
  const colOut2o43    = idx('外来服薬支援料の合計_２（４３日分以上）')
  // 服薬情報提供料
  const colInfo1      = idx('服薬情報提供料の合計_１')
  const colInfo2Hosp  = idx('服薬情報提供料の合計_２（保険医療機関）')
  const colInfo2Ref   = idx('服薬情報提供料の合計_２（リフィル処方箋）')
  const colInfo3      = idx('服薬情報提供料の合計_３')
  // 調剤後薬剤管理指導料
  const colPostDM1    = idx('調剤後薬剤管理指導料１(糖尿病患者)_算定件数')
  const colPostDM2    = idx('調剤後薬剤管理指導料２(慢性心不全患者)_算定件数')
  // 医療DX
  const colDx1        = idx('医療ＤＸ推進体制整備加算１_算定件数')
  const colDx2        = idx('医療ＤＸ推進体制整備加算２_算定件数')
  const colDx3        = idx('医療ＤＸ推進体制整備加算３_算定件数')

  const results: PharmaOutpatientRow[] = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    if (!cols[colLevel] || cols[colLevel].trim() !== '薬局') continue
    // 薬剤師レベルの行を除外（薬剤師列に値あり）
    if (colPharmacist >= 0 && cols[colPharmacist] && cols[colPharmacist].trim() !== '') continue

    results.push({
      storeName:                    (cols[colStoreName] || '').trim(),
      storeCode:                    (cols[colStoreCode] || '').trim(),
      medicationGuidanceOutpatient: toNum(cols[colMgmtOut]),
      medicationGuidanceSpecial:    toNum(cols[colMgmtSp]),
      medicationGuidanceOnline:     toNum(cols[colMgmtOnline]),
      familyPharmacistCount:        toNum(cols[colFamCount]),
      familyPharmacistPossible:     toNum(cols[colFamPoss]),
      familyPharmacistRate:         toNum(cols[colFamRate]),
      specificDrugCount:            toNum(cols[colSpecCount]),
      specificDrugTarget:           toNum(cols[colSpecTarget]),
      specificDrugRate:             toNum(cols[colSpecRate]),
      duplicatePreventionCount:     toNum(cols[colDupPrev]),
      duplicateResidualCount:       toNum(cols[colDupResid]),
      outpatientSupport1:           toNum(cols[colOut1]),
      outpatientSupport2Under42:    toNum(cols[colOut2u42]),
      outpatientSupport2Over43:     toNum(cols[colOut2o43]),
      medInfo1:                     toNum(cols[colInfo1]),
      medInfo2Hospital:             toNum(cols[colInfo2Hosp]),
      medInfo2Refill:               toNum(cols[colInfo2Ref]),
      medInfo3:                     toNum(cols[colInfo3]),
      postDispenseMgmt1:            toNum(cols[colPostDM1]),
      postDispenseMgmt2:            toNum(cols[colPostDM2]),
      medicalDx1:                   toNum(cols[colDx1]),
      medicalDx2:                   toNum(cols[colDx2]),
      medicalDx3:                   toNum(cols[colDx3]),
    })
  }

  return results
}
