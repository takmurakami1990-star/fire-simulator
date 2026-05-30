'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSimulator } from '@/contexts/SimulatorContext'

function toMan(yen: number | null): string {
  if (yen === null) return ''
  return yen === 0 ? '0' : String(Math.round(yen / 10000))
}

function fromMan(man: string): number | null {
  const n = parseFloat(man)
  if (isNaN(n) || n < 0) return null
  return Math.round(n * 10000)
}

export default function ConditionsPage() {
  const router = useRouter()
  const { data, updateData } = useSimulator()

  const [currentAge, setCurrentAge] = useState(data.currentAge !== null ? String(data.currentAge) : '')
  const [monthlySavings, setMonthlySavings] = useState(toMan(data.monthlySavings))
  const [expectedYield, setExpectedYield] = useState(String(data.expectedYield))
  const [inflationRate, setInflationRate] = useState(String(data.inflationRate))
  const [pensionMonthly, setPensionMonthly] = useState(toMan(data.pensionMonthly))
  const [pensionStartAge, setPensionStartAge] = useState(String(data.pensionStartAge))
  const [hasChildren, setHasChildren] = useState(data.hasChildren)
  const [childrenCount, setChildrenCount] = useState(data.childrenCount !== null ? String(data.childrenCount) : '1')
  const [youngestChildAge, setYoungestChildAge] = useState(
    data.youngestChildAge !== null ? String(data.youngestChildAge) : ''
  )
  const [childIndependenceAge, setChildIndependenceAge] = useState(String(data.childIndependenceAge))
  const [monthlyChildcare, setMonthlyChildcare] = useState(toMan(data.monthlyChildcare))
  const [sideFIREIncome, setSideFIREIncome] = useState(toMan(data.sideFIREIncome))
  const [simulateUntilAge, setSimulateUntilAge] = useState(String(data.simulateUntilAge ?? 90))

  const isSideFIRE = data.fireCourse === 'side'
  const canProceed =
    currentAge !== '' &&
    parseInt(currentAge) >= 18 &&
    parseInt(currentAge) <= 70 &&
    fromMan(monthlySavings) !== null &&
    parseFloat(expectedYield) >= 0

  const handleNext = () => {
    if (!canProceed) return
    updateData({
      currentAge: parseInt(currentAge),
      monthlySavings: fromMan(monthlySavings),
      expectedYield: parseFloat(expectedYield),
      inflationRate: parseFloat(inflationRate) || 0,
      pensionMonthly: fromMan(pensionMonthly) ?? 0,
      pensionStartAge: parseInt(pensionStartAge) || 65,
      hasChildren,
      childrenCount: hasChildren ? parseInt(childrenCount) || 1 : null,
      youngestChildAge: hasChildren && youngestChildAge ? parseInt(youngestChildAge) : null,
      childIndependenceAge: parseInt(childIndependenceAge) || 22,
      monthlyChildcare: hasChildren ? fromMan(monthlyChildcare) : null,
      sideFIREIncome: isSideFIRE ? fromMan(sideFIREIncome) : null,
      simulateUntilAge: parseInt(simulateUntilAge) || 90,
    })
    router.push('/simulator/result')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">シミュレーション条件</h1>
        <p className="text-gray-500 mt-1 text-sm">あなたの状況に合わせて調整してください</p>
      </div>

      {/* 基本情報 */}
      <section className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">基本情報</h2>
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          <label className="flex-1 text-sm font-medium text-gray-800">現在の年齢</label>
          <input
            type="number"
            inputMode="numeric"
            value={currentAge}
            onChange={e => setCurrentAge(e.target.value)}
            placeholder="35"
            min="18"
            max="70"
            className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-xs text-gray-500 w-6">歳</span>
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">月々の貯蓄額</div>
            <div className="text-xs text-gray-400">手取りから生活費を引いた額</div>
          </div>
          <input
            type="number"
            inputMode="decimal"
            value={monthlySavings}
            onChange={e => setMonthlySavings(e.target.value)}
            placeholder="10"
            min="0"
            className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-xs text-gray-500 w-12">万円/月</span>
        </div>
      </section>

      {/* 運用設定 */}
      <section className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">運用設定</h2>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">期待リターン（年率）</div>
              <div className="text-xs text-gray-400">運用商品の長期平均リターンを入力</div>
            </div>
            <input
              type="number"
              inputMode="decimal"
              value={expectedYield}
              onChange={e => setExpectedYield(e.target.value)}
              step="0.5"
              min="0"
              max="20"
              className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-xs text-gray-500 w-4">%</span>
          </div>
          <div className="flex gap-2">
            {[
              { label: 'S&P500', value: '7' },
              { label: 'オルカン', value: '6' },
              { label: '保守的', value: '4' },
            ].map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => setExpectedYield(p.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  expectedYield === p.value
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-emerald-400 hover:text-emerald-600'
                }`}
              >
                {p.label} {p.value}%
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">インフレ率（年率）</div>
            <div className="text-xs text-gray-400">日本の目標は2%</div>
          </div>
          <input
            type="number"
            inputMode="decimal"
            value={inflationRate}
            onChange={e => setInflationRate(e.target.value)}
            step="0.5"
            min="0"
            max="10"
            className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-xs text-gray-500 w-4">%</span>
        </div>
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">想定寿命</div>
            <div className="text-xs text-gray-400">FIRE後のシミュレーション終了年齢</div>
          </div>
          <input
            type="number"
            inputMode="numeric"
            value={simulateUntilAge}
            onChange={e => setSimulateUntilAge(e.target.value)}
            min="70"
            max="120"
            className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-xs text-gray-500 w-6">歳</span>
        </div>
      </section>

      {/* 年金 */}
      <section className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">年金</h2>
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">受給予定額（月）</div>
            <div className="text-xs text-gray-400">ねんきん定期便を参照。0でもOK</div>
          </div>
          <input
            type="number"
            inputMode="decimal"
            value={pensionMonthly}
            onChange={e => setPensionMonthly(e.target.value)}
            placeholder="0"
            min="0"
            className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-xs text-gray-500 w-12">万円/月</span>
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          <label className="flex-1 text-sm font-medium text-gray-800">受給開始年齢</label>
          <input
            type="number"
            inputMode="numeric"
            value={pensionStartAge}
            onChange={e => setPensionStartAge(e.target.value)}
            min="60"
            max="75"
            className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-xs text-gray-500 w-6">歳</span>
        </div>
      </section>

      {/* サイドFIRE収入 */}
      {isSideFIRE && (
        <section className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          <div className="px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">サイドFIRE収入</h2>
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">月々の労働収入</div>
              <div className="text-xs text-gray-400">FIRE後に得る予定の収入</div>
            </div>
            <input
              type="number"
              inputMode="decimal"
              value={sideFIREIncome}
              onChange={e => setSideFIREIncome(e.target.value)}
              placeholder="5"
              min="0"
              className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-xs text-gray-500 w-12">万円/月</span>
          </div>
        </section>
      )}

      {/* 子ども */}
      <section className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">子ども</h2>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={hasChildren}
              onChange={e => setHasChildren(e.target.checked)}
              className="w-4 h-4 accent-emerald-600"
            />
            いる
          </label>
        </div>

        {hasChildren && (
          <>
            <div className="px-4 py-3 flex items-center gap-3">
              <label className="flex-1 text-sm font-medium text-gray-800">子どもの人数</label>
              <input
                type="number"
                inputMode="numeric"
                value={childrenCount}
                onChange={e => setChildrenCount(e.target.value)}
                min="1"
                max="10"
                className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-500 w-6">人</span>
            </div>

            <div className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">末子の現在の年齢</div>
                <div className="text-xs text-gray-400">一番下の子の年齢</div>
              </div>
              <input
                type="number"
                inputMode="numeric"
                value={youngestChildAge}
                onChange={e => setYoungestChildAge(e.target.value)}
                placeholder="5"
                min="0"
                max="21"
                className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-500 w-6">歳</span>
            </div>

            <div className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">子ども独立年齢</div>
                <div className="text-xs text-gray-400">何歳で独立とみなすか</div>
              </div>
              <input
                type="number"
                inputMode="numeric"
                value={childIndependenceAge}
                onChange={e => setChildIndependenceAge(e.target.value)}
                min="18"
                max="30"
                className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-500 w-6">歳</span>
            </div>

            <div className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">月々の子育て費用</div>
                <div className="text-xs text-gray-400">教育費・習い事など</div>
              </div>
              <input
                type="number"
                inputMode="decimal"
                value={monthlyChildcare}
                onChange={e => setMonthlyChildcare(e.target.value)}
                placeholder="5"
                min="0"
                className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-500 w-12">万円/月</span>
            </div>
          </>
        )}
      </section>

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/simulator/assets')}
          className="flex-1 border border-gray-300 text-gray-700 py-4 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
        >
          戻る
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex-grow-[2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-2xl font-semibold transition-colors"
        >
          計算する
        </button>
      </div>
    </div>
  )
}
