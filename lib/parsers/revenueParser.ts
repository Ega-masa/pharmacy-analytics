/**
 * 収益系分析CSVをペーストされたTSVテキストからパースする
 * - 「薬局」レベルの行のみを対象とする（全体・Level1・Level2を除外）
 */

export type RevenueRow = {
  storeName:   string
  storeCode:   string
  totalRevenue:          number
  prescriptionRevenue:   number
  prescriptionUnitPrice: number
  visitCount:            number
  prescriptionScore:     number
  dispensingBaseFee:     number
  drugPreparationFee:    number
  additionFee:           number
  guidanceMgmtFee:       number
  drugFee:               number
  techFeeUnit:           number
  drugFeeUnit:           number
}

function toNum(v: string | undefined): number {
  if (!v) return 0
  const n = parseFloat(v.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

export function parseRevenueTsv(text: string): RevenueRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  // ヘッダー行を探す（「全体」「Level1」などが含まれる行）
  let headerIdx = 0
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].includes('お客様管理番号') || lines[i].includes('調剤事業')) {
      headerIdx = i
      break
    }
  }

  const headers = lines[headerIdx].split('\t').map(h => h.trim())

  const idx = (name: string) => headers.findIndex(h => h.includes(name))

  const colStoreName  = idx('薬局')
  const colStoreCode  = idx('お客様管理番号')
  const colLevel      = idx('階層名')
  const colRevenue    = idx('調剤事業の総収益_収益')
  const colPrescRev   = idx('医療保険（処方箋）_収益')
  const colUnitPrice  = idx('医療保険（処方箋）_処方箋単価')
  const colVisit      = idx('医療保険（処方箋）_受付回数')
  const colScore      = idx('医療保険（処方箋）_点数')
  const colBase       = idx('調剤基本料_収益')
  const colDrugPrep   = idx('薬剤調製料の合計_収益')
  const colAddition   = idx('加算の合計_収益')
  const colGuidance   = idx('指導管理料の合計_収益')
  const colDrug       = idx('薬剤料の合計_収益')

  const results: RevenueRow[] = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    if (!cols[colLevel] || cols[colLevel].trim() !== '薬局') continue

    const visitCount = toNum(cols[colVisit])
    const baseFee    = toNum(cols[colBase])
    const prepFee    = toNum(cols[colDrugPrep])
    const addFee     = toNum(cols[colAddition])
    const guidFee    = toNum(cols[colGuidance])
    const drugFee    = toNum(cols[colDrug])
    const techTotal  = baseFee + prepFee + addFee + guidFee

    results.push({
      storeName:             (cols[colStoreName] || '').trim(),
      storeCode:             (cols[colStoreCode] || '').trim(),
      totalRevenue:          toNum(cols[colRevenue]),
      prescriptionRevenue:   toNum(cols[colPrescRev]),
      prescriptionUnitPrice: toNum(cols[colUnitPrice]),
      visitCount,
      prescriptionScore:     toNum(cols[colScore]),
      dispensingBaseFee:     baseFee,
      drugPreparationFee:    prepFee,
      additionFee:           addFee,
      guidanceMgmtFee:       guidFee,
      drugFee,
      techFeeUnit:  visitCount > 0 ? Math.round(techTotal / visitCount) : 0,
      drugFeeUnit:  visitCount > 0 ? Math.round(drugFee  / visitCount) : 0,
    })
  }

  return results
}
