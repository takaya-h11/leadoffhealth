# 015: 施術メニュー管理機能

## 概要
管理者が施術メニューのマスターデータを管理（追加・編集・削除・料金変更）できる機能を実装する。

## 前提条件
- ✅ 認証機能が実装されている（001-010完了）
- ✅ ユーザー管理機能が実装されている（011-014完了）
- ✅ `service_menus`テーブルが作成されている
- ✅ RLSポリシーが設定されている
- ✅ 初期データ（初回カウンセリング+整体、基本整体）が投入されている

## タスク

### 1. 施術メニュー一覧ページ作成
- [ ] `src/app/(protected)/admin/service-menus`ディレクトリを作成
- [ ] `src/app/(protected)/admin/service-menus/page.tsx`を作成
- [ ] 管理者権限チェックを実装
- [ ] 施術メニュー一覧を表示

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ServiceMenusPage() {
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

  // 施術メニュー一覧を取得
  const { data: serviceMenus } = await supabase
    .from('service_menus')
    .select('*')
    .order('duration_minutes')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">施術メニュー管理</h1>
          <Link
            href="/admin/service-menus/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            新規メニュー追加
          </Link>
        </div>

        {/* 施術メニュー一覧 */}
        <div className="space-y-4">
          {serviceMenus?.map((menu) => (
            <div
              key={menu.id}
              className={`rounded-lg border p-6 shadow ${
                menu.is_active
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-300 bg-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {menu.name}
                    </h3>
                    {!menu.is_active && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                        無効
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {menu.description || '説明なし'}
                  </p>
                  <div className="mt-4 flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-700">
                        {menu.duration_minutes}分
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">
                        ¥{menu.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/admin/service-menus/${menu.id}`}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  編集
                </Link>
              </div>
            </div>
          ))}
        </div>

        {serviceMenus?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            登録されている施術メニューがありません
          </div>
        )}
      </div>
    </div>
  )
}
```

### 2. 施術メニュー登録ページ作成
- [ ] `src/app/(protected)/admin/service-menus/new/page.tsx`を作成
- [ ] 施術メニュー登録フォームを実装
- [ ] バリデーションを追加

**フォーム項目:**
- メニュー名（必須）
- 施術時間（分）（必須）
- 料金（円）（必須）
- 説明（任意）

**実装内容:**
```typescript
import Link from 'next/link'
import { createServiceMenu } from '../actions'

export default function NewServiceMenuPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">新規施術メニュー追加</h1>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <form action={createServiceMenu}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                メニュー名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="例: 基本整体"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700">
                施術時間（分） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="duration_minutes"
                name="duration_minutes"
                required
                min="1"
                step="1"
                placeholder="60"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                料金（円） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                step="100"
                placeholder="8000"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                説明
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="このメニューの説明を入力してください"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href="/admin/service-menus"
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

### 3. 施術メニュー編集ページ作成
- [ ] `src/app/(protected)/admin/service-menus/[id]/page.tsx`を作成
- [ ] 既存データの読み込み
- [ ] 編集フォームを実装
- [ ] 無効化機能を追加

### 4. Server Actions作成
- [ ] `src/app/(protected)/admin/service-menus/actions.ts`を作成
- [ ] `createServiceMenu` - 施術メニュー登録
- [ ] `updateServiceMenu` - 施術メニュー更新
- [ ] `deactivateServiceMenu` - 施術メニュー無効化

**実装内容:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createServiceMenu(formData: FormData) {
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

  const name = formData.get('name') as string
  const durationMinutes = parseInt(formData.get('duration_minutes') as string)
  const price = parseInt(formData.get('price') as string)

  // バリデーション
  if (!name || !durationMinutes || !price) {
    redirect('/admin/service-menus/new?message=All required fields must be filled')
  }

  if (durationMinutes <= 0 || price < 0) {
    redirect('/admin/service-menus/new?message=Invalid duration or price')
  }

  const { error } = await supabase
    .from('service_menus')
    .insert({
      name,
      duration_minutes: durationMinutes,
      price,
      description: formData.get('description') as string || null,
      is_active: true,
    })

  if (error) {
    console.error('Service menu creation error:', error)
    redirect('/admin/service-menus/new?message=Failed to create service menu')
  }

  revalidatePath('/admin/service-menus')
  redirect('/admin/service-menus?message=Service menu created successfully')
}

export async function updateServiceMenu(id: string, formData: FormData) {
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

  const name = formData.get('name') as string
  const durationMinutes = parseInt(formData.get('duration_minutes') as string)
  const price = parseInt(formData.get('price') as string)

  // バリデーション
  if (!name || !durationMinutes || !price) {
    redirect(`/admin/service-menus/${id}?message=All required fields must be filled`)
  }

  if (durationMinutes <= 0 || price < 0) {
    redirect(`/admin/service-menus/${id}?message=Invalid duration or price`)
  }

  const { error } = await supabase
    .from('service_menus')
    .update({
      name,
      duration_minutes: durationMinutes,
      price,
      description: formData.get('description') as string || null,
      is_active: formData.get('is_active') === 'true',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Service menu update error:', error)
    redirect(`/admin/service-menus/${id}?message=Failed to update service menu`)
  }

  revalidatePath('/admin/service-menus')
  revalidatePath(`/admin/service-menus/${id}`)
  redirect(`/admin/service-menus/${id}?message=Service menu updated successfully`)
}

export async function deactivateServiceMenu(id: string) {
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

  // 無効化（論理削除）
  const { error } = await supabase
    .from('service_menus')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Service menu deactivation error:', error)
    redirect(`/admin/service-menus/${id}?message=Failed to deactivate service menu`)
  }

  revalidatePath('/admin/service-menus')
  redirect('/admin/service-menus?message=Service menu deactivated successfully')
}
```

## 完了条件
- [ ] 施術メニュー一覧ページが表示される
- [ ] 施術メニューの新規登録ができる
- [ ] 施術メニューの編集ができる
- [ ] 料金の変更ができる
- [ ] 施術メニューの無効化ができる
- [ ] 管理者以外はアクセスできない
- [ ] 成功/エラーメッセージが表示される
- [ ] データがデータベースに正しく保存される

## 注意事項
- 施術メニューの完全削除は行わない（is_active: false）
- 既存の予約で使用されているメニューを無効化しても、過去のデータは保持される
- 料金変更は将来の予約にのみ適用される
- 施術時間は正の整数のみ許可
- 料金は0以上の整数のみ許可

## 依存チケット
- 001-010: 基本認証機能
- 011-014: ユーザー管理機能

## 次のステップ
- 016: 症状マスター管理機能
