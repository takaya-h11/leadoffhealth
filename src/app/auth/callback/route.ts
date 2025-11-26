import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * パスワードリセットメールからのリダイレクトを処理
 * codeをセッションに交換し、適切にCookieを設定してからページにリダイレクト
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // エラーがある場合
  if (error) {
    return NextResponse.redirect(
      new URL('/login?message=' + encodeURIComponent(errorDescription || 'パスワードリセットに失敗しました'), request.url)
    )
  }

  // codeがある場合、セッションに交換
  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL('/login?message=' + encodeURIComponent('パスワードリセットリンクが無効または期限切れです。もう一度お試しください。'), request.url)
      )
    }

    // セッション確立後、codeパラメータを削除してページにリダイレクト
    // NextResponse.redirectを使用することで、Cookieが正しく設定される
    return NextResponse.redirect(new URL('/auth/update-password', request.url))
  }

  // codeもerrorもない場合は、ログインページにリダイレクト
  return NextResponse.redirect(new URL('/login', request.url))
}
