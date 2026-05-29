'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSimulator } from '@/contexts/SimulatorContext'
import { runSimulation, runMonteCarlo } from '@/lib/simulation'
import { SimulationResult, MonteCarloResult, COURSE_LABELS } from '@/types/simulator'

function formatMan(yen: number): string {
  const man = Math.round(yen / 10000)
  if (man >= 10000) {
    const oku = Math.floor(man / 10000)
    const remainder = man % 10000
    return remainder > 0 ? `${oku}億${remainder.toLocaleString()}万円` : `${oku}億円`
  }
  return `${man.toLocaleString()}万円`
}

function ProgressRing({ rate }: { rate: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (rate / 100) * circumference
  const color = rate >= 90 ? '#10b981' : rate >= 70 ? '#f59e0b' : '#ef4444'

  return (
    <svg width="140" height="140" className="rotate-[-90deg]">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
      <circle
        cx="70" cy="70" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  )
}

export default function ResultPage() {
  const router = useRouter()
  const { data } = useSimulator()
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [monte, setMonte] = useState<MonteCarloResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(true)

  const calculate = useCallback(() => {
    setIsCalculating(true)
    const sim = runSimulation(data)
    setResult(sim)

    if (sim.monthsToFIRE !== null) {
      setTimeout(() => {
        const mc = runMonteCarlo(data, 1000)
        setMonte(mc)
        setIsCalculating(false)
      }, 50)
    } else {
      setIsCalculating(false)
    }
  }, [data])

  useEffect(() => {
    if (!data.fireCourse || !data.currentAge) {
      router.push('/simulator/course')
      return
    }
    calculate()
  }, [calculate, data.fireCourse, data.currentAge, router])

  if (isCalculating || !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">シミュレーション計算中...</p>
      </div>
    )
  }

  const courseLabel = data.fireCourse ? COURSE_LABELS[data.fireCourse] : ''
  const canFIRE = result.monthsToFIRE !== null
  const successRate = monte?.successRate ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">シミュレーション結果</h1>
        <p className="text-gray-500 mt-1 text-sm">{courseLabel}のシミュレーション結果</p>
      </div>

      {/* 必要資産額 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="text-sm font-medium text-gray-500 mb-1">必要資産額（FIRE達成の目標）</div>
        <div className="text-3xl font-bold text-emerald-600">{formatMan(result.requiredAssets)}</div>
        <div className="text-xs text-gray-400 mt-1">
          FIRE後の月間生活費 {data.fireMonthlyExpenses ? Math.round(data.fireMonthlyExpenses / 10000) : 0}万円 × {data.fireCourse ? `${result.requiredAssets / ((data.fireMonthlyExpenses ?? 1) * 12)}倍（年間生活費比）` : ''}
        </div>
      </div>

      {/* FIRE達成時期 */}
      {canFIRE ? (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
          <div className="text-sm font-medium text-emerald-700 mb-1">FIRE達成時期</div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-bold text-emerald-700">
              {result.fireAge}歳
            </div>
            <div className="text-lg text-emerald-600">
              （あと{Math.floor((result.monthsToFIRE ?? 0) / 12)}年
              {(result.monthsToFIRE ?? 0) % 12 > 0 ? `${(result.monthsToFIRE ?? 0) % 12}ヶ月` : ''}）
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-2">
            資産残高が目標額（{formatMan(result.requiredAssets)}）に到達する時期
          </p>
          {result.loanPayoffMonth !== null && (
            <div className="mt-1 text-xs text-emerald-600">
              住宅ローン完済：{data.currentAge! + Math.floor(result.loanPayoffMonth / 12)}歳（{Math.floor(result.loanPayoffMonth / 12)}年後）
            </div>
          )}
          {result.pensionStartMonth !== null && (
            <div className="text-xs text-emerald-600">
              年金受給開始：{data.pensionStartAge}歳
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
          <div className="text-sm font-medium text-amber-700 mb-1">FIRE達成</div>
          <div className="text-lg font-bold text-amber-700">50年以内には達成できません</div>
          <p className="text-xs text-amber-600 mt-2">
            貯蓄額の増加・生活費の削減・期待リターンの見直しを検討してみましょう
          </p>
        </div>
      )}

      {/* モンテカルロ成功率 */}
      {canFIRE && monte !== null && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-500 mb-1">その後30年間、資産は持つか？</div>
          <p className="text-xs text-gray-400 mb-3">
            {result.fireAge}歳でFIREし、{(result.fireAge ?? 0) + 30}歳まで月{data.fireMonthlyExpenses ? Math.round(data.fireMonthlyExpenses / 10000) : 0}万円を取り崩した場合の資産継続確率（1,000パターンでシミュレーション）
          </p>
          <div className="flex items-center gap-6">
            <div className="relative">
              <ProgressRing rate={successRate ?? 0} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{Math.round(successRate ?? 0)}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 text-sm">
              <div className={`font-semibold ${(successRate ?? 0) >= 90 ? 'text-emerald-600' : (successRate ?? 0) >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                {(successRate ?? 0) >= 90 ? '安全性が高い計画です' :
                  (successRate ?? 0) >= 70 ? '概ね安全ですが改善の余地あり' :
                    '資産枯渇リスクが高めです'}
              </div>
              <p className="text-gray-400 text-xs">
                1,000回中{Math.round((successRate ?? 0) * 10)}回は{(result.fireAge ?? 0) + 30}歳時点で資産が残るシナリオ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 資産推移グラフ */}
      {result.monthlyData.length > 0 && (() => {
        const currentAge = data.currentAge!
        const BAR_COUNT = 60
        const interval = Math.max(1, Math.floor(result.monthlyData.length / BAR_COUNT))
        const sampled = result.monthlyData.filter((_, i) => i % interval === 0)
        const maxAssets = Math.max(...sampled.map(d => d.assets), result.requiredAssets)

        // 横軸ラベル：5歳刻みで表示
        const firstAge = currentAge
        const lastMonth = result.monthlyData[result.monthlyData.length - 1].month
        const lastAge = currentAge + Math.floor(lastMonth / 12)
        const labelAges: number[] = []
        const startLabel = Math.ceil(firstAge / 5) * 5
        for (let age = startLabel; age <= lastAge; age += 5) {
          labelAges.push(age)
        }

        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="text-sm font-medium text-gray-500 mb-3">資産推移</div>
            <div className="relative">
              {/* バーグラフ */}
              <div className="h-36 flex items-end gap-px">
                {sampled.map((d, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm ${d.phase === 'fire' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ height: `${(d.assets / maxAssets) * 100}%` }}
                  />
                ))}
              </div>

              {/* 横軸ラベル */}
              <div className="relative h-5 mt-1">
                {labelAges.map(age => {
                  const monthsFromNow = (age - currentAge) * 12
                  const posRatio = monthsFromNow / lastMonth
                  if (posRatio < 0 || posRatio > 1) return null
                  return (
                    <span
                      key={age}
                      className="absolute text-xs text-gray-400 -translate-x-1/2"
                      style={{ left: `${posRatio * 100}%` }}
                    >
                      {age}歳
                    </span>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" />貯蓄期</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" />FIRE後</span>
            </div>
          </div>
        )
      })()}

      {/* アクション */}
      <div className="space-y-3">
        <button
          onClick={() => router.push('/simulator/conditions')}
          className="w-full border border-gray-300 text-gray-700 py-4 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
        >
          条件を変えて再計算
        </button>
        <button
          onClick={() => router.push('/simulator/course')}
          className="w-full border border-emerald-300 text-emerald-700 py-3 rounded-2xl font-medium hover:bg-emerald-50 transition-colors text-sm"
        >
          FIREコースを変えて比較する
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        ※ 本シミュレーションは参考値です。税金・手数料は考慮していません。投資助言ではありません。
      </p>
    </div>
  )
}
