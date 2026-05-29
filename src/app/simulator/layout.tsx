'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const STEPS = [
  { path: '/simulator/course', label: 'コース', step: 1 },
  { path: '/simulator/expenses', label: '生活費', step: 2 },
  { path: '/simulator/assets', label: '資産', step: 3 },
  { path: '/simulator/conditions', label: '条件', step: 4 },
  { path: '/simulator/result', label: '結果', step: 5 },
]

export default function SimulatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentStep = STEPS.find(s => pathname.startsWith(s.path))?.step ?? 1

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/" className="text-emerald-600 font-bold text-lg">FIRE</Link>
            <span className="text-gray-500 text-sm">シミュレーター</span>
          </div>
          <div className="flex items-center gap-1">
            {STEPS.map((step, i) => (
              <div key={step.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      step.step < currentStep
                        ? 'bg-emerald-500 text-white'
                        : step.step === currentStep
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step.step < currentStep ? '✓' : step.step}
                  </div>
                  <span className={`text-xs mt-0.5 ${step.step === currentStep ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mb-4 mx-0.5 transition-colors ${step.step < currentStep ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  )
}
