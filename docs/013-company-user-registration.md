# 013: 法人担当者登録機能

## 概要
管理者が法人担当者のアカウントを登録できる機能を実装する。法人担当者は特定の法人に紐づき、初期パスワードが発行される。

## 前提条件
- ✅ 認証機能が実装されている（001-010完了）
- ✅ 法人管理機能が実装されている（011完了）
- ✅ 整体師管理機能が実装されている（012完了）
- ✅ `users`, `companies`テーブルが作成されている
- ✅ RLSポリシーが設定されている

## タスク

### 1. 法人担当者一覧ページ作成
- [ ] `src/app/(protected)/admin/company-users`ディレクトリを作成
- [ ] `src/app/(protected)/admin/company-users/page.tsx`を作成
- [ ] 管理者権限チェックを実装
- [ ] 法人担当者一覧を表示（法人名も含む）

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CompanyUsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ユーザーのロールを確認
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // 法人担当者一覧を取得
  const { data: companyUsers } = await supabase
    .from('users')
    .select(`
      *,
      companies (
        id,
        name,
        is_active
      )
    `)
    .eq('role', 'company_user')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">法人担当者管理</h1>
          <Link
            href="/admin/company-users/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            新規担当者登録
          </Link>
        </div>

        {/* 法人担当者一覧テーブル */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  氏名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  所属法人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  連絡先
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ステータス
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {companyUsers?.map((companyUser) => (
                <tr key={companyUser.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{companyUser.full_name}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {companyUser.companies?.name || '-'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">{companyUser.email}</div>
                    <div className="text-sm text-gray-500">{companyUser.phone}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      companyUser.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {companyUser.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/admin/company-users/${companyUser.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      編集
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {companyUsers?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            登録されている法人担当者がいません
          </div>
        )}
      </div>
    </div>
  )
}
```

### 2. 法人担当者登録ページ作成
- [ ] `src/app/(protected)/admin/company-users/new/page.tsx`を作成
- [ ] 法人担当者登録フォームを実装
- [ ] 法人選択ドロップダウンを実装
- [ ] バリデーションを追加

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createCompanyUser } from '../actions'

export default async function NewCompanyUserPage() {
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

  // 有効な法人一覧を取得
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">新規法人担当者登録</h1>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <form action={createCompanyUser}>
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">基本情報</h2>

              <div className="mb-4">
                <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
                  所属法人 <span className="text-red-500">*</span>
                </label>
                <select
                  id="company_id"
                  name="company_id"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {companies?.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  氏名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  電話番号
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="rounded-md bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                初期パスワードは自動生成され、登録完了後に表示されます。
                <br />
                担当者には初回ログイン時にパスワード変更が求められます。
              </p>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <Link
                href="/admin/company-users"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                登録
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
```

### 3. 法人担当者編集ページ作成
- [ ] `src/app/(protected)/admin/company-users/[id]/page.tsx`を作成
- [ ] 既存データの読み込み
- [ ] 編集フォームを実装
- [ ] パスワードリセット機能を追加

### 4. Server Actions作成
- [ ] `src/app/(protected)/admin/company-users/actions.ts`を作成
- [ ] `createCompanyUser` - 法人担当者登録
- [ ] `updateCompanyUser` - 法人担当者更新
- [ ] `resetPassword` - パスワードリセット
- [ ] `deactivateCompanyUser` - 法人担当者無効化

**実装内容:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * 法人担当者を新規登録
 */
export async function createCompanyUser(formData: FormData) {
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

  const email = formData.get('email') as string
  const companyId = formData.get('company_id') as string
  const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) // 初期パスワード生成（16文字）

  // バリデーション
  if (!email || !formData.get('full_name') || !companyId) {
    redirect('/admin/company-users/new?message=Email, name, and company are required')
  }

  // 1. Supabase Authでユーザー作成
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    console.error('Auth user creation error:', authError)
    redirect('/admin/company-users/new?message=Failed to create auth user')
  }

  // 2. usersテーブルに登録
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string || null,
      role: 'company_user',
      company_id: companyId,
      is_active: true,
      must_change_password: true,
    })

  if (userError) {
    console.error('User creation error:', userError)
    // Auth userも削除
    await supabase.auth.admin.deleteUser(authData.user.id)
    redirect('/admin/company-users/new?message=Failed to create user')
  }

  // TODO: 初期パスワードをメール送信

  revalidatePath('/admin/company-users')
  redirect(`/admin/company-users?message=User created. Initial password: ${password}`)
}

/**
 * 法人担当者情報を更新
 */
export async function updateCompanyUser(id: string, formData: FormData) {
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

  const { error } = await supabase
    .from('users')
    .update({
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string || null,
      company_id: formData.get('company_id') as string,
      is_active: formData.get('is_active') === 'true',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('User update error:', error)
    redirect(`/admin/company-users/${id}?message=Failed to update user`)
  }

  revalidatePath('/admin/company-users')
  revalidatePath(`/admin/company-users/${id}`)
  redirect(`/admin/company-users/${id}?message=User updated successfully`)
}

/**
 * パスワードをリセット
 */
export async function resetPassword(userId: string) {
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

  const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

  // Supabase Authでパスワード更新
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) {
    console.error('Password reset error:', error)
    redirect(`/admin/company-users/${userId}?message=Failed to reset password`)
  }

  // must_change_passwordをtrueに設定
  await supabase
    .from('users')
    .update({ must_change_password: true })
    .eq('id', userId)

  // TODO: 新しいパスワードをメール送信

  revalidatePath(`/admin/company-users/${userId}`)
  redirect(`/admin/company-users/${userId}?message=Password reset. New password: ${newPassword}`)
}

/**
 * 法人担当者を無効化
 */
export async function deactivateCompanyUser(id: string) {
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

  const { error } = await supabase
    .from('users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('User deactivation error:', error)
    redirect(`/admin/company-users/${id}?message=Failed to deactivate user`)
  }

  revalidatePath('/admin/company-users')
  redirect('/admin/company-users?message=User deactivated successfully')
}
```

## 完了条件
- [ ] 法人担当者一覧ページが表示される
- [ ] 法人担当者の新規登録ができる
- [ ] 初期パスワードが自動生成され表示される
- [ ] 法人担当者情報の編集ができる
- [ ] パスワードリセットができる
- [ ] 法人担当者の無効化ができる
- [ ] 管理者以外はアクセスできない
- [ ] 成功/エラーメッセージが表示される

## 注意事項
- 初期パスワードは16文字のランダム文字列を生成
- 初回ログイン時にパスワード変更を強制（must_change_password: true）
- パスワードは画面に一度だけ表示（将来的にはメール送信）
- 法人担当者は必ず1つの法人に紐づく
- 無効化しても完全削除はしない（is_active: false）

## 依存チケット
- 001-010: 基本認証機能
- 011: 法人管理機能
- 012: 整体師管理機能

## 次のステップ
- 014: ユーザー一覧・検索機能
