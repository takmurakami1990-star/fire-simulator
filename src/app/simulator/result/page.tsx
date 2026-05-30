'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSimulator } from '@/contexts/SimulatorContext'
import { runSimulation, runMonteCarlo, runMonteCarloFromFire } from '@/lib/simulation'
import { SimulationResult, MonteCarloResult, COURSE_LABELS, COURSE_MULTIPLIERS } from '@/types/simulator'

function formatMan(yen: number): string {
  const man = Math.round(yen / 10000)
  if (man >= 10000) {
    const oku = Math.floor(man / 10000)
    const remainder = man % 10000
    return remainder > 0 ? `${oku}億${remainder.toLocaleString()}万円` : `${oku}億円`
  }
  return `${man.toLocaleString()}万円`
}

function MonteCarloChart({
  fireAge, requiredAssets, fireMonthlyExpenses, monte, simulateUntilAge,
}: {
  fireAge: number
  requiredAssets: number
  fireMonthlyExpenses: number
  monte: MonteCarloResult
  simulateUntilAge: number
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const W = 500; const H = 180
  const PL = 52; const PR = 8; const PT = 22; const PB = 24
  const cW = W - PL - PR; const cH = H - PT - PB
  const SAMPLE = 2
  const medianS = monte.median.filter((_, i) => i % SAMPLE === 0)
  const upper25S = monte.upper25.filter((_, i) => i % SAMPLE === 0)
  const lower25S = monte.lower25.filter((_, i) => i % SAMPLE === 0)
  const totalM = monte.median.length
  const maxA = Math.max(...monte.upper25, requiredAssets) * 1.05

  const xOf = (i: number) => PL + ((i * SAMPLE) / totalM) * cW
  const yOf = (v: number) => PT + cH - Math.min(Math.max(v, 0) / maxA, 1) * cH
  const zeroY = yOf(0)
  const startY = yOf(requiredAssets)

  // 3〜5本になるようにキリのいい縦軸目盛りを生成
  const yTicks: number[] = (() => {
    // 候補ステップ（万円単位）
    const candidates = [500, 1000, 2000, 3000, 5000, 10000, 20000, 30000, 50000]
    const maxMan = Math.round(maxA / 10000)
    const chosen = candidates.find(s => {
      const count = Math.floor(maxMan * 0.93 / s)
      return count >= 3 && count <= 5
    }) ?? candidates[candidates.length - 1]
    const ticks: number[] = []
    for (let v = chosen; v < maxMan * 0.93; v += chosen) {
      ticks.push(v * 10000)
    }
    return ticks
  })()

  const upperPts = upper25S.map((v, i) => `${xOf(i)},${yOf(v)}`)
  const lowerPts = lower25S.map((v, i) => `${xOf(i)},${yOf(v)}`)
  const bandPath = upperPts.length > 0
    ? `M ${upperPts.join(' L ')} L ${[...lowerPts].reverse().join(' L ')} Z`
    : ''
  const medianPts = medianS.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ')

  const labelAges: number[] = []
  for (let age = Math.ceil(fireAge / 5) * 5; age <= simulateUntilAge; age += 5) {
    labelAges.push(age)
  }

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * W
    const ratio = (svgX - PL) / cW
    const idx = Math.max(0, Math.min(Math.round(ratio * (medianS.length - 1)), medianS.length - 1))
    setHoverIdx(idx)
  }

  const hoverX = hoverIdx !== null ? xOf(hoverIdx) : null
  const hoverAge = hoverIdx !== null ? fireAge + Math.round((hoverIdx * SAMPLE) / 12) : null
  const hoverMedian = hoverIdx !== null ? medianS[hoverIdx] : null
  const hoverUpper = hoverIdx !== null ? upper25S[hoverIdx] : null
  const hoverLower = hoverIdx !== null ? lower25S[hoverIdx] : null
  // ツールチップをグラフの右半分では左側に表示
  const tooltipOnLeft = hoverIdx !== null && hoverIdx > medianS.length * 0.55

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="font-medium text-gray-800 mb-0.5">FIRE後の資産シミュレーション</div>
      <p className="text-xs text-gray-400 mb-3">
        {fireAge}歳・{formatMan(requiredAssets)}からスタートして月{Math.round(fireMonthlyExpenses / 10000)}万円を取り崩した場合の{simulateUntilAge}歳までの推移（1,000通りのシナリオ）
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none cursor-crosshair"
        onPointerMove={handlePointer}
        onPointerLeave={() => setHoverIdx(null)}
      >
        {/* 縦軸グリッド線 + ラベル */}
        {yTicks.map(v => {
          const y = yOf(v)
          const man = Math.round(v / 10000)
          const label = man >= 10000
            ? (man % 10000 === 0 ? `${man / 10000}億` : `${(man / 10000).toFixed(1)}億`)
            : `${man.toLocaleString()}万`
          return (
            <g key={v}>
              <line x1={PL} y1={y} x2={W - PR} y2={y}
                stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
              <text x={PL - 4} y={y + 3} fontSize="9" fill="#9ca3af" textAnchor="end">
                {label}
              </text>
            </g>
          )
        })}
        {/* 資産ゼロライン */}
        <line x1={PL} y1={zeroY} x2={W - PR} y2={zeroY}
          stroke="#ef4444" strokeWidth="1.5" opacity="0.7" />
        <text x={PL - 4} y={zeroY + 3} fontSize="9" fill="#ef4444" textAnchor="end">
          0
        </text>
        {/* バンド */}
        {bandPath && <path d={bandPath} fill="#fbbf24" fillOpacity="0.3" />}
        {/* 上下25%点線 */}
        <polyline points={upperPts.join(' ')} fill="none"
          stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" opacity="0.8" />
        <polyline points={lowerPts.join(' ')} fill="none"
          stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" opacity="0.8" />
        {/* 中央値 */}
        <polyline points={medianPts} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
        {/* 横軸 */}
        {labelAges.map(age => (
          <text key={age} x={xOf((age - fireAge) * 12 / SAMPLE)} y={H - 5}
            fontSize="9" fill="#9ca3af" textAnchor="middle">{age}歳</text>
        ))}
        {/* ホバー：縦線 + ドット */}
        {hoverX !== null && hoverIdx !== null && (
          <>
            <line x1={hoverX} y1={PT} x2={hoverX} y2={PT + cH}
              stroke="#6b7280" strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
            {hoverMedian !== null && (
              <circle cx={hoverX} cy={yOf(hoverMedian)} r="4" fill="#f59e0b" />
            )}
            {hoverUpper !== null && (
              <circle cx={hoverX} cy={yOf(hoverUpper)} r="3" fill="#f59e0b" opacity="0.6" />
            )}
            {hoverLower !== null && (
              <circle cx={hoverX} cy={yOf(hoverLower)} r="3" fill="#f59e0b" opacity="0.6" />
            )}
            {/* ツールチップ */}
            <g transform={`translate(${tooltipOnLeft ? hoverX - 118 : hoverX + 8}, ${PT + 4})`}>
              <rect x="0" y="0" width="110" height="64" rx="6"
                fill="white" stroke="#e5e7eb" strokeWidth="1"
                style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.12))' }} />
              <text x="8" y="15" fontSize="9" fill="#6b7280" fontWeight="bold">
                {hoverAge}歳時点
              </text>
              <text x="8" y="30" fontSize="9" fill="#f59e0b">
                上位25%: {hoverUpper !== null ? formatMan(hoverUpper) : '-'}
              </text>
              <text x="8" y="43" fontSize="9" fill="#d97706" fontWeight="bold">
                中央値:  {hoverMedian !== null ? formatMan(hoverMedian) : '-'}
              </text>
              <text x="8" y="56" fontSize="9" fill="#f59e0b">
                下位25%: {hoverLower !== null ? formatMan(hoverLower) : '-'}
              </text>
            </g>
          </>
        )}
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
        <span className="text-gray-300">グラフをタップ/ホバーで値を確認</span>
      </div>
    </div>
  )
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

