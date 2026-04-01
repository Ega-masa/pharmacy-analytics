/**
 * 薬学管理料（在宅）TSVパーサー
 * 外来と同じ構造 - 階層名='薬局' かつ 薬剤師列が空の行のみ対象
 */

export type PharmaHomeRow = {
  storeName:          string
  storeCode:          string
  homeVisitSingle:    number
  homeVisitMulti:     number
  homeVisitOther:     number
  homeResidentSingle: number
  homeResidentMulti:  number
  homeResidentOther:  number
  careHomeSingle:     number
  careHomeMulti:      number
  careHomeOther:      number
}

function toNum(v: string | undefined): number {
  if (!v || v.trim() === '' || v.trim() === 'NaN') return 0
  const n = parseFloat(v.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

export function parsePharmaHomeTsv(text: string): PharmaHomeRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  let headerIdx = 0
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].includes('お客様管理番号') || lines[i].includes('在宅患者')) {
      headerIdx = i
      break
    }
  }

  const headers = lines[headerIdx].split('\t').map(h => h.trim())
  const idx = (keyword: string) => headers.findIndex(h => h.includes(keyword))

  const colStoreName  = idx('薬局')
  const colStoreCode  = idx('お客様管理番号')
  const colLevel      = idx('階層名')
  const colPharmacist = idx('薬剤師')

  // 在宅患者訪問薬剤管理指導料
  const colHomeSingle = idx('在宅患者訪問薬剤管理指導料(単一建物診療患者１人)')
  const colHomeMulti  = idx('在宅患者訪問薬剤管理指導料(単一建物診療患者２人以上')
  const colHomeOther  = idx('在宅患者訪問薬剤管理指導料(１及び２以外)')

  // 居宅療養管理指導費
  const colResSingle  = idx('居宅療養管理指導費(単居宅療養管理指導費1)')
  const colResMulti   = idx('居宅療養管理指導費(単居宅療養管理指導費2)')
  const colResOther   = idx('居宅療養管理指導費(単居宅療養管理指導費3)')

  // 介護予防居宅
  const colCareSingle = idx('介護予防居宅療養管理指導費(介護予防居宅療養管理指導費1)')
  const colCareMulti  = idx('介護予防居宅療養管理指導費(介護予防居宅療養管理指導費2)')
  const colCareOther  = idx('介護予防居宅療養管理指導費(介護予防居宅療養管理指導費3)')

  const results: PharmaHomeRow[] = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    if (!cols[colLevel] || cols[colLevel].trim() !== '薬局') continue
    if (colPharmacist >= 0 && cols[colPharmacist] && cols[colPharmacist].trim() !== '') continue

    results.push({
      storeName:          (cols[colStoreName] || '').trim(),
      storeCode:          (cols[colStoreCode] || '').trim(),
      homeVisitSingle:    colHomeSingle >= 0 ? toNum(cols[colHomeSingle]) : 0,
      homeVisitMulti:     colHomeMulti  >= 0 ? toNum(cols[colHomeMulti])  : 0,
      homeVisitOther:     colHomeOther  >= 0 ? toNum(cols[colHomeOther])  : 0,
      homeResidentSingle: colResSingle  >= 0 ? toNum(cols[colResSingle])  : 0,
      homeResidentMulti:  colResMulti   >= 0 ? toNum(cols[colResMulti])   : 0,
      homeResidentOther:  colResOther   >= 0 ? toNum(cols[colResOther])   : 0,
      careHomeSingle:     colCareSingle >= 0 ? toNum(cols[colCareSingle]) : 0,
      careHomeMulti:      colCareMulti  >= 0 ? toNum(cols[colCareMulti])  : 0,
      careHomeOther:      colCareOther  >= 0 ? toNum(cols[colCareOther])  : 0,
    })
  }

  return results
}
