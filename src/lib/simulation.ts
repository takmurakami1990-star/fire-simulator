import { SimulatorData, SimulationResult, MonthlyData, MonteCarloResult, COURSE_MULTIPLIERS } from '@/types/simulator'

function stdDevForYield(annualYield: number): number {
  if (annualYield >= 5) return 0.15
  if (annualYield >= 3) return 0.10
  return 0.07
}

// シード付きPRNG（mulberry32）- 同じ入力なら常に同じ結果を返す
function createPRNG(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 入力パラメータからシードを導出（FNVハッシュ）
function deriveSeed(d: SimulatorData): number {
  const total = Object.values(d.assets).reduce((s, v) => s + v, 0)
  const nums = [
    d.currentAge ?? 0,
    d.monthlySavings ?? 0,
    Math.round(d.expectedYield * 10),
    Math.round(d.inflationRate * 10),
    Math.round(total / 10000),
    Math.round((d.fireMonthlyExpenses ?? 0) / 10000),
    Math.round((d.pensionMonthly ?? 0) / 10000),
    d.pensionStartAge,
    d.simulateUntilAge,
    d.hasChildren ? 1 : 0,
    Math.round((d.sideFIREIncome ?? 0) / 10000),
    d.fireCourse === 'lean' ? 1 : d.fireCourse === 'normal' ? 2 : d.fireCourse === 'fat' ? 3 : 4,
  ]
  let hash = 2166136261
  for (const n of nums) {
    hash ^= (n & 0xFFFFFFFF)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

// Box-Muller 法で正規分布乱数を生成（シード付きPRNG使用）
function randNormWith(rand: () => number, mean: number, std: number): number {
  const u1 = Math.max(rand(), 1e-10)
  const u2 = rand()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + std * z
}

export function runSimulation(d: SimulatorData): SimulationResult {
  const {
    fireCourse,
    fireMonthlyExpenses,
    assets,
    loanBalance,
    loanMonthlyPayment,
    currentAge,
    monthlySavings,
    expectedYield,
    inflationRate,
    pensionMonthly,
    pensionStartAge,
    hasChildren,
    youngestChildAge,
    childIndependenceAge,
    monthlyChildcare,
    sideFIREIncome,
  } = d

  if (!fireCourse || !fireMonthlyExpenses || !currentAge || monthlySavings === null) {
    return {
      requiredAssets: 0,
      monthsToFIRE: null,
      fireAge: null,
      successRate: null,
      monthlyData: [],
      loanPayoffMonth: null,
      pensionStartMonth: null,
    }
  }

  const multiplier = COURSE_MULTIPLIERS[fireCourse]
  const annualFireExpenses = fireMonthlyExpenses * 12
  const requiredAssets = annualFireExpenses * multiplier

  const monthlyYield = (expectedYield / 100) / 12
  const monthlyInflation = (inflationRate / 100) / 12

  // 初期資産：ローン残高を差し引く（元本のみ）
  const totalAssets = Object.values(assets).reduce((s, v) => s + v, 0)
  const initialLoanBalance = loanBalance ?? 0
  let currentAssets = totalAssets - initialLoanBalance
  let remainingLoan = initialLoanBalance
  const loanMonthlyAmt = loanMonthlyPayment ?? 0

  const monthlyData: MonthlyData[] = []
  let monthsToFIRE: number | null = null
  let loanPayoffMonth: number | null = null
  let pensionStartMonth: number | null = null

  const MAX_MONTHS = 600 // 50年
  const pensionMonthlyAmt = pensionMonthly ?? 0
  const pensionStartMonthOffset = pensionStartAge > currentAge
    ? (pensionStartAge - currentAge) * 12
    : 0

  for (let m = 0; m < MAX_MONTHS; m++) {
    // ローン返済処理
    if (remainingLoan > 0) {
      const payment = Math.min(loanMonthlyAmt, remainingLoan)
      remainingLoan -= payment
      if (remainingLoan <= 0 && loanPayoffMonth === null) {
        loanPayoffMonth = m
      }
    }

    // 年金開始チェック
    if (m === pensionStartMonthOffset && pensionStartMonth === null && pensionMonthlyAmt > 0) {
      pensionStartMonth = m
    }

    const phase = monthsToFIRE === null ? 'accumulation' : 'fire'

    if (phase === 'accumulation') {
      // 貯蓄フェーズ：毎月貯蓄 + 運用益 - 子育て費用（蓄積期の調整）
      let effectiveSavings = monthlySavings

      // ローン完済後は返済額を貯蓄に加算
      if (remainingLoan <= 0 && loanMonthlyAmt > 0 && loanPayoffMonth !== null && m > loanPayoffMonth) {
        effectiveSavings += loanMonthlyAmt
      }

      // 子育て費用を貯蓄から差し引く
      if (hasChildren && youngestChildAge !== null && monthlyChildcare) {
        const childAgeAtMonth = youngestChildAge + m / 12
        if (childAgeAtMonth < (childIndependenceAge ?? 22)) {
          effectiveSavings = Math.max(0, effectiveSavings - monthlyChildcare)
        }
      }

      currentAssets = currentAssets * (1 + monthlyYield) + effectiveSavings

      if (currentAssets >= requiredAssets && monthsToFIRE === null) {
        const impliedAge = currentAge + Math.floor((m + 1) / 12)
        if (impliedAge < 65) {
          monthsToFIRE = m + 1
        }
      }
    } else {
      // 取崩しフェーズ
      const currentPension = m >= pensionStartMonthOffset ? pensionMonthlyAmt : 0
      const sideIncome = sideFIREIncome ?? 0
      const inflatedExpenses = fireMonthlyExpenses * Math.pow(1 + monthlyInflation, m)

      // 子育て費用（FIRE後も独立まで継続）
      let childcareCost = 0
      if (hasChildren && youngestChildAge !== null && monthlyChildcare) {
        const childAgeAtMonth = youngestChildAge + m / 12
        if (childAgeAtMonth < (childIndependenceAge ?? 22)) {
          childcareCost = monthlyChildcare
        }
      }

      const totalIncome = currentPension + sideIncome
      const totalExpenses = inflatedExpenses + childcareCost
      const realWithdrawal = Math.max(0, totalExpenses - totalIncome)

      currentAssets = currentAssets * (1 + monthlyYield) - realWithdrawal
    }

    monthlyData.push({ month: m, assets: Math.max(0, currentAssets), phase })

    if (monthsToFIRE !== null && currentAssets <= 0) break
  }

  const fireAge = monthsToFIRE !== null ? currentAge + Math.floor(monthsToFIRE / 12) : null

  return {
    requiredAssets,
    monthsToFIRE,
    fireAge,
    successRate: null, // モンテカルロで別途計算
    monthlyData,
    loanPayoffMonth,
    pensionStartMonth,
  }
}

// 任意のFIRE時点（資産・年齢）からMCを開始する（シナリオ試算用）
export function runMonteCarloFromFire(
  d: SimulatorData,
  startingAssets: number,
  fireAge: number,
  runs = 1000
): MonteCarloResult {
  const {
    expectedYield, inflationRate, pensionMonthly, pensionStartAge,
    hasChildren, youngestChildAge, childIndependenceAge, monthlyChildcare,
    sideFIREIncome, fireMonthlyExpenses, simulateUntilAge, currentAge,
  } = d

  if (!fireMonthlyExpenses) return { successRate: 0, median: [], upper25: [], lower25: [] }

  const annualYield = expectedYield / 100
  const annualStd = stdDevForYield(expectedYield)
  const monthlyStdDev = annualStd / Math.sqrt(12)
  const monthlyInflation = (inflationRate / 100) / 12

  const untilAge = simulateUntilAge ?? 90
  const SIMULATE_MONTHS = Math.max(12, (untilAge - fireAge) * 12)
  const pensionStartMonthOffset = pensionStartAge > fireAge ? (pensionStartAge - fireAge) * 12 : 0
  const monthsToThisFire = (fireAge - (currentAge ?? 0)) * 12

  const rand = createPRNG(deriveSeed(d) ^ (fireAge * 31) ^ (startingAssets >>> 10))
  const allPaths: number[][] = []
  let successCount = 0

  for (let r = 0; r < runs; r++) {
    let assets_val = startingAssets
    const path: number[] = [assets_val]
    let ruined = false

    for (let m = 0; m < SIMULATE_MONTHS; m++) {
      const monthlyReturn = randNormWith(rand, annualYield / 12, monthlyStdDev)
      const currentPension = m >= pensionStartMonthOffset ? (pensionMonthly ?? 0) : 0
      const sideIncome = sideFIREIncome ?? 0
      const inflatedExpenses = fireMonthlyExpenses * Math.pow(1 + monthlyInflation, m)

      let childcareCost = 0
      if (hasChildren && youngestChildAge !== null && monthlyChildcare) {
        const childAge = (youngestChildAge ?? 0) + monthsToThisFire / 12 + m / 12
        if (childAge < (childIndependenceAge ?? 22)) childcareCost = monthlyChildcare
      }

      const realWithdrawal = Math.max(0, inflatedExpenses + childcareCost - currentPension - sideIncome)
      assets_val = assets_val * (1 + monthlyReturn) - realWithdrawal

      if (assets_val <= 0) { assets_val = 0; ruined = true }
      path.push(Math.max(0, assets_val))
    }

    if (!ruined) successCount++
    allPaths.push(path)
  }

  const successRate = (successCount / runs) * 100
  const pathLength = SIMULATE_MONTHS + 1
  const median: number[] = []
  const upper25: number[] = []
  const lower25: number[] = []

  for (let m = 0; m < pathLength; m++) {
    const values = allPaths.map(p => p[m]).sort((a, b) => a - b)
    median.push(values[Math.floor(runs * 0.5)])
    upper25.push(values[Math.floor(runs * 0.75)])
    lower25.push(values[Math.floor(runs * 0.25)])
  }

  return { successRate, median, upper25, lower25 }
}

export function runMonteCarlo(d: SimulatorData, runs = 1000): MonteCarloResult {
  const {
    fireCourse,
    fireMonthlyExpenses,
    assets,
    loanBalance,
    currentAge,
    monthlySavings,
    expectedYield,
    inflationRate,
    pensionMonthly,
    pensionStartAge,
    hasChildren,
    youngestChildAge,
    childIndependenceAge,
    monthlyChildcare,
    sideFIREIncome,
    simulateUntilAge,
  } = d

  if (!fireCourse || !fireMonthlyExpenses || !currentAge || monthlySavings === null) {
    return { successRate: 0, median: [], upper25: [], lower25: [] }
  }

  const baseResult = runSimulation(d)
  if (baseResult.monthsToFIRE === null) {
    return { successRate: 0, median: [], upper25: [], lower25: [] }
  }

  const multiplier = COURSE_MULTIPLIERS[fireCourse]
  const annualFireExpenses = fireMonthlyExpenses * 12
  const requiredAssets = annualFireExpenses * multiplier

  const annualYield = expectedYield / 100
  const annualStd = stdDevForYield(expectedYield)
  const monthlyStdDev = annualStd / Math.sqrt(12)
  const monthlyInflation = (inflationRate / 100) / 12

  const fireAge = currentAge + Math.floor((baseResult.monthsToFIRE ?? 0) / 12)
  const untilAge = simulateUntilAge ?? 90
  const SIMULATE_MONTHS = Math.max(12, (untilAge - fireAge) * 12)
  const pensionStartMonthOffset = pensionStartAge > currentAge
    ? (pensionStartAge - currentAge) * 12
    : 0

  const rand = createPRNG(deriveSeed(d))
  const allPaths: number[][] = []
  let successCount = 0

  for (let r = 0; r < runs; r++) {
    let assets_val = requiredAssets
    const path: number[] = [assets_val]
    let ruined = false

    for (let m = 0; m < SIMULATE_MONTHS; m++) {
      const monthlyReturn = randNormWith(rand, annualYield / 12, monthlyStdDev)
      const currentPension = m >= pensionStartMonthOffset - (baseResult.monthsToFIRE ?? 0)
        ? (pensionMonthly ?? 0)
        : 0
      const sideIncome = sideFIREIncome ?? 0
      const inflatedExpenses = fireMonthlyExpenses * Math.pow(1 + monthlyInflation, m)

      let childcareCost = 0
      if (hasChildren && youngestChildAge !== null && monthlyChildcare) {
        const childAge = (youngestChildAge ?? 0) + (baseResult.monthsToFIRE ?? 0) / 12 + m / 12
        if (childAge < (childIndependenceAge ?? 22)) {
          childcareCost = monthlyChildcare
        }
      }

      const totalIncome = currentPension + sideIncome
      const totalExpenses = inflatedExpenses + childcareCost
      const realWithdrawal = Math.max(0, totalExpenses - totalIncome)

      assets_val = assets_val * (1 + monthlyReturn) - realWithdrawal

      if (assets_val <= 0) {
        assets_val = 0
        ruined = true
      }

      path.push(Math.max(0, assets_val))
    }

    if (!ruined) successCount++
    allPaths.push(path)
  }

  const successRate = (successCount / runs) * 100

  // パスの中央値・上位25%・下位25%を計算
  const pathLength = SIMULATE_MONTHS + 1
  const median: number[] = []
  const upper25: number[] = []
  const lower25: number[] = []

  for (let m = 0; m < pathLength; m++) {
    const values = allPaths.map(p => p[m]).sort((a, b) => a - b)
    median.push(values[Math.floor(runs * 0.5)])
    upper25.push(values[Math.floor(runs * 0.75)])
    lower25.push(values[Math.floor(runs * 0.25)])
  }

  return { successRate, median, upper25, lower25 }
}
