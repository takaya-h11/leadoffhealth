import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.redirect(new URL('/dashboard?message=ログアウトに失敗しました', request.url))
  }

  revalidatePath('/', 'layout')
  return NextResponse.redirect(new URL('/login', request.url))
}
