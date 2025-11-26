import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { HomeClient } from './HomeClient'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ログイン済みの場合はダッシュボードへ
  if (user) {
    redirect('/dashboard')
  }

  return <HomeClient />
}
