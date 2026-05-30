'use client'

import { useRouter } from 'next/navigation'
import { useSimulator } from '@/contexts/SimulatorContext'
import { FireCourse, COURSE_LABELS, COURSE_MULTIPLIERS, COURSE_PRESET_EXPENSES } from '@/types/simulator'

const COURSE_ICONS: Record<FireCourse, string> = {
  lean: '🌿',
  side: '💼',
  normal: '🏡',
  fat: '✨',
}

const COURSE_PHILOSOPHY: Record<FireCourse, string> = {
  lean: 'できるだけ早くFIREしたい。ある程度のリスクを取ってでも早期の自由を優先する',
  side: '完全リタイアでなくていい。好きなことで少し稼ぎながら自由に生きる',
  normal: '今の生活水準をそのまま保って、仕事を辞めたい',
  fat: 'お金の心配を一切したくない。完全に安心して自由に生きたい',
}

const COURSE_DETAIL: Record<FireCourse, string> = {
  lean: '月15万円前後の生活を想定。4%ルール（25倍）で達成は早いが運用リスクは高め',
  side: '月12〜20万円＋副業・パートなどで補う。必要資産は最も少ない（20倍）',
  normal: '月20〜25万円の生活を想定。やや保守的な3.6%ルール（28倍）',
  fat: '月30万円以上の生活を想定。最も保守的な3%ルール（33倍）で安全性が最高',
}

const COURSE_SWR: Record<FireCourse, string> = {
  lean: '取り崩し率 4.0%',
  side: '副収入で補完',
  normal: '取り崩し率 3.6%',
  fat: '取り崩し率 3.0%',
}

const COURSES: FireCourse[] = ['lean', 'side', 'normal', 'fat']

export default function CoursePage() {
  const router = useRouter()
  const { data, updateData } = useSimulator()

  const handleSelect = (course: FireCourse) => {
    updateData({ fireCourse: course, fireMonthlyExpenses: COURSE_PRESET_EXPENSES[course] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">FIREコースを選ぶ</h1>
        <p className="text-gray-500 mt-1 text-sm">あなたのFIREへのアプローチを選んでください</p>
      </div>

      <div className="space-y-3">
        {COURSES.map(course => {
          const swr = 1 / COURSE_MULTIPLIERS[course] * 100
          const isSelected = data.fireCourse === course
          return (
            <button
              key={course}
              onClick={() => handleSelect(course)}
              className={`w-full text-left rounded-2xl border-2 p-4 transition-all hover:shadow-md ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{COURSE_ICONS[course]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{COURSE_LABELS[course]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {COURSE_SWR[course]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mt-1 font-medium">{COURSE_PHILOSOPHY[course]}</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-400">{COURSE_DETAIL[course]}</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 bg-gray-100 rounded-lg px-2.5 py-1">
                    <span className="text-xs text-gray-500">生活費の目安</span>
                    <span className="text-sm font-bold text-gray-800">月{COURSE_PRESET_EXPENSES[course] / 10000}万円</span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-700">取り崩し率とは？</p>
        <p className="mt-1 text-gray-500">FIRE後に毎年資産の何%を使うかの割合。低いほど資産が長持ちしやすく、成功率が高くなります。コースによって異なる理由は、各コースが異なるリスク許容度を前提としているためです。</p>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-medium">コースは後から変更できます</p>
        <p className="mt-1 text-blue-600">結果画面で別のコースと比較することも可能です</p>
      </div>

      <button
        onClick={() => router.push('/simulator/expenses')}
        disabled={!data.fireCourse}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-2xl font-semibold transition-colors"
      >
        次へ
      </button>
    </div>
  )
}
