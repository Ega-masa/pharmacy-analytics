/**
 * 地域支援体制加算の算定実績TSVパーサー
 */

export type RegionalSupportRow = {
  storeName:         string
  storeCode:         string
  achievementCount:  number
  prescriptionCount: number
  item1Night:        number
  item2Narcotics:    number
  item3Duplicate:    number
  item4Family:       number
  item5OutSupport:   number
  item6DrugAdjust:   number
  item7HomeSingle:   number
  item8MedInfo:      number
  item9Pediatric:    number
}

function toNum(v: string | undefined): number {
  if (!v) return 0
  const n = parseFloat(v.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

export function parseRegionalSupportTsv(text: string): RegionalSupportRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  let headerIdx = 0
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].includes('お客様管理番号') || lines[i].includes('処方箋受付回数')) {
      headerIdx = i
      break
    }
  }

  const headers = lines[headerIdx].split('\t').map(h => h.trim())
  const idx = (keyword: string) => headers.findIndex(h => h.includes(keyword))

  const colStoreName = idx('薬局')
  const colStoreCode = idx('お客様管理番号')
  const colLevel     = idx('階層名')
  const colAchieve   = idx('達成数')
  const colPrescrip  = idx('処方箋受付回数')
  const colItem1     = idx('①夜間')
  const colItem2     = idx('②麻薬')
  const colItem3     = idx('③重複')
  const colItem4     = idx('④かかりつけ')
  const colItem5     = idx('⑤外来服薬支援料')
  const colItem6     = idx('⑥服用薬剤調整')
  const colItem7     = idx('⑦単一建物')
  const colItem8     = idx('⑧服薬情報')
  const colItem9     = idx('⑨小児')

  const results: RegionalSupportRow[] = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    // 地域支援は階層名が「薬局」のみ（全体行がない場合もある）
    if (colLevel >= 0 && cols[colLevel] && cols[colLevel].trim() !== '薬局') continue
    if (!cols[colStoreName] || !cols[colStoreName].trim()) continue

    results.push({
      storeName:         (cols[colStoreName] || '').trim(),
      storeCode:         (cols[colStoreCode] || '').trim(),
      achievementCount:  toNum(cols[colAchieve]),
      prescriptionCount: toNum(cols[colPrescrip]),
      item1Night:        toNum(cols[colItem1]),
      item2Narcotics:    toNum(cols[colItem2]),
      item3Duplicate:    toNum(cols[colItem3]),
      item4Family:       toNum(cols[colItem4]),
      item5OutSupport:   toNum(cols[colItem5]),
      item6DrugAdjust:   toNum(cols[colItem6]),
      item7HomeSingle:   toNum(cols[colItem7]),
      item8MedInfo:      toNum(cols[colItem8]),
      item9Pediatric:    toNum(cols[colItem9]),
    })
  }

  return results
}
