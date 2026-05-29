'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSimulator } from '@/contexts/SimulatorContext'

function toManYen(yen: number | null): string {
  if (yen === null || yen === 0) return ''
  return String(Math.round(yen / 10000))
}

function fromManYen(man: string): number | null {
  const n = parseFloat(man)
  if (isNaN(n) || n < 0) return null
  return Math.round(n * 10000)
}

export default function ExpensesPage() {
  const router = useRouter()
  const { data, updateData } = useSimulator()

  const [currentExp, setCurrentExp] = useState(toManYen(data.currentMonthlyExpenses))
  const [fireExp, setFireExp] = useState(toManYen(data.fireMonthlyExpenses))
  const [sameAsNow, setSameAsNow] = useState(
    data.fireMonthlyExpenses !== null &&
    data.currentMonthlyExpenses !== null &&
    data.fireMonthlyExpenses === data.currentMonthlyExpenses
  )

  const handleSameAsNow = (checked: boolean) => {
    setSameAsNow(checked)
    if (checked) {
      setFireExp(currentExp)
    }
  }

  const handleCurrentChange = (val: string) => {
    setCurrentExp(val)
    if (sameAsNow) setFireExp(val)
  }

  const canProceed = fromManYen(currentExp) !== null && fromManYen(fireExp) !== null

  const handleNext = () => {
    updateData({
      currentMonthlyExpenses: fromManYen(currentExp),
      fireMonthlyExpenses: fromManYen(fireExp),
    })
    router.push('/simulator/assets')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">生活費を入力</h1>
        <p className="text-gray-500 mt-1 text-sm">月々の生活費の合計を入力してください（住居費・食費・光熱費など全て含む）</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">現在の月々の生活費</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={currentExp}
                onChange={e => handleCurrentChange(e.target.value)}
                placeholder="20"
                min="0"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <span className="text-gray-600 font-medium whitespace-nowrap">万円 / 月</span>
            </div>
          </label>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">FIRE後の月々の生活費</span>
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={sameAsNow}
                onChange={e => handleSameAsNow(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
              現在と同じ
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={fireExp}
              onChange={e => setFireExp(e.target.value)}
              disabled={sameAsNow}
              placeholder="20"
              min="0"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
            <span className="text-gray-600 font-medium whitespace-nowrap">万円 / 月</span>
          </div>
          <p className="text-xs text-gray-400">FIRE後は通勤費・被服費が減る一方、趣味・医療費が増えることもあります</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/simulator/course')}
          className="flex-1 border border-gray-300 text-gray-700 py-4 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
        >
          戻る
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex-2 flex-grow-[2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-2xl font-semibold transition-colors"
        >
          次へ
        </button>
      </div>
    </div>
  )
}
