/**
 * 次回再来分析TSVパーサー
 * - 1行目がフィルター条件行のためスキップ
 * - 2行目が実際のヘッダー
 * - 階層名 = '薬局' の行のみ対象
 */

export type RevisitRow = {
  storeName:              string
  storeCode:              string
  overallPatientCount:    number
  overallRevisitRate:     number
  overallVisited:         number
  overallUnvisitedMed:    number
  overallUnvisitedDrop:   number
  newPatientCount:        number
  newRevisitRate:         number
  renewPatientCount:      number
  renewRevisitRate:       number
  returningPatientCount:  number
  returningRevisitRate:   number
}

function toNum(v: string | undefined): number {
  if (!v) return 0
  const n = parseFloat(v.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

export function parseRevisitTsv(text: string): RevisitRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 3) return []

  // 行0: フィルター条件 → スキップ
  // 行1: 実ヘッダー（Unnamed系が多い）
  // 行2以降: データ
  // → 行1の値でインデックスを特定
  const headers = lines[1].split('\t').map(h => h.trim())

  // 「全体」「Level1」「Level2」「薬局」「階層名」「お客様管理番号」は先頭6列固定
  const colStoreName = 3   // 薬局列
  const colStoreCode = 5   // お客様管理番号
  const colLevel     = 4   // 階層名

  // 全体_当該月の患者数, 全体_次回再来率, 全体_来局済, 未来局 服薬期間中, 未来局 脱落治療
  const idx = (keyword: string) => headers.findIndex(h => h.includes(keyword))

  const colOverallCount   = idx('全体_当該月の患者数')
  const colOverallRate    = idx('全体_次回再来率')
  const colOverallVisited = idx('全体_来局済 来局済患者数')
  const colOverallMed     = idx('全体_未来局 服薬期間中')
  const colOverallDrop    = idx('全体_未来局 脱落治療')
  const colNewCount       = idx('新患_当該月の患者数')
  const colNewRate        = idx('新患_次回再来率')
  const colRenewCount     = idx('再新患_当該月の患者数')
  const colRenewRate      = idx('再新患_次回再来率')
  const colReturnCount    = idx('再来_当該月の患者数')
  const colReturnRate     = idx('再来_次回再来率')

  const results: RevisitRow[] = []

  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    if (!cols[colLevel] || cols[colLevel].trim() !== '薬局') continue

    results.push({
      storeName:             (cols[colStoreName] || '').trim(),
      storeCode:             (cols[colStoreCode] || '').trim(),
      overallPatientCount:   toNum(cols[colOverallCount]),
      overallRevisitRate:    toNum(cols[colOverallRate]),
      overallVisited:        toNum(cols[colOverallVisited]),
      overallUnvisitedMed:   toNum(cols[colOverallMed]),
      overallUnvisitedDrop:  toNum(cols[colOverallDrop]),
      newPatientCount:       toNum(cols[colNewCount]),
      newRevisitRate:        toNum(cols[colNewRate]),
      renewPatientCount:     toNum(cols[colRenewCount]),
      renewRevisitRate:      toNum(cols[colRenewRate]),
      returningPatientCount: toNum(cols[colReturnCount]),
      returningRevisitRate:  toNum(cols[colReturnRate]),
    })
  }

  return results
}
