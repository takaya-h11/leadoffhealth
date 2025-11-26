import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value }) => {
            supabaseResponse.cookies.set(name, value)
          })
        },
      },
    }
  )

  // トークンをリフレッシュ（重要: getSession()ではなくgetUser()を使用）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // must_change_password チェック
  if (user) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('must_change_password')
      .eq('id', user.id)
      .single()

    const isUpdatePasswordPage = request.nextUrl.pathname === '/auth/update-password'
    const isLoginPage = request.nextUrl.pathname === '/login'

    // パスワード変更が必要 かつ パスワード変更画面以外にアクセスしようとした場合
    // ログインページは許可（ログアウト後の遷移のため）
    if (userProfile?.must_change_password && !isUpdatePasswordPage && !isLoginPage) {
      const url = new URL('/auth/update-password', request.url)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
