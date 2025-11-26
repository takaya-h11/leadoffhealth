'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

/**
 * 新規整体師を登録
 * 1. Supabase Authにユーザーを作成
 * 2. usersテーブルに登録
 * 3. therapistsテーブルに追加情報を登録
 */
export async function createTherapist(formData: FormData) {
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
  const email = formData.get('email') as string
  // ランダムな初期パスワードを生成（10文字、英数字）
  const password = Array.from({ length: 10 }, () =>
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 55)]
  ).join('')
  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string || null
  const license_number = formData.get('license_number') as string || null
  const specialties_raw = formData.get('specialties') as string || ''
  const bio = formData.get('bio') as string || null

  // 専門分野をカンマ区切りで配列化
  const specialties = specialties_raw
    ? specialties_raw.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : null

  // バリデーション
  if (!email || !full_name) {
    redirect('/admin/therapists/new?message=' + encodeURIComponent('メールアドレスと氏名は必須です'))
  }

  try {
    // 管理者用クライアントを作成（Service Role Key使用）
    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (error) {
      console.error('Admin client creation error:', error)
      redirect('/admin/therapists/new?message=' + encodeURIComponent('エラー: SUPABASE_SERVICE_ROLE_KEY が設定されていません。.env.local ファイルに追加してください。'))
    }

    // 1. 既存ユーザーをチェック
    let userId: string | null = null

    // メールアドレスで既存ユーザーを検索
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', email)
      .single()

    if (existingUser) {
      // 既存ユーザーが見つかった場合
      if (existingUser.role === 'therapist') {
        redirect(`/admin/therapists/new?message=${encodeURIComponent('このメールアドレスは既に整体師として登録されています')}`)
      }

      if (existingUser.role === 'admin') {
        redirect(`/admin/therapists/new?message=${encodeURIComponent('このメールアドレスは管理者として登録されています。管理者を整体師に変更することはできません')}`)
      }

      // 既存ユーザー（法人担当者など）を整体師として登録
      userId = existingUser.id

      // roleをtherapistに変更
      const { error: roleUpdateError } = await supabase
        .from('users')
        .update({
          role: 'therapist',
          full_name, // 氏名も更新
          phone: phone || undefined,
        })
        .eq('id', userId)

      if (roleUpdateError) {
        console.error('Role update error:', roleUpdateError)
        redirect(`/admin/therapists/new?message=${encodeURIComponent('既存ユーザーの権限更新エラー: ' + roleUpdateError.message)}`)
      }
    } else {
      // 新規ユーザーの場合、Supabase Authにユーザーを作成
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // メール認証をスキップ
        user_metadata: {
          full_name,
        },
      })

      if (authError || !authData.user) {
        console.error('Auth user creation error:', authError)
        redirect(`/admin/therapists/new?message=${encodeURIComponent('ユーザー作成エラー: ' + authError?.message)}`)
      }

      userId = authData.user.id

      // デモユーザーかどうかを判定（@demo.comドメイン）
      const isDemo = email.endsWith('@demo.com')

      // 2. usersテーブルを更新
      // 注: トリガーで既にpublic.usersにレコードが作成されているため、UPDATEを使用
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name,
          role: 'therapist',
          phone,
          is_active: true,
          must_change_password: !isDemo, // デモユーザーはパスワード変更不要
        })
        .eq('id', userId)

      if (userError) {
        console.error('User table update error:', userError)

        // Auth userを削除（非同期処理を待つ）
        try {
          const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
          if (deleteError) {
            console.error('Failed to delete auth user after update failure:', deleteError)
          }
        } catch (deleteErr) {
          console.error('Exception while deleting auth user:', deleteErr)
        }
        redirect(`/admin/therapists/new?message=${encodeURIComponent('ユーザーテーブル更新エラー: ' + userError.message)}`)
      }
    }

    // 3. therapistsテーブルに追加情報を登録
    const { error: therapistError } = await supabase
      .from('therapists')
      .insert({
        user_id: userId,
        license_number,
        specialties,
        bio,
        is_available: true,
      })

    if (therapistError) {
      console.error('Therapist table insert error:', therapistError)
      redirect(`/admin/therapists/new?message=${encodeURIComponent('整体師情報登録エラー: ' + therapistError.message)}`)
    }

    // 成功メッセージ
    const successMessage = existingUser
      ? '既存ユーザーを整体師として登録しました'
      : `success: 整体師を登録しました（初期パスワード: ${password}）`

    redirect(`/admin/therapists?message=${encodeURIComponent(successMessage)}`)
  } catch (error) {
    // redirect()は内部的にNEXT_REDIRECT例外をスローするので、それを再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    // 本当のエラーの場合のみログ出力
    console.error('Unexpected error:', error)
    redirect('/admin/therapists/new?message=' + encodeURIComponent('予期しないエラーが発生しました'))
  }
}

/**
 * 整体師情報を更新
 * usersテーブルとtherapistsテーブルを更新
 */
