export type FireCourse = 'lean' | 'normal' | 'fat' | 'side'

export interface Assets {
  cashReserve: number
  cashInvestment: number
  nisaTsumitate: number
  nisaGrowth: number
  ideoDc: number
  taxable: number
  other: number
}

export interface SimulatorData {
  // S-02
  fireCourse: FireCourse | null
  // S-03
  currentMonthlyExpenses: number | null
  fireMonthlyExpenses: number | null
  // S-04
  assets: Assets
  loanBalance: number | null
  loanMonthlyPayment: number | null
  // S-05
  currentAge: number | null
  monthlySavings: number | null
  expectedYield: number
  inflationRate: number
  pensionMonthly: number
  pensionStartAge: number
  hasChildren: boolean
  childrenCount: number | null
  youngestChildAge: number | null
  childIndependenceAge: number
  monthlyChildcare: number | null
  taxSocialInsurance: number
  sideFIREIncome: number | null
}

export const defaultSimulatorData: SimulatorData = {
  fireCourse: null,
  currentMonthlyExpenses: null,
  fireMonthlyExpenses: null,
  assets: {
    cashReserve: 0,
    cashInvestment: 0,
    nisaTsumitate: 0,
    nisaGrowth: 0,
    ideoDc: 0,
    taxable: 0,
    other: 0,
  },
  loanBalance: null,
  loanMonthlyPayment: null,
  currentAge: null,
  monthlySavings: null,
  expectedYield: 5.0,
  inflationRate: 2.0,
  pensionMonthly: 0,
  pensionStartAge: 65,
  hasChildren: false,
  childrenCount: null,
  youngestChildAge: null,
  childIndependenceAge: 22,
  monthlyChildcare: null,
  taxSocialInsurance: 20000,
  sideFIREIncome: null,
}

export const COURSE_LABELS: Record<FireCourse, string> = {
  lean: 'リーンFIRE',
  normal: '普通のFIRE',
  fat: 'ファットFIRE',
  side: 'サイドFIRE',
}

export const COURSE_MULTIPLIERS: Record<FireCourse, number> = {
  lean: 25,
  normal: 28,
  fat: 33,
  side: 20,
}

export const COURSE_EXPENSE_GUIDE: Record<FireCourse, string> = {
  lean: '月15万円〜（生活費を最小化した水準）',
  normal: '月20〜25万円（現在の生活水準を維持）',
  fat: '月30万円〜（余裕のある生活水準）',
  side: '月12〜20万円（労働収入で一部を補う水準）',
}

export interface SimulationResult {
  requiredAssets: number
  monthsToFIRE: number | null
  fireAge: number | null
  successRate: number | null
  monthlyData: MonthlyData[]
  loanPayoffMonth: number | null
  pensionStartMonth: number | null
}

export interface MonthlyData {
  month: number
  assets: number
  phase: 'accumulation' | 'fire'
}

export interface MonteCarloResult {
  successRate: number
  median: number[]
  upper25: number[]
  lower25: number[]
}
