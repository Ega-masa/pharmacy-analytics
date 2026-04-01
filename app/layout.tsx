import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '薬局経営分析ダッシュボード',
  description: '薬局経営KPI分析・偏差値評価システム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
