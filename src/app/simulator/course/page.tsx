'use client'

import { useRouter } from 'next/navigation'
import { useSimulator } from '@/contexts/SimulatorContext'
import { FireCourse, COURSE_LABELS, COURSE_MULTIPLIERS, COURSE_EXPENSE_GUIDE } from '@/types/simulator'

const COURSE_ICONS: Record<FireCourse, string> = {
  lean: '🌿',
  normal: '🏡',
  fat: '✨',
  side: '💼',
}

const COURSE_DESCRIPTIONS: Record<FireCourse, string> = {
  lean: `必要資産 = 年間生活費 × ${COURSE_MULTIPLIERS.lean}（4%ルール）`,
  normal: `必要資産 = 年間生活費 × ${COURSE_MULTIPLIERS.normal}`,
  fat: `必要資産 = 年間生活費 × ${COURSE_MULTIPLIERS.fat}`,
  side: `必要資産 = 年間生活費 × ${COURSE_MULTIPLIERS.side}（労働収入で補完）`,
}

const COURSES: FireCourse[] = ['lean', 'normal', 'fat', 'side']

export default function CoursePage() {
  const router = useRouter()
  const { data, updateData } = useSimulator()

  const handleSelect = (course: FireCourse) => {
    updateData({ fireCourse: course })
    router.push('/simulator/expenses')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">FIREコースを選ぶ</h1>
        <p className="text-gray-500 mt-1 text-sm">目指すライフスタイルに合ったコースを選んでください</p>
      </div>

      <div className="space-y-3">
        {COURSES.map(course => (
          <button
            key={course}
            onClick={() => handleSelect(course)}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all hover:shadow-md ${
              data.fireCourse === course
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-emerald-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{COURSE_ICONS[course]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{COURSE_LABELS[course]}</span>
                  {data.fireCourse === course && (
                    <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">選択中</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">{COURSE_EXPENSE_GUIDE[course]}</div>
                <div className="text-xs text-gray-400 mt-1">{COURSE_DESCRIPTIONS[course]}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-medium">コースは後から変更できます</p>
        <p className="mt-1 text-blue-600">結果画面で別のコースと比較することも可能です</p>
      </div>
    </div>
  )
}
