# 008: ユーザープロフィール管理機能

## 概要
ユーザーが自分のプロフィール情報を表示・編集できる機能を実装する。

## タスク

### 1. Profile Page作成
- [ ] `src/app/(protected)/profile`ディレクトリを作成
- [ ] `src/app/(protected)/profile/page.tsx`を作成
- [ ] プロフィール表示・編集フォームを実装

**実装内容:**
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { updateProfile } from './actions'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // profilesテーブルからユーザー情報を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">プロフィール設定</h1>

        <form action={updateProfile} className="space-y-6 rounded-lg border p-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              defaultValue={user.email}
              disabled
              className="mt-1 block w-full rounded-md border bg-gray-50 px-3 py-2"
            />
            <p className="mt-1 text-sm text-gray-500">
              メールアドレスは変更できません
            </p>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              ユーザー名
            </label>
            <input
              id="username"
              name="username"
              type="text"
              defaultValue={profile?.username || ''}
              className="mt-1 block w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium">
              フルネーム
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              defaultValue={profile?.full_name || ''}
              className="mt-1 block w-full rounded-md border px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            保存
          </button>
        </form>
      </div>
    </div>
  )
}
```

### 2. Update Profile Action作成
- [ ] `src/app/(protected)/profile/actions.ts`を作成
- [ ] プロフィール更新処理を実装
- [ ] バリデーションを追加
- [ ] エラーハンドリングを実装

**実装内容:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const username = formData.get('username') as string
  const full_name = formData.get('full_name') as string

  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      full_name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    redirect('/profile?message=Failed to update profile')
  }

  revalidatePath('/profile')
  redirect('/profile?message=Profile updated successfully')
}
```

### 3. Success/Error メッセージ表示
- [ ] URLパラメータからメッセージを取得
- [ ] トースト通知またはアラートで表示

## 完了条件
- [ ] プロフィールページが表示される（/profile）
- [ ] 現在のプロフィール情報が表示される
- [ ] フォーム送信でプロフィールが更新される
- [ ] 更新成功時にメッセージが表示される
- [ ] エラー時に適切なメッセージが表示される

## 依存チケット
- 002: Supabase Client Utilities作成
- 004: Authentication Schema Setup（profilesテーブル）
- 007: 保護されたダッシュボードページ実装

## 参考資料
- [Supabase Database Operations](https://supabase.com/docs/reference/javascript/select)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
