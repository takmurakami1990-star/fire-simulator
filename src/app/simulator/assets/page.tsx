'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSimulator } from '@/contexts/SimulatorContext'
import { Assets } from '@/types/simulator'

interface AssetField {
  key: keyof Assets
  label: string
  description: string
}

const ASSET_FIELDS: AssetField[] = [
  { key: 'cashReserve', label: '生活防衛費・現金', description: '緊急用の現金（投資に回さない分）' },
  { key: 'cashInvestment', label: '投資用現金', description: '近く投資する予定の現金' },
  { key: 'nisaTsumitate', label: 'つみたてNISA', description: 'つみたてNISA口座の評価額' },
  { key: 'nisaGrowth', label: '成長投資枠NISA', description: '成長投資枠の評価額' },
  { key: 'ideoDc', label: 'iDeCo・DC', description: 'iDeCo / 企業型DCの評価額' },
  { key: 'taxable', label: '特定・一般口座', description: '課税口座の株・投信の評価額' },
  { key: 'other', label: 'その他資産', description: '不動産・仮想通貨・金など' },
]

function toMan(yen: number): string {
  return yen === 0 ? '' : String(Math.round(yen / 10000))
}

function fromMan(man: string): number {
  const n = parseFloat(man)
  return isNaN(n) || n < 0 ? 0 : Math.round(n * 10000)
}

export default function AssetsPage() {
  const router = useRouter()
  const { data, updateData } = useSimulator()

  const [assets, setAssets] = useState<Record<keyof Assets, string>>({
    cashReserve: toMan(data.assets.cashReserve),
    cashInvestment: toMan(data.assets.cashInvestment),
    nisaTsumitate: toMan(data.assets.nisaTsumitate),
    nisaGrowth: toMan(data.assets.nisaGrowth),
    ideoDc: toMan(data.assets.ideoDc),
    taxable: toMan(data.assets.taxable),
    other: toMan(data.assets.other),
  })

  const [loanBalance, setLoanBalance] = useState(
    data.loanBalance !== null ? String(Math.round(data.loanBalance / 10000)) : ''
  )
  const [loanPayment, setLoanPayment] = useState(
    data.loanMonthlyPayment !== null ? String(Math.round(data.loanMonthlyPayment / 10000)) : ''
  )
  const [hasLoan, setHasLoan] = useState(data.loanBalance !== null && data.loanBalance > 0)

  const handleAssetChange = (key: keyof Assets, val: string) => {
    setAssets(prev => ({ ...prev, [key]: val }))
  }

  const totalAssets = Object.values(assets).reduce((sum, v) => sum + fromMan(v), 0)

  const handleNext = () => {
    const parsedAssets: Assets = {
      cashReserve: fromMan(assets.cashReserve),
      cashInvestment: fromMan(assets.cashInvestment),
      nisaTsumitate: fromMan(assets.nisaTsumitate),
      nisaGrowth: fromMan(assets.nisaGrowth),
      ideoDc: fromMan(assets.ideoDc),
      taxable: fromMan(assets.taxable),
      other: fromMan(assets.other),
    }
    updateData({
      assets: parsedAssets,
      loanBalance: hasLoan && loanBalance ? fromMan(loanBalance) : null,
      loanMonthlyPayment: hasLoan && loanPayment ? fromMan(loanPayment) : null,
    })
    router.push('/simulator/conditions')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">現在の資産を入力</h1>
        <p className="text-gray-500 mt-1 text-sm">各口座・資産の現在の評価額（万円）を入力してください。0でも空白でもOKです</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {ASSET_FIELDS.map(field => (
          <div key={field.key} className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800">{field.label}</div>
              <div className="text-xs text-gray-400">{field.description}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                inputMode="decimal"
                value={assets[field.key]}
                onChange={e => handleAssetChange(field.key, e.target.value)}
                placeholder="0"
                min="0"
                className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <span className="text-xs text-gray-500">万円</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-emerald-50 rounded-xl px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-medium text-emerald-800">資産合計</span>
        <span className="text-lg font-bold text-emerald-700">
          {Math.round(totalAssets / 10000).toLocaleString()} 万円
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasLoan}
            onChange={e => setHasLoan(e.target.checked)}
            className="w-4 h-4 accent-emerald-600"
          />
          <span className="text-sm font-medium text-gray-700">住宅ローンがある</span>
        </label>

        {hasLoan && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-24 shrink-0">残高</label>
              <input
                type="number"
                inputMode="decimal"
                value={loanBalance}
                onChange={e => setLoanBalance(e.target.value)}
                placeholder="2000"
                min="0"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-500 shrink-0">万円</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-24 shrink-0">月々返済額</label>
              <input
                type="number"
                inputMode="decimal"
                value={loanPayment}
                onChange={e => setLoanPayment(e.target.value)}
                placeholder="10"
                min="0"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-500 shrink-0">万円/月</span>
            </div>
            <p className="text-xs text-gray-400">※ローン完済後は返済額が貯蓄に加算されます</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/simulator/expenses')}
          className="flex-1 border border-gray-300 text-gray-700 py-4 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
        >
          戻る
        </button>
        <button
          onClick={handleNext}
          className="flex-grow-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold transition-colors"
        >
          次へ
        </button>
      </div>
    </div>
  )
}