interface ScenarioResult {
  label: string
  description: string
  rate: number
  fireAge: number | null
  delta: number
}

interface FixOption {
  label: string
  detail: string
  fireAge: number
}

export default function ResultPage() {
  const router = useRouter()
  const { data, resetData } = useSimulator()
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [monte, setMonte] = useState<MonteCarloResult | null>(null)
  const [scenarios, setScenarios] = useState<ScenarioResult[] | null>(null)
  const [fixOptions, setFixOptions] = useState<FixOption[] | null>(null)
  const [isCalculating, setIsCalculating] = useState(true)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')

  const calculate = useCallback(() => {
    setIsCalculating(true)
    setScenarios(null)
    setFixOptions(null)
    const sim = runSimulation(data)
    setResult(sim)

    if (sim.monthsToFIRE !== null) {
      setTimeout(() => {
        const mc = runMonteCarlo(data, 1000)
        setMonte(mc)

        // 改善シナリオ試算
        const scenarioResults: ScenarioResult[] = []

        // 1. 生活費10%削減
        if (data.fireMonthlyExpenses) {
          const reduced = Math.round(data.fireMonthlyExpenses * 0.9)
          const sd = { ...data, fireMonthlyExpenses: reduced }
          const ss = runSimulation(sd)
          if (ss.monthsToFIRE !== null) {
            const sm = runMonteCarlo(sd, 1000)
            scenarioResults.push({
              label: '月の生活費を10%削減',
              description: `月${Math.round(reduced / 10000)}万円に抑えた場合`,
              rate: sm.successRate,
              fireAge: ss.fireAge,
              delta: sm.successRate - mc.successRate,
            })
          }
        }

        // 2. FIREを2年遅らせる
        if (sim.fireAge !== null && sim.fireAge + 2 < data.simulateUntilAge) {
          const monthlyYield = (data.expectedYield / 100) / 12
          let delayedAssets = sim.requiredAssets
          for (let m = 0; m < 24; m++) {
            delayedAssets = delayedAssets * (1 + monthlyYield) + (data.monthlySavings ?? 0)
          }
          const delayedFireAge = sim.fireAge + 2
          const dm = runMonteCarloFromFire(data, delayedAssets, delayedFireAge, 1000)
          scenarioResults.push({
            label: 'FIREを2年遅らせる',
            description: `${delayedFireAge}歳でFIREし、より多くの資産を持ってスタート`,
            rate: dm.successRate,
            fireAge: delayedFireAge,
            delta: dm.successRate - mc.successRate,
          })
        }

        // 3. 月5万円の副収入を追加
        {
          const sd = { ...data, sideFIREIncome: (data.sideFIREIncome ?? 0) + 50000 }
          const ss = runSimulation(sd)
          if (ss.monthsToFIRE !== null) {
            const sm = runMonteCarlo(sd, 1000)
            scenarioResults.push({
              label: '月5万円の副収入を追加',
              description: '副業・パートなどで月5万円を補う場合',
              rate: sm.successRate,
              fireAge: ss.fireAge,
              delta: sm.successRate - mc.successRate,
            })
          }
        }

        setScenarios(scenarioResults.sort((a, b) => b.delta - a.delta).slice(0, 3))

        setIsCalculating(false)
      }, 50)
    } else {
      // FIRE未達成：何をすれば達成できるか試算
      setTimeout(() => {
        const options: FixOption[] = []

        const FIRE_AGE_LIMIT = 65

        // 1. 貯蓄額を増やす（2万円刻みで最小値を探す）
        for (let add = 20000; add <= 400000; add += 20000) {
          const s = runSimulation({ ...data, monthlySavings: (data.monthlySavings ?? 0) + add })
          if (s.monthsToFIRE !== null && s.fireAge !== null && s.fireAge < FIRE_AGE_LIMIT) {
            options.push({
              label: `月の貯蓄額を${add / 10000}万円増やす`,
              detail: `月${Math.round(((data.monthlySavings ?? 0) + add) / 10000)}万円の貯蓄で達成`,
              fireAge: s.fireAge,
            })
            break
          }
        }

        // 2. 生活費を削減（5%刻みで最小削減率を探す）
        if (data.fireMonthlyExpenses) {
          for (const ratio of [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.6, 0.5]) {
            const reduced = Math.round(data.fireMonthlyExpenses * ratio)
            const s = runSimulation({ ...data, fireMonthlyExpenses: reduced })
            if (s.monthsToFIRE !== null && s.fireAge !== null && s.fireAge < FIRE_AGE_LIMIT) {
              const cut = Math.round((data.fireMonthlyExpenses - reduced) / 10000)
              options.push({
                label: `生活費を月${cut}万円削減する`,
                detail: `月${Math.round(reduced / 10000)}万円の生活費で達成`,
                fireAge: s.fireAge,
              })
              break
            }
          }
        }

        // 3. リーンFIREに変更（既にリーンでなければ）
        if (data.fireCourse !== 'lean') {
          const s = runSimulation({ ...data, fireCourse: 'lean' })
          if (s.monthsToFIRE !== null && s.fireAge !== null && s.fireAge < FIRE_AGE_LIMIT) {
            options.push({
              label: 'リーンFIREコースに切り替える',
              detail: '取り崩し率4.0%（25倍）で必要資産を減らす',
              fireAge: s.fireAge,
            })
          }
        }

        setFixOptions(options)
        setIsCalculating(false)
      }, 50)
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

  // FIRE未達成の原因を判別
  const maxAssets = result.monthlyData[result.monthlyData.length - 1]?.assets ?? 0
  const firstReachIdx = result.monthlyData.findIndex(d => d.assets >= result.requiredAssets)
  const actualReachAge = firstReachIdx >= 0
    ? (data.currentAge ?? 0) + Math.floor((firstReachIdx + 1) / 12)
    : null

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
        <>
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
            {actualReachAge !== null ? (
              <>
                <div className="text-sm font-medium text-amber-700 mb-1">FIRE達成時期</div>
                <div className="text-lg font-bold text-amber-700">早期FIRE（65歳未満）は難しい状況です</div>
                <p className="text-xs text-amber-600 mt-2">
                  現在の条件では{actualReachAge}歳で目標額に到達しますが、早期退職（65歳未満）の条件を満たしていません。
                </p>
              </>
            ) : (
              <>
                <div className="text-sm font-medium text-amber-700 mb-1">試算結果</div>
                <div className="text-lg font-bold text-amber-700">50年間積み立てても目標額に届きません</div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600">目標額</span>
                    <span className="font-semibold text-amber-700">{formatMan(result.requiredAssets)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600">50年後の資産（見込み）</span>
                    <span className="font-semibold text-amber-700">{formatMan(maxAssets)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-amber-200 pt-1.5">
                    <span className="text-amber-600 font-medium">不足額</span>
                    <span className="font-bold text-amber-700">
                      {formatMan(Math.max(0, result.requiredAssets - maxAssets))}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {fixOptions !== null && fixOptions.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="font-medium text-gray-800 mb-0.5">こうすれば達成できます</div>
              <p className="text-xs text-gray-400 mb-4">条件を変えた場合のシミュレーション</p>
              <div className="divide-y divide-gray-100">
                {fixOptions.map(opt => (
                  <div key={opt.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800">{opt.label}</div>
                      <div className="text-xs text-gray-400">{opt.detail}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-emerald-600">{opt.fireAge}歳</div>
                      <div className="text-xs text-gray-400">でFIRE</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fixOptions !== null && fixOptions.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-sm text-gray-500">
              貯蓄額の大幅な増加、または生活費の削減を検討してください。
            </div>
          )}
        </>
      )}

      {/* モンテカルロ成功率 */}
      {canFIRE && monte !== null && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-sm font-medium text-gray-500">{data.simulateUntilAge}歳まで資産は持つか？</div>
            {data.fireCourse && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                取り崩し率 {(1 / COURSE_MULTIPLIERS[data.fireCourse] * 100).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-3">
            {result.fireAge}歳でFIREし、{data.simulateUntilAge}歳まで月{data.fireMonthlyExpenses ? Math.round(data.fireMonthlyExpenses / 10000) : 0}万円を取り崩した場合の資産継続確率（1,000パターンでシミュレーション）
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
                1,000回中{Math.round((successRate ?? 0) * 10)}回は{data.simulateUntilAge}歳時点で資産が残るシナリオ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 改善シナリオ */}
      {canFIRE && scenarios !== null && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="font-medium text-gray-800 mb-0.5">成功率を上げるには？</div>
          <p className="text-xs text-gray-400 mb-4">条件を変えた場合の成功率シミュレーション</p>
          <div className="divide-y divide-gray-100">
            {scenarios.map(s => (
              <div key={s.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{s.label}</div>
                  <div className="text-xs text-gray-400">{s.description}</div>
                  {s.fireAge !== null && s.fireAge !== result?.fireAge && (
                    <div className="text-xs text-emerald-600 mt-0.5">FIRE時期: {s.fireAge}歳</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xl font-bold ${s.rate >= 90 ? 'text-emerald-600' : s.rate >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
                    {Math.round(s.rate)}%
                  </div>
                  <div className={`text-xs font-semibold ${s.delta >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                    {s.delta >= 0 ? '+' : ''}{Math.round(s.delta)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* グラフ: FIRE後の資産シミュレーション */}
      {canFIRE && monte !== null && (
        <MonteCarloChart
          fireAge={result.fireAge!}
          requiredAssets={result.requiredAssets}
          fireMonthlyExpenses={data.fireMonthlyExpenses ?? 0}
          monte={monte}
          simulateUntilAge={data.simulateUntilAge}
        />
      )}

      {/* アクション */}
      <div className="space-y-3">
        <button
          onClick={() => router.push('/simulator/conditions')}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold transition-colors"
        >
          条件を変えて再計算する
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/simulator/course')}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            コースを変えて比較
          </button>
          <button
            onClick={async () => {
              const text = [
                `FIREシミュレーション結果`,
                `必要資産: ${formatMan(result.requiredAssets)}`,
                canFIRE && result.fireAge ? `FIRE達成: ${result.fireAge}歳` : 'FIRE達成: 条件を見直し中',
                successRate !== null ? `成功率: ${Math.round(successRate)}%` : null,
              ].filter(Boolean).join('\n')

              if (navigator.share) {
                await navigator.share({ title: 'FIREシミュレーション結果', text })
              } else {
                await navigator.clipboard.writeText(text)
                setShareStatus('copied')
                setTimeout(() => setShareStatus('idle'), 2000)
              }
            }}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {shareStatus === 'copied' ? 'コピーしました' : '結果をシェア'}
          </button>
        </div>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full text-gray-400 py-2 text-sm hover:text-gray-600 transition-colors"
          >
            最初からやり直す
          </button>
        ) : (
          <div className="border border-red-200 bg-red-50 rounded-2xl p-4 space-y-3">
            <p className="text-sm text-red-700 font-medium text-center">入力データがすべてリセットされます。よろしいですか？</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => { resetData(); router.push('/simulator/course') }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                リセットする
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        ※ 本シミュレーションは参考値です。税金・手数料は考慮していません。投資助言ではありません。
      </p>
    </div>
  )
}