export async function updateTherapist(formData: FormData) {
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
  const therapistId = formData.get('therapist_id') as string
  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string || null
  const license_number = formData.get('license_number') as string || null
  const specialties_raw = formData.get('specialties') as string || ''
  const bio = formData.get('bio') as string || null
  const is_active = formData.get('is_active') === 'true'
  const is_available = formData.get('is_available') === 'true'

  // 専門分野をカンマ区切りで配列化
  const specialties = specialties_raw
    ? specialties_raw.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : null

  if (!therapistId) {
    redirect('/admin/therapists?message=' + encodeURIComponent('整体師IDが必要です'))
  }

  if (!full_name) {
    redirect(`/admin/therapists/${therapistId}?message=` + encodeURIComponent(`氏名は必須です`))
  }

  try {
    // therapistsテーブルから該当のuser_idを取得
    const { data: therapist } = await supabase
      .from('therapists')
      .select('user_id')
      .eq('id', therapistId)
      .single()

    if (!therapist) {
      redirect('/admin/therapists?message=' + encodeURIComponent('整体師が見つかりません'))
    }

    // usersテーブルを更新
    const { error: userError } = await supabase
      .from('users')
      .update({
        full_name,
        phone,
        is_active,
      })
      .eq('id', therapist.user_id)

    if (userError) {
      console.error('User update error:', userError)
      redirect(`/admin/therapists/${therapistId}?message=${encodeURIComponent('ユーザー情報更新エラー: ' + userError.message)}`)
    }

    // therapistsテーブルを更新
    const { error: therapistError } = await supabase
      .from('therapists')
      .update({
        license_number,
        specialties,
        bio,
        is_available,
      })
      .eq('id', therapistId)

    if (therapistError) {
      console.error('Therapist update error:', therapistError)
      redirect(`/admin/therapists/${therapistId}?message=${encodeURIComponent('整体師情報更新エラー: ' + therapistError.message)}`)
    }

    // 成功
    redirect('/admin/therapists?message=' + encodeURIComponent('success: 整体師情報を更新しました'))
  } catch (error) {
    // redirect()は内部的にNEXT_REDIRECT例外をスローするので、それを再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    // 本当のエラーの場合のみログ出力
    console.error('Unexpected error:', error)
    redirect(`/admin/therapists/${therapistId}?message=` + encodeURIComponent(`予期しないエラーが発生しました`))
  }
}

/**
 * 既存ユーザー（管理者）を整体師として登録
 * therapistsテーブルに追加情報を登録
 */
export async function addTherapistToExistingUser(formData: FormData) {
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
  const userId = formData.get('user_id') as string
  const license_number = formData.get('license_number') as string || null
  const specialties_raw = formData.get('specialties') as string || ''
  const bio = formData.get('bio') as string || null

  // 専門分野をカンマ区切りで配列化
  const specialties = specialties_raw
    ? specialties_raw.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : null

  // バリデーション
  if (!userId) {
    redirect('/admin/therapists/new?message=' + encodeURIComponent('ユーザーIDが必要です'))
  }

  try {
    // ユーザーが存在するか確認
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single()

    if (!existingUser) {
      redirect('/admin/therapists/new?message=' + encodeURIComponent('ユーザーが見つかりません'))
    }

    // 既に整体師として登録されていないか確認
    const { data: existingTherapist } = await supabase
      .from('therapists')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingTherapist) {
      redirect('/admin/therapists/new?message=' + encodeURIComponent('このユーザーは既に整体師として登録されています'))
    }

    // therapistsテーブルに追加情報を登録
    const { error: therapistError } = await supabase
      .from('therapists')
      .insert({
        user_id: userId,
        license_number,
        specialties,
        bio,
        is_available: true,
      })

    if (therapistError) {
      console.error('Therapist table insert error:', therapistError)
      redirect(`/admin/therapists/new?message=${encodeURIComponent('整体師情報登録エラー: ' + therapistError.message)}`)
    }

    // 成功
    redirect('/admin/therapists?message=' + encodeURIComponent('success: 既存ユーザーを整体師として登録しました'))
  } catch (error) {
    // redirect()は内部的に例外をスローするので、それを再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    // 本当のエラーの場合のみログ出力
    console.error('Unexpected error:', error)
    redirect('/admin/therapists/new?message=' + encodeURIComponent('予期しないエラーが発生しました'))
  }
}

/**
 * 整体師を無効化（論理削除）
 * is_active = false, is_available = false に設定
 */
export async function deactivateTherapist(therapistId: string) {
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

  try {
    // therapistsテーブルから該当のuser_idを取得
    const { data: therapist } = await supabase
      .from('therapists')
      .select('user_id')
      .eq('id', therapistId)
      .single()

    if (!therapist) {
      redirect('/admin/therapists?message=' + encodeURIComponent('整体師が見つかりません'))
    }

    // usersテーブルを無効化
    const { error: userError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', therapist.user_id)

    if (userError) {
      console.error('User deactivate error:', userError)
      redirect(`/admin/therapists?message=${encodeURIComponent('ユーザー無効化エラー: ' + userError.message)}`)
    }

    // therapistsテーブルを無効化
    const { error: therapistError } = await supabase
      .from('therapists')
      .update({ is_available: false })
      .eq('id', therapistId)

    if (therapistError) {
      console.error('Therapist deactivate error:', therapistError)
      redirect(`/admin/therapists?message=${encodeURIComponent('整体師無効化エラー: ' + therapistError.message)}`)
    }

    // 成功
    redirect('/admin/therapists?message=' + encodeURIComponent('success: 整体師を無効化しました'))
  } catch (error) {
    // redirect()は内部的にNEXT_REDIRECT例外をスローするので、それを再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    // 本当のエラーの場合のみログ出力
    console.error('Unexpected error:', error)
    redirect('/admin/therapists?message=' + encodeURIComponent('予期しないエラーが発生しました'))
  }
}
