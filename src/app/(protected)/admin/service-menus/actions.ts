'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

/**
 * 施術メニューを新規登録
 */
export async function createServiceMenu(formData: FormData) {
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
    redirect('/dashboard?message=No+permission')
  }

  // フォームデータ取得
  const name = formData.get('name') as string
  const durationMinutesStr = formData.get('duration_minutes') as string
  const priceStr = formData.get('price') as string
  const description = formData.get('description') as string || null

  // バリデーション
  if (!name || !durationMinutesStr || !priceStr) {
    redirect('/admin/service-menus/new?message=Required+fields+missing')
  }

  const durationMinutes = parseInt(durationMinutesStr)
  const price = parseInt(priceStr)

  if (isNaN(durationMinutes) || durationMinutes <= 0) {
    redirect('/admin/service-menus/new?message=Invalid+duration')
  }

  if (isNaN(price) || price < 0) {
    redirect('/admin/service-menus/new?message=Invalid+price')
  }

  try {
    const { error } = await supabase
      .from('service_menus')
      .insert({
        name,
        duration_minutes: durationMinutes,
        price,
        description,
        is_active: true,
      })

    if (error) {
      console.error('Service menu creation error:', error)
      redirect(`/admin/service-menus/new?message=Service+menu+creation+failed:+${error.code}`)
    }

    // 成功
    redirect('/admin/service-menus?message=success:+Service+menu+created')
  } catch (error) {
    // redirect()は内部的に例外をスローするので、それを再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    // 本当のエラーの場合のみログ出力
    console.error('Unexpected error:', error)
    redirect('/admin/service-menus/new?message=Unexpected+error+occurred')
  }
}

/**
 * 施術メニュー情報を更新
 */
export async function updateServiceMenu(formData: FormData) {
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
    redirect('/dashboard?message=No+permission')
  }

  // フォームデータ取得
  const menuId = formData.get('menu_id') as string
  const name = formData.get('name') as string
  const durationMinutesStr = formData.get('duration_minutes') as string
  const priceStr = formData.get('price') as string
  const description = formData.get('description') as string || null
  const is_active = formData.get('is_active') === 'true'

  // バリデーション
  if (!menuId) {
    redirect('/admin/service-menus?message=Menu+ID+required')
  }

  if (!name || !durationMinutesStr || !priceStr) {
    redirect(`/admin/service-menus/${menuId}?message=Required+fields+missing`)
  }

  const durationMinutes = parseInt(durationMinutesStr)
  const price = parseInt(priceStr)

  if (isNaN(durationMinutes) || durationMinutes <= 0) {
    redirect(`/admin/service-menus/${menuId}?message=Invalid+duration`)
  }

  if (isNaN(price) || price < 0) {
    redirect(`/admin/service-menus/${menuId}?message=Invalid+price`)
  }

  try {
    const { error } = await supabase
      .from('service_menus')
      .update({
        name,
        duration_minutes: durationMinutes,
        price,
        description,
        is_active,
      })
      .eq('id', menuId)

    if (error) {
      console.error('Service menu update error:', error)
      redirect(`/admin/service-menus/${menuId}?message=Service+menu+update+failed:+${error.code}`)
    }

    // 成功
    redirect('/admin/service-menus?message=success:+Service+menu+updated')
  } catch (error) {
    // redirect()は内部的に例外をスローするので、それを再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    // 本当のエラーの場合のみログ出力
    console.error('Unexpected error:', error)
    redirect(`/admin/service-menus/${menuId}?message=Unexpected+error+occurred`)
  }
}

/**
 * 施術メニューを無効化（論理削除）
 */
export async function deactivateServiceMenu(menuId: string) {
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
    redirect('/dashboard?message=No+permission')
  }

  try {
    const { error } = await supabase
      .from('service_menus')
      .update({ is_active: false })
      .eq('id', menuId)

    if (error) {
      console.error('Service menu deactivation error:', error)
      redirect(`/admin/service-menus?message=Service+menu+deactivation+failed:+${error.code}`)
    }

    // 成功
    redirect('/admin/service-menus?message=success:+Service+menu+deactivated')
  } catch (error) {
    // redirect()は内部的に例外をスローするので、それを再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    // 本当のエラーの場合のみログ出力
    console.error('Unexpected error:', error)
    redirect('/admin/service-menus?message=Unexpected+error+occurred')
  }
}
