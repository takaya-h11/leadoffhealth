# 011: 法人管理機能（CRUD）

## 概要
管理者が法人情報を登録・編集・削除できる機能を実装する。

## 前提条件
- ✅ 認証機能が実装されている（001-010完了）
- ✅ `companies`テーブルが作成されている
- ✅ RLSポリシーが設定されている

## タスク

### 1. 法人一覧ページ作成
- [ ] `src/app/(protected)/admin/companies`ディレクトリを作成
- [ ] `src/app/(protected)/admin/companies/page.tsx`を作成
- [ ] 管理者権限チェックを実装
- [ ] 法人一覧を表示

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CompaniesPage() {
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

  // 法人一覧を取得
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">法人管理</h1>
          <Link
            href="/admin/companies/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            新規法人登録
          </Link>
        </div>

        {/* 法人一覧テーブル */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  法人名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  連絡先
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  契約期間
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
              {companies?.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{company.name}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">{company.email}</div>
                    <div className="text-sm text-gray-500">{company.phone}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {company.contract_start_date && new Date(company.contract_start_date).toLocaleDateString('ja-JP')}
                    {' 〜 '}
                    {company.contract_end_date && new Date(company.contract_end_date).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      company.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {company.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/admin/companies/${company.id}`}
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

        {companies?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            登録されている法人がありません
          </div>
        )}
      </div>
    </div>
  )
}
```

### 2. 法人登録ページ作成
- [ ] `src/app/(protected)/admin/companies/new/page.tsx`を作成
- [ ] 法人登録フォームを実装
- [ ] バリデーションを追加

**フォーム項目:**
- 法人名（必須）
- 住所
- 電話番号
- メールアドレス
- 契約開始日
- 契約終了日
- 備考

### 3. 法人編集ページ作成
- [ ] `src/app/(protected)/admin/companies/[id]/page.tsx`を作成
- [ ] 既存データの読み込み
- [ ] 編集フォームを実装
- [ ] 削除機能を追加

### 4. Server Actions作成
- [ ] `src/app/(protected)/admin/companies/actions.ts`を作成
- [ ] `createCompany` - 法人登録
- [ ] `updateCompany` - 法人更新
- [ ] `deleteCompany` - 法人削除（is_activeをfalseに変更）

**実装内容:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createCompany(formData: FormData) {
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

  const company = {
    name: formData.get('name') as string,
    address: formData.get('address') as string || null,
    phone: formData.get('phone') as string || null,
    email: formData.get('email') as string || null,
    contract_start_date: formData.get('contract_start_date') as string || null,
    contract_end_date: formData.get('contract_end_date') as string || null,
    notes: formData.get('notes') as string || null,
    is_active: true,
  }

  // バリデーション
  if (!company.name || company.name.trim().length === 0) {
    redirect('/admin/companies/new?message=Company name is required')
  }

  const { error } = await supabase
    .from('companies')
    .insert(company)

  if (error) {
    console.error('Company creation error:', error)
    redirect('/admin/companies/new?message=Failed to create company')
  }

  revalidatePath('/admin/companies')
  redirect('/admin/companies?message=Company created successfully')
}

export async function updateCompany(id: string, formData: FormData) {
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

  const company = {
    name: formData.get('name') as string,
    address: formData.get('address') as string || null,
    phone: formData.get('phone') as string || null,
    email: formData.get('email') as string || null,
    contract_start_date: formData.get('contract_start_date') as string || null,
    contract_end_date: formData.get('contract_end_date') as string || null,
    notes: formData.get('notes') as string || null,
    is_active: formData.get('is_active') === 'true',
    updated_at: new Date().toISOString(),
  }

  // バリデーション
  if (!company.name || company.name.trim().length === 0) {
    redirect(`/admin/companies/${id}?message=Company name is required`)
  }

  const { error } = await supabase
    .from('companies')
    .update(company)
    .eq('id', id)

  if (error) {
    console.error('Company update error:', error)
    redirect(`/admin/companies/${id}?message=Failed to update company`)
  }

  revalidatePath('/admin/companies')
  revalidatePath(`/admin/companies/${id}`)
  redirect(`/admin/companies/${id}?message=Company updated successfully`)
}

export async function deleteCompany(id: string) {
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

  // 論理削除（is_activeをfalseに変更）
  const { error } = await supabase
    .from('companies')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Company deletion error:', error)
    redirect(`/admin/companies/${id}?message=Failed to delete company`)
  }

  revalidatePath('/admin/companies')
  redirect('/admin/companies?message=Company deleted successfully')
}
```

### 5. 管理者ダッシュボード更新
- [ ] ダッシュボードに管理者メニューを追加
- [ ] 法人管理へのリンクを追加

## 完了条件
- [ ] 法人一覧ページが表示される
- [ ] 法人の新規登録ができる
- [ ] 法人情報の編集ができる
- [ ] 法人の無効化（論理削除）ができる
- [ ] 管理者以外はアクセスできない
- [ ] 成功/エラーメッセージが表示される
- [ ] データがデータベースに正しく保存される

## 注意事項
- 法人の完全削除は行わない（is_activeをfalseに変更）
- 法人に紐づく法人担当者がいる場合も削除可能（company_idはNULLにならない）
- 契約期間は任意項目

## 依存チケット
- 001-010: 基本認証機能

## 次のステップ
- 012: 整体師管理機能（CRUD）
