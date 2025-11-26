import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminBookPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 管理者権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // 管理者用の予約申込ページ（法人選択機能付き）
  redirect('/admin/book/select-company')
}
