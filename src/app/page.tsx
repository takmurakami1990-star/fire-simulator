import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <span className="text-2xl font-bold text-emerald-600">FIRE</span>
          <span className="text-lg font-medium text-gray-700">シミュレーター</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              あなたの<span className="text-emerald-600">FIRE達成日</span>を<br />
              計算してみよう
            </h1>
            <p className="text-gray-600 text-lg">
              資産・貯蓄・生活費を入力するだけで<br />
              FIRE達成まであと何年かわかります
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-emerald-600 mb-1">3分</div>
              <div className="text-gray-500">入力時間</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-emerald-600 mb-1">無料</div>
              <div className="text-gray-500">シミュレーション</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-emerald-600 mb-1">4種類</div>
              <div className="text-gray-500">FIREコース</div>
            </div>
          </div>

          <Link
            href="/simulator/course"
            className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold py-4 px-8 rounded-2xl transition-colors shadow-md"
          >
            シミュレーションを始める
          </Link>

          <p className="text-xs text-gray-400">
            登録不要・無料で利用できます
          </p>
        </div>

        <div className="max-w-xl w-full mt-16 space-y-4">
          <h2 className="text-center text-sm font-medium text-gray-500 uppercase tracking-wide">
            4つのFIREコース
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'リーンFIRE', desc: '生活費を最小化', color: 'blue' },
              { label: '普通のFIRE', desc: '現在の生活水準を維持', color: 'emerald' },
              { label: 'ファットFIRE', desc: '余裕のある生活', color: 'amber' },
              { label: 'サイドFIRE', desc: '労働収入で一部を補う', color: 'purple' },
            ].map(course => (
              <div key={course.label} className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="font-semibold text-gray-800 text-sm">{course.label}</div>
                <div className="text-xs text-gray-500 mt-1">{course.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        ※ 本シミュレーションは参考値です。投資助言ではありません。
      </footer>
    </div>
  )
}
