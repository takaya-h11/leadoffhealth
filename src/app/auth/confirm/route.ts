import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // リダイレクト先のURLを返す
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // エラー時はログインページへ
  return NextResponse.redirect(
    new URL('/login?message=' + encodeURIComponent('認証に失敗しました'), request.url)
  )
}
