# 016: 症状マスター管理機能

## 概要
管理者が症状マスターデータを管理（追加・編集・並び替え）できる機能を実装する。症状は予約申込時と施術記録時に選択される。

## 前提条件
- ✅ 認証機能が実装されている（001-010完了）
- ✅ ユーザー管理機能が実装されている（011-014完了）
- ✅ 施術メニュー管理機能が実装されている（015完了）
- ✅ `symptoms`テーブルが作成されている
- ✅ RLSポリシーが設定されている
- ✅ 初期データ（肩こり、腰痛、頭痛、首痛）が投入されている

## タスク

### 1. 症状マスター一覧ページ作成
- [ ] `src/app/(protected)/admin/symptoms`ディレクトリを作成
- [ ] `src/app/(protected)/admin/symptoms/page.tsx`を作成
- [ ] 管理者権限チェックを実装
- [ ] 症状一覧を表示順に表示
- [ ] ドラッグ&ドロップで並び替え（将来実装）

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SymptomsPage() {
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

  // 症状一覧を取得（表示順でソート）
  const { data: symptoms } = await supabase
    .from('symptoms')
    .select('*')
    .order('display_order')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">症状マスター管理</h1>
            <p className="mt-2 text-sm text-gray-600">
              予約申込時と施術記録時に選択できる症状を管理します
            </p>
          </div>
          <Link
            href="/admin/symptoms/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            新規症状追加
          </Link>
        </div>

        {/* 症状一覧 */}
        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="divide-y divide-gray-200">
            {symptoms?.map((symptom, index) => (
              <div
                key={symptom.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900">
                      {symptom.name}
                    </h3>
                    {!symptom.is_active && (
                      <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                        無効
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* 将来実装: 上下移動ボタン */}
                  <Link
                    href={`/admin/symptoms/${symptom.id}`}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    編集
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {symptoms?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            登録されている症状がありません
          </div>
        )}

        {/* 使用方法の説明 */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-900">症状マスターについて</h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-800">
            <li>• 法人担当者が予約申込時に選択できる症状の一覧です</li>
            <li>• 整体師が施術記録を記入する際にも使用されます</li>
            <li>• 表示順は上から順番に表示されます</li>
            <li>• 無効化した症状は新規選択できませんが、過去のデータは保持されます</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
```

### 2. 症状登録ページ作成
- [ ] `src/app/(protected)/admin/symptoms/new/page.tsx`を作成
- [ ] 症状登録フォームを実装
- [ ] バリデーション（重複チェック）を追加

**実装内容:**
```typescript
import Link from 'next/link'
import { createSymptom } from '../actions'

export default function NewSymptomPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">新規症状追加</h1>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <form action={createSymptom}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                症状名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="例: 肩こり"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                ※ 同じ名前の症状は登録できません
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="display_order" className="block text-sm font-medium text-gray-700">
                表示順
              </label>
              <input
                type="number"
                id="display_order"
                name="display_order"
                min="0"
                step="1"
                defaultValue="0"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                ※ 小さい数字ほど上に表示されます。0を指定すると自動的に最後に追加されます。
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href="/admin/symptoms"
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

### 3. 症状編集ページ作成
- [ ] `src/app/(protected)/admin/symptoms/[id]/page.tsx`を作成
- [ ] 既存データの読み込み
- [ ] 編集フォームを実装
- [ ] 無効化機能を追加

### 4. Server Actions作成
- [ ] `src/app/(protected)/admin/symptoms/actions.ts`を作成
- [ ] `createSymptom` - 症状登録
- [ ] `updateSymptom` - 症状更新
- [ ] `deactivateSymptom` - 症状無効化
- [ ] `reorderSymptoms` - 表示順変更（将来実装）

**実装内容:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createSymptom(formData: FormData) {
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
  let displayOrder = parseInt(formData.get('display_order') as string) || 0

  // バリデーション
  if (!name || name.trim().length === 0) {
    redirect('/admin/symptoms/new?message=Symptom name is required')
  }

  // 重複チェック
  const { data: existing } = await supabase
    .from('symptoms')
    .select('id')
    .eq('name', name.trim())
    .single()

  if (existing) {
    redirect('/admin/symptoms/new?message=Symptom name already exists')
  }

  // display_orderが0の場合、最大値+1を設定
  if (displayOrder === 0) {
    const { data: maxOrder } = await supabase
      .from('symptoms')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    displayOrder = (maxOrder?.display_order || 0) + 1
  }

  const { error } = await supabase
    .from('symptoms')
    .insert({
      name: name.trim(),
      display_order: displayOrder,
      is_active: true,
    })

  if (error) {
    console.error('Symptom creation error:', error)
    redirect('/admin/symptoms/new?message=Failed to create symptom')
  }

  revalidatePath('/admin/symptoms')
  redirect('/admin/symptoms?message=Symptom created successfully')
}

export async function updateSymptom(id: string, formData: FormData) {
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
  const displayOrder = parseInt(formData.get('display_order') as string)

  // バリデーション
  if (!name || name.trim().length === 0) {
    redirect(`/admin/symptoms/${id}?message=Symptom name is required`)
  }

  // 重複チェック（自分以外で同じ名前がないか）
  const { data: existing } = await supabase
    .from('symptoms')
    .select('id')
    .eq('name', name.trim())
    .neq('id', id)
    .single()

  if (existing) {
    redirect(`/admin/symptoms/${id}?message=Symptom name already exists`)
  }

  const { error } = await supabase
    .from('symptoms')
    .update({
      name: name.trim(),
      display_order: displayOrder,
      is_active: formData.get('is_active') === 'true',
    })
    .eq('id', id)

  if (error) {
    console.error('Symptom update error:', error)
    redirect(`/admin/symptoms/${id}?message=Failed to update symptom`)
  }

  revalidatePath('/admin/symptoms')
  revalidatePath(`/admin/symptoms/${id}`)
  redirect(`/admin/symptoms/${id}?message=Symptom updated successfully`)
}

export async function deactivateSymptom(id: string) {
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
    .from('symptoms')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Symptom deactivation error:', error)
    redirect(`/admin/symptoms/${id}?message=Failed to deactivate symptom`)
  }

  revalidatePath('/admin/symptoms')
  redirect('/admin/symptoms?message=Symptom deactivated successfully')
}
```

## 完了条件
- [ ] 症状マスター一覧ページが表示される
- [ ] 症状の新規登録ができる
- [ ] 症状名の重複チェックが機能する
- [ ] 症状の編集ができる
- [ ] 表示順の変更ができる
- [ ] 症状の無効化ができる
- [ ] 管理者以外はアクセスできない
- [ ] 成功/エラーメッセージが表示される

## 注意事項
- 症状名は重複不可（UNIQUE制約）
- 症状の完全削除は行わない（is_active: false）
- 無効化した症状は新規選択できないが、過去のデータは保持される
- 表示順は0以上の整数のみ許可
- display_orderが0の場合、自動的に最後に追加される

## 依存チケット
- 001-010: 基本認証機能
- 011-014: ユーザー管理機能
- 015: 施術メニュー管理機能

## 次のステップ
- 017: 空き枠登録機能（整体師）
