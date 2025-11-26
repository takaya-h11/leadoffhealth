# 012: 整体師管理機能（CRUD）

## 概要
管理者が整体師アカウントを登録・編集・無効化できる機能を実装する。整体師はユーザーテーブルと整体師テーブルの両方にデータを持つ。

## 前提条件
- ✅ 認証機能が実装されている（001-010完了）
- ✅ 法人管理機能が実装されている（011完了）
- ✅ `users`, `therapists`テーブルが作成されている
- ✅ RLSポリシーが設定されている

## タスク

### 1. 整体師一覧ページ作成
- [ ] `src/app/(protected)/admin/therapists`ディレクトリを作成
- [ ] `src/app/(protected)/admin/therapists/page.tsx`を作成
- [ ] 管理者権限チェックを実装
- [ ] 整体師一覧を表示（usersテーブルとtherapistsテーブルをJOIN）

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TherapistsPage() {
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

  // 整体師一覧を取得（usersとtherapistsをJOIN）
  const { data: therapists } = await supabase
    .from('users')
    .select(`
      *,
      therapists (
        id,
        license_number,
        specialties,
        bio,
        is_available
      )
    `)
    .eq('role', 'therapist')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">整体師管理</h1>
          <Link
            href="/admin/therapists/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            新規整体師登録
          </Link>
        </div>

        {/* 整体師一覧テーブル */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  氏名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  連絡先
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  免許番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  専門分野
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
              {therapists?.map((therapist) => (
                <tr key={therapist.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{therapist.full_name}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">{therapist.email}</div>
                    <div className="text-sm text-gray-500">{therapist.phone}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {therapist.therapists?.[0]?.license_number || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {therapist.therapists?.[0]?.specialties?.join(', ') || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      therapist.is_active && therapist.therapists?.[0]?.is_available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {therapist.is_active && therapist.therapists?.[0]?.is_available ? '稼働中' : '無効'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/admin/therapists/${therapist.id}`}
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

        {therapists?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            登録されている整体師がいません
          </div>
        )}
      </div>
    </div>
  )
}
```

### 2. 整体師登録ページ作成
- [ ] `src/app/(protected)/admin/therapists/new/page.tsx`を作成
- [ ] 整体師登録フォームを実装
- [ ] バリデーションを追加

**フォーム項目:**
- 氏名（必須）
- メールアドレス（必須）
- 電話番号
- 免許番号
- 専門分野（複数選択可）
- 自己紹介

**実装内容:**
```typescript
import { createTherapist } from '../actions'

export default function NewTherapistPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">新規整体師登録</h1>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <form action={createTherapist}>
            {/* 基本情報 */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">基本情報</h2>

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

            {/* 整体師情報 */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">整体師情報</h2>

              <div className="mb-4">
                <label htmlFor="license_number" className="block text-sm font-medium text-gray-700">
                  免許番号
                </label>
                <input
                  type="text"
                  id="license_number"
                  name="license_number"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="specialties" className="block text-sm font-medium text-gray-700">
                  専門分野（カンマ区切り）
                </label>
                <input
                  type="text"
                  id="specialties"
                  name="specialties"
                  placeholder="例: 肩こり, 腰痛, スポーツ外傷"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  自己紹介
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href="/admin/therapists"
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

### 3. 整体師編集ページ作成
- [ ] `src/app/(protected)/admin/therapists/[id]/page.tsx`を作成
- [ ] 既存データの読み込み
- [ ] 編集フォームを実装
- [ ] 無効化機能を追加

### 4. Server Actions作成
- [ ] `src/app/(protected)/admin/therapists/actions.ts`を作成
- [ ] `createTherapist` - 整体師登録（usersとtherapists両方）
- [ ] `updateTherapist` - 整体師更新
- [ ] `deactivateTherapist` - 整体師無効化

**実装内容:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createTherapist(formData: FormData) {
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
  const password = Math.random().toString(36).slice(-8) // 初期パスワード生成

  // バリデーション
  if (!email || !formData.get('full_name')) {
    redirect('/admin/therapists/new?message=Email and name are required')
  }

  // 1. Supabase Authでユーザー作成
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    console.error('Auth user creation error:', authError)
    redirect('/admin/therapists/new?message=Failed to create auth user')
  }

  // 2. usersテーブルに登録
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string || null,
      role: 'therapist',
      is_active: true,
      must_change_password: true,
    })

  if (userError) {
    console.error('User creation error:', userError)
    // Auth userも削除
    await supabase.auth.admin.deleteUser(authData.user.id)
    redirect('/admin/therapists/new?message=Failed to create user')
  }

  // 3. therapistsテーブルに登録
  const specialtiesStr = formData.get('specialties') as string
  const specialties = specialtiesStr
    ? specialtiesStr.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const { error: therapistError } = await supabase
    .from('therapists')
    .insert({
      user_id: authData.user.id,
      license_number: formData.get('license_number') as string || null,
      specialties,
      bio: formData.get('bio') as string || null,
      is_available: true,
    })

  if (therapistError) {
    console.error('Therapist creation error:', therapistError)
    // Auth userとusersレコードも削除
    await supabase.auth.admin.deleteUser(authData.user.id)
    await supabase.from('users').delete().eq('id', authData.user.id)
    redirect('/admin/therapists/new?message=Failed to create therapist')
  }

  // TODO: 初期パスワードをメール送信

  revalidatePath('/admin/therapists')
  redirect(`/admin/therapists?message=Therapist created. Initial password: ${password}`)
}

export async function updateTherapist(id: string, formData: FormData) {
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

  // usersテーブル更新
  const { error: userError } = await supabase
    .from('users')
    .update({
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string || null,
      is_active: formData.get('is_active') === 'true',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (userError) {
    console.error('User update error:', userError)
    redirect(`/admin/therapists/${id}?message=Failed to update user`)
  }

  // therapistsテーブル更新
  const specialtiesStr = formData.get('specialties') as string
  const specialties = specialtiesStr
    ? specialtiesStr.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const { error: therapistError } = await supabase
    .from('therapists')
    .update({
      license_number: formData.get('license_number') as string || null,
      specialties,
      bio: formData.get('bio') as string || null,
      is_available: formData.get('is_available') === 'true',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', id)

  if (therapistError) {
    console.error('Therapist update error:', therapistError)
    redirect(`/admin/therapists/${id}?message=Failed to update therapist`)
  }

  revalidatePath('/admin/therapists')
  revalidatePath(`/admin/therapists/${id}`)
  redirect(`/admin/therapists/${id}?message=Therapist updated successfully`)
}

export async function deactivateTherapist(id: string) {
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

  // usersとtherapistsを無効化
  const { error: userError } = await supabase
    .from('users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (userError) {
    console.error('User deactivation error:', userError)
    redirect(`/admin/therapists/${id}?message=Failed to deactivate therapist`)
  }

  const { error: therapistError } = await supabase
    .from('therapists')
    .update({ is_available: false, updated_at: new Date().toISOString() })
    .eq('user_id', id)

  if (therapistError) {
    console.error('Therapist deactivation error:', therapistError)
  }

  revalidatePath('/admin/therapists')
  redirect('/admin/therapists?message=Therapist deactivated successfully')
}
```

## 完了条件
- [ ] 整体師一覧ページが表示される
- [ ] 整体師の新規登録ができる（usersとtherapists両方に登録）
- [ ] 初期パスワードが自動生成される
- [ ] 整体師情報の編集ができる
- [ ] 整体師の無効化ができる
- [ ] 管理者以外はアクセスできない
- [ ] 成功/エラーメッセージが表示される
- [ ] データがデータベースに正しく保存される

## 注意事項
- 整体師はSupabase Authユーザーとして作成される
- 初期パスワードは自動生成され、メールで送信（将来実装）
- 初回ログイン時にパスワード変更を強制（must_change_password: true）
- 無効化しても完全削除はしない（is_active: false, is_available: false）
- 退職した整体師の過去の施術履歴は保持される

## 依存チケット
- 001-010: 基本認証機能
- 011: 法人管理機能

## 次のステップ
- 013: 法人担当者登録機能（管理者による）
