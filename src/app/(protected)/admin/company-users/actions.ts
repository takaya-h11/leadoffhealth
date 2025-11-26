'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { generateSecurePassword } from '@/utils/password'

type ActionResult = {
  success: boolean
  error?: string
  redirectUrl?: string
}

/**
 * 法人担当者を新規登録
 * 1. Supabase Authにユーザーを作成
 * 2. usersテーブルに登録
 */
export async function createCompanyUser(formData: FormData): Promise<ActionResult> {
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
  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string || null
  const company_id = formData.get('company_id') as string

  // 初期パスワード生成（セキュアな12文字）
  const password = generateSecurePassword(12)

  // バリデーション
  if (!email || !full_name || !company_id) {
    return {
      success: false,
      error: 'メールアドレス、氏名、所属法人は必須です'
    }
  }

  try {
    // 管理者用クライアントを作成（Service Role Key使用）
    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (error) {
      console.error('Admin client creation error:', error)
      return {
        success: false,
        error: 'エラー: SUPABASE_SERVICE_ROLE_KEY が設定されていません。.env.local ファイルに追加してください。'
      }
    }

    // デモユーザーかどうかを判定（@demo.comドメイン）
    const isDemo = email.endsWith('@demo.com')

    // 1. Supabase Authにユーザーを作成
    // 注: データベーストリガーにより、auth.usersにユーザーが作成されると
    // 自動的にpublic.usersテーブルにも基本情報が作成されます
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール認証をスキップ
      user_metadata: {
        full_name,
        role: 'company_user',
        must_change_password: !isDemo, // デモユーザーはパスワード変更不要
      },
    })

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError)

      // エラーメッセージを日本語化
      let errorMessage = 'ユーザー作成エラー: '
      if (authError?.message?.includes('already been registered')) {
        errorMessage = 'このメールアドレスは既に登録されています'
      } else if (authError?.message) {
        errorMessage += authError.message
      } else {
        errorMessage += '不明なエラーが発生しました'
      }

      return {
        success: false,
        error: errorMessage
      }
    }

    // 2. トリガーで作成されたusersテーブルのレコードを更新
    // トリガーでは company_id と phone が設定されないため、ここで更新
    const { error: userError } = await supabase
      .from('users')
      .update({
        company_id,
        phone,
        is_active: true,
        must_change_password: !isDemo, // デモユーザーはパスワード変更不要
      })
      .eq('id', authData.user.id)

    if (userError) {
      console.error('User table update error:', userError)
      // usersテーブルの更新に失敗したので、Auth userを削除
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        error: 'ユーザーテーブル更新エラー: ' + userError.message
      }
    }

    // 法人名を取得
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', company_id)
      .single()

    const companyName = company?.name || '御社'

    // 成功画面にリダイレクト（パスワードを表示）
    const successParams = new URLSearchParams({
      email,
      password,
      fullName: full_name,
      companyName,
    })

    return {
      success: true,
      redirectUrl: `/admin/company-users/success?${successParams.toString()}`
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: '予期しないエラーが発生しました'
    }
  }
}

/**
 * 法人担当者情報を更新
 */
export async function updateCompanyUser(formData: FormData) {
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
  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string || null
  const company_id = formData.get('company_id') as string
  const is_active = formData.get('is_active') === 'true'

  if (!userId || !full_name || !company_id) {
    redirect(`/admin/company-users/${userId || 'unknown'}?message=` + encodeURIComponent('氏名と所属法人は必須です'))
  }

  try {
    // usersテーブルを更新
    const { error: userError } = await supabase
      .from('users')
      .update({
        full_name,
        phone,
        company_id,
        is_active,
      })
      .eq('id', userId)

    if (userError) {
      console.error('User update error:', userError)
      redirect(`/admin/company-users/${userId}?message=${encodeURIComponent('ユーザー情報更新エラー: ' + userError.message)}`)
    }

    // 成功
    redirect('/admin/company-users?message=' + encodeURIComponent('success: 法人担当者情報を更新しました'))
  } catch (error) {
    // redirect()は内部的にNEXT_REDIRECT例外をスローするので、それを再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    // 本当のエラーの場合のみログ出力
    console.error('Unexpected error:', error)
    redirect(`/admin/company-users/${userId}?message=` + encodeURIComponent('予期しないエラーが発生しました'))
  }
}

/**
 * 法人担当者を無効化（論理削除）
 */
export async function deactivateCompanyUser(userId: string) {
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
    // usersテーブルを無効化
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)

    if (error) {
      console.error('User deactivation error:', error)
      redirect(`/admin/company-users?message=${encodeURIComponent('ユーザー無効化エラー: ' + error.message)}`)
    }

    // 成功
    redirect('/admin/company-users?message=' + encodeURIComponent('success: 法人担当者を無効化しました'))
  } catch (error) {
    // redirect()は内部的にNEXT_REDIRECT例外をスローするので、それを再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    // 本当のエラーの場合のみログ出力
    console.error('Unexpected error:', error)
    redirect('/admin/company-users?message=' + encodeURIComponent('予期しないエラーが発生しました'))
  }
}
