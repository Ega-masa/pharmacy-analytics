import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthPage = pathname === '/login'

  // Supabase のセッション Cookie の存在を確認
  // （"-auth-token" を含む Cookie が存在すれば認証済みとみなす）
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(
    c => c.name.includes('-auth-token') && c.value.length > 0
  )

  // 未認証 → 保護ページにアクセスしようとしている
  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 認証済み → ログインページを開こうとしている
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
