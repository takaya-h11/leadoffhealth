'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

/**
 * 管理者コメントを更新
 */
export async function updateAdminComments(formData: FormData) {
  const supabase = await createClient()

  // 認証確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 管理者権限確認
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    redirect('/dashboard?message=' + encodeURIComponent('権限がありません'))
  }

  // フォームデータ取得
  const treatmentId = formData.get('treatment_id') as string
  const adminComments = (formData.get('admin_comments') as string || '').trim()

  if (!treatmentId) {
    redirect('/admin/treatments?message=' + encodeURIComponent('施術記録IDが必要です'))
  }

  // 管理者コメントを更新
  const { error } = await supabase
    .from('treatment_records')
    .update({ admin_comments: adminComments })
    .eq('id', treatmentId)

  if (error) {
    console.error('Admin comment update error:', error)
    redirect(`/admin/treatments/${treatmentId}?message=${encodeURIComponent('コメント更新エラー: ' + error.message)}`)
  }

  // 成功
  redirect(`/admin/treatments/${treatmentId}?message=` + encodeURIComponent('success: 管理者コメントを更新しました'))
}
