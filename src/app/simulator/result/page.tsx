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

      {/* グラフ: FIRE後の資産シミュレーション */}
      {canFIRE && monte !== null && (() => {
        const fireAge = result.fireAge!
        const SAMPLE = 2
        const medianS = monte.median.filter((_, i) => i % SAMPLE === 0)
        const upper25S = monte.upper25.filter((_, i) => i % SAMPLE === 0)
        const lower25S = monte.lower25.filter((_, i) => i % SAMPLE === 0)
        const W = 500; const H = 170
        const PL = 8; const PR = 8; const PT = 20; const PB = 24
        const cW = W - PL - PR; const cH = H - PT - PB
        const totalM = monte.median.length
        const maxA = Math.max(...monte.upper25, result.requiredAssets) * 1.05
        const xOf = (i: number) => PL + ((i * SAMPLE) / totalM) * cW
        const yOf = (v: number) => PT + cH - Math.min(Math.max(v, 0) / maxA, 1) * cH
        const zeroY = yOf(0)
        const startY = yOf(result.requiredAssets)
        const upperPts = upper25S.map((v, i) => `${xOf(i)},${yOf(v)}`)
        const lowerPts = lower25S.map((v, i) => `${xOf(i)},${yOf(v)}`)
        const bandPath = upperPts.length > 0
          ? `M ${upperPts.join(' L ')} L ${[...lowerPts].reverse().join(' L ')} Z`
          : ''
        const medianPts = medianS.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ')
        const labelAges: number[] = []
        for (let age = Math.ceil(fireAge / 5) * 5; age <= fireAge + 30; age += 5) {
          labelAges.push(age)
        }
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="font-medium text-gray-800 mb-0.5">FIRE後の資産シミュレーション</div>
            <p className="text-xs text-gray-400 mb-3">
              {fireAge}歳・{formatMan(result.requiredAssets)}からスタートして月{data.fireMonthlyExpenses ? Math.round(data.fireMonthlyExpenses / 10000) : 0}万円を取り崩した場合の30年間の推移（1,000通りのシナリオ）
            </p>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
              {/* 開始点ラベル */}
              <text x={PL + 3} y={startY - 5} fontSize="9" fill="#6b7280">
                開始: {formatMan(result.requiredAssets)}
              </text>
              {/* 資産ゼロライン */}
              <line x1={PL} y1={zeroY} x2={W - PR} y2={zeroY}
                stroke="#ef4444" strokeWidth="1.5" opacity="0.7" />
              <text x={PL + 3} y={zeroY - 4} fontSize="9" fill="#ef4444">
                資産ゼロ（枯渇）
              </text>
              {/* バンド */}
              {bandPath && <path d={bandPath} fill="#fbbf24" fillOpacity="0.3" />}
              {/* 上下25%点線 */}
              {upperPts.length > 0 && (
                <polyline points={upperPts.join(' ')} fill="none"
                  stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" opacity="0.8" />
              )}
              {lowerPts.length > 0 && (
                <polyline points={lowerPts.join(' ')} fill="none"
                  stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" opacity="0.8" />
              )}
              {/* 中央値 */}
              {medianPts && (
                <polyline points={medianPts} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
              )}
              {/* 横軸 */}
              {labelAges.map(age => (
                <text key={age} x={xOf((age - fireAge) * 12 / SAMPLE)} y={H - 5}
                  fontSize="9" fill="#9ca3af" textAnchor="middle">{age}歳</text>
              ))}
            </svg>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#f59e0b" strokeWidth="2.5"/></svg>
                中央値（1,000回の真ん中）
              </span>
              <span className="flex items-center gap-1">
                <svg width="16" height="8"><rect x="0" y="1" width="16" height="6" fill="#fbbf24" fillOpacity="0.4"/></svg>
                シナリオのばらつき幅
              </span>
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
