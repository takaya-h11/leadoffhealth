'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

/**
 * 症状を新規登録
 */
export async function createSymptom(formData: FormData) {
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
  const name = (formData.get('name') as string || '').trim()
  let displayOrder = parseInt(formData.get('display_order') as string) || 0

  // バリデーション
  if (!name || name.length === 0) {
    redirect('/admin/symptoms/new?message=' + encodeURIComponent('症状名は必須です'))
  }

  // 重複チェック
  const { data: existing } = await supabase
    .from('symptoms')
    .select('id')
    .eq('name', name)
    .maybeSingle()

  if (existing) {
    redirect('/admin/symptoms/new?message=' + encodeURIComponent('同じ名前の症状が既に存在します'))
  }

  // display_orderが0の場合、最大値+1を設定
  if (displayOrder === 0) {
    const { data: maxOrder } = await supabase
      .from('symptoms')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    displayOrder = (maxOrder?.display_order || 0) + 1
  }

  const { error } = await supabase
    .from('symptoms')
    .insert({
      name,
      display_order: displayOrder,
      is_active: true,
    })

  if (error) {
    console.error('Symptom creation error:', error)
    redirect(`/admin/symptoms/new?message=${encodeURIComponent('症状登録エラー: ' + error.message)}`)
  }

  // 成功
  redirect('/admin/symptoms?message=' + encodeURIComponent('症状を登録しました'))
}

/**
 * 症状情報を更新
 */
export async function updateSymptom(formData: FormData) {
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
  const symptomId = formData.get('symptom_id') as string
  const name = (formData.get('name') as string || '').trim()
  const displayOrder = parseInt(formData.get('display_order') as string)
  const is_active = formData.get('is_active') === 'true'

  // バリデーション
  if (!symptomId) {
    redirect('/admin/symptoms?message=' + encodeURIComponent('症状IDが必要です'))
  }

  if (!name || name.length === 0) {
    redirect(`/admin/symptoms/${symptomId}?message=` + encodeURIComponent(`症状名は必須です`))
  }

  if (isNaN(displayOrder) || displayOrder < 0) {
    redirect(`/admin/symptoms/${symptomId}?message=` + encodeURIComponent(`表示順は0以上の整数で入力してください`))
  }

  // 重複チェック（自分以外で同じ名前がないか）
  const { data: existing } = await supabase
    .from('symptoms')
    .select('id')
    .eq('name', name)
    .neq('id', symptomId)
    .maybeSingle()

  if (existing) {
    redirect(`/admin/symptoms/${symptomId}?message=` + encodeURIComponent(`同じ名前の症状が既に存在します`))
  }

  const { error } = await supabase
    .from('symptoms')
    .update({
      name,
      display_order: displayOrder,
      is_active,
    })
    .eq('id', symptomId)

  if (error) {
    console.error('Symptom update error:', error)
    redirect(`/admin/symptoms/${symptomId}?message=${encodeURIComponent('症状更新エラー: ' + error.message)}`)
  }

  // 成功
  redirect('/admin/symptoms?message=' + encodeURIComponent('症状情報を更新しました'))
}

/**
 * 症状を無効化（論理削除）
 */
export async function deactivateSymptom(symptomId: string) {
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

  const { error } = await supabase
    .from('symptoms')
    .update({ is_active: false })
    .eq('id', symptomId)

  if (error) {
    console.error('Symptom deactivation error:', error)
    redirect(`/admin/symptoms?message=${encodeURIComponent('症状無効化エラー: ' + error.message)}`)
  }

  // 成功
  redirect('/admin/symptoms?message=' + encodeURIComponent('症状を無効化しました'))
}
