export type DeviationInput = {
  storeId: string
  value: number
}

/** 偏差値計算: (値 - 平均) / 標準偏差 × 10 + 50 */
export function calcDeviation(value: number, allValues: number[]): number {
  const n = allValues.length
  if (n < 2) return 50
  const mean = allValues.reduce((a, b) => a + b, 0) / n
  const variance = allValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n
  const std = Math.sqrt(variance)
  if (std === 0) return 50
  return Math.round(((value - mean) / std) * 10 + 50)
}

/** 順位計算 (値が大きいほど良い場合) */
export function calcRankDesc(value: number, allValues: number[]): number {
  return allValues.filter(v => v > value).length + 1
}

/** 順位計算 (値が小さいほど良い場合: 離脱率など) */
export function calcRankAsc(value: number, allValues: number[]): number {
  return allValues.filter(v => v < value).length + 1
}

export type StoreMetrics = {
  storeId: string
  // 収益
  totalRevenue: number
  visitCount: number
  techFeeUnit: number
  drugFeeUnit: number
  // 次回再来
  overallRevisitRate: number
  newRevisitRate: number
  retentionRate: number    // 継続患者の次回再来率 = returning_revisit_rate
  dropoutRate: number      // 1 - overall_revisit_rate
  // 薬学管理
  duplicateCount: number
  duplicateRate: number    // duplicate / visit_count
  onePackCount: number
  onePackRate: number
  onePackOutpatientCount: number
  tracingReportCount: number
  tracingReportRate: number
  specificAddCount: number
  specificAddRate: number
}

export function calcAllDeviations(stores: StoreMetrics[]) {
  const vals = (key: keyof StoreMetrics) =>
    stores.map(s => s[key] as number)

  return stores.map(s => {
    const totalRevenues = vals('totalRevenue')
    const visitCounts = vals('visitCount')
    const techFees = vals('techFeeUnit')
    const drugFees = vals('drugFeeUnit')
    const overallRevisits = vals('overallRevisitRate')
    const newRevisits = vals('newRevisitRate')
    const retentions = vals('retentionRate')
    const dropouts = vals('dropoutRate')
    const duplicates = vals('duplicateRate')
    const onePacks = vals('onePackRate')
    const onePackOuts = vals('onePackOutpatientCount')
    const tracings = vals('tracingReportRate')
    const specifics = vals('specificAddRate')

    const revDev = calcDeviation(s.totalRevenue, totalRevenues)
    const vcDev  = calcDeviation(s.visitCount, visitCounts)
    const tfDev  = calcDeviation(s.techFeeUnit, techFees)
    const dfDev  = calcDeviation(s.drugFeeUnit, drugFees)
    const orDev  = calcDeviation(s.overallRevisitRate, overallRevisits)
    const nrDev  = calcDeviation(s.newRevisitRate, newRevisits)
    const rtDev  = calcDeviation(s.retentionRate, retentions)
    // 患者対応偏差値 = 離脱率の逆（低いほど良い → 高偏差値）
    const patDev = calcDeviation(-s.dropoutRate, dropouts.map(d => -d))
    const dupDev = calcDeviation(s.duplicateRate, duplicates)
    const opDev  = calcDeviation(s.onePackRate, onePacks)
    const trDev  = calcDeviation(s.tracingReportRate, tracings)
    const spDev  = calcDeviation(s.specificAddRate, specifics)

    // 総合偏差値 = 主要偏差値の平均
    const totalDev = Math.round(
      (revDev + vcDev + tfDev + orDev + nrDev + rtDev + dupDev + opDev + trDev + spDev) / 10
    )

    return {
      storeId: s.storeId,
      totalStoreCount: stores.length,
      revenueDeviation:          revDev,
      revenueRank:               calcRankDesc(s.totalRevenue, totalRevenues),
      visitCountDeviation:       vcDev,
      visitCountRank:            calcRankDesc(s.visitCount, visitCounts),
      techFeeUnitDeviation:      tfDev,
      techFeeUnitRank:           calcRankDesc(s.techFeeUnit, techFees),
      drugFeeUnitDeviation:      dfDev,
      drugFeeUnitRank:           calcRankDesc(s.drugFeeUnit, drugFees),
      totalDeviation:            totalDev,
      totalRank:                 calcRankDesc(totalDev, stores.map((_, i) =>
        calcDeviation(stores[i].totalRevenue, totalRevenues))),
      overallRevisitDeviation:   orDev,
      overallRevisitRank:        calcRankDesc(s.overallRevisitRate, overallRevisits),
      newRevisitDeviation:       nrDev,
      newRevisitRank:            calcRankDesc(s.newRevisitRate, newRevisits),
      dropoutRate:               s.dropoutRate,
      retentionDeviation:        rtDev,
      retentionRank:             calcRankDesc(s.retentionRate, retentions),
      patientResponseDeviation:  patDev,
      patientResponseRank:       calcRankAsc(s.dropoutRate, dropouts),
      duplicateRate:             s.duplicateRate,
      duplicateDeviation:        dupDev,
      duplicateRank:             calcRankDesc(s.duplicateRate, duplicates),
      onePackRate:               s.onePackRate,
      onePackDeviation:          opDev,
      onePackRank:               calcRankDesc(s.onePackRate, onePacks),
      onePackOutpatientDeviation: calcDeviation(s.onePackOutpatientCount, onePackOuts),
      onePackOutpatientRank:      calcRankDesc(s.onePackOutpatientCount, onePackOuts),
      tracingReportRate:         s.tracingReportRate,
      tracingReportDeviation:    trDev,
      tracingReportRank:         calcRankDesc(s.tracingReportRate, tracings),
      specificAddRate:           s.specificAddRate,
      specificAddDeviation:      spDev,
      specificAddRank:           calcRankDesc(s.specificAddRate, specifics),
    }
  })
}
