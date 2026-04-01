'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  user: { email?: string | null }
  profile: { name?: string | null; role?: string | null; stores?: { name?: string } | null } | null
}

const navItems = [
  { href: '/dashboard',       label: 'ダッシュボード', icon: '📊', roles: ['admin','store_manager','individual','data_entry'] },
  { href: '/compare/table',   label: '全店比較',       icon: '📋', roles: ['admin','store_manager'] },
  { href: '/compare/bubble',  label: 'バブルチャート', icon: '🔵', roles: ['admin','store_manager'] },
  { href: '/input',           label: 'データ入力',     icon: '📥', roles: ['admin','data_entry'] },
  { href: '/admin',           label: '管理',           icon: '⚙️', roles: ['admin'] },
]

const roleLabels: Record<string, string> = {
  admin:         '管理者',
  store_manager: '店舗',
  individual:    '個人',
  data_entry:    '入力担当',
}

export default function Navbar({ user, profile }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const role     = profile?.role ?? ''

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleItems = navItems.filter(item => item.roles.includes(role))

  return (
    <nav className="bg-brand shadow-sm sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 flex items-center h-14 gap-1">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-4 text-white font-bold text-base shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          薬局分析
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 flex-1">
          {visibleItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(item.href) && item.href !== '/dashboard'
                  ? 'bg-white/20 text-white'
                  : pathname === item.href
                  ? 'bg-white/20 text-white'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-white text-xs font-medium leading-none">
              {profile?.name ?? user.email}
            </p>
            <p className="text-blue-200 text-xs mt-0.5">
              {roleLabels[role] ?? role}
              {profile?.stores?.name ? ` · ${profile.stores.name}` : ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-blue-100 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </nav>
  )
}
