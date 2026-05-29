import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import { SimulatorProvider } from '@/contexts/SimulatorContext'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FIREシミュレーター | あなたのFIRE達成日を計算',
  description: 'FIREコースを選択して現在の資産・貯蓄額を入力するだけ。FIRE達成までの期間と必要資産額をモンテカルロ法で計算します。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={notoSansJP.variable} style={{ colorScheme: 'light' }}>
      <body className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <SimulatorProvider>
          {children}
        </SimulatorProvider>
      </body>
    </html>
  )
}
