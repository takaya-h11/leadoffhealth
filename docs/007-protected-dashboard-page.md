# 007: 保護されたダッシュボードページ実装

## 概要
認証が必要なダッシュボードページを実装する。未認証ユーザーはログインページへリダイレクトする。

## タスク

### 1. ディレクトリ構造作成
- [ ] `src/app/(protected)/dashboard`ディレクトリを作成
  - Note: `(protected)`はroute groupで、認証が必要なページをまとめる

### 2. Dashboard Page作成
- [ ] `src/app/(protected)/dashboard/page.tsx`を作成
- [ ] 認証チェックを実装
- [ ] ユーザー情報を表示
- [ ] サインアウトボタンを実装

**実装内容:**
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signOut } from './actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border px-4 py-2 hover:bg-gray-50"
            >
              サインアウト
            </button>
          </form>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">ユーザー情報</h2>
          <dl className="space-y-2">
            <div>
              <dt className="font-medium text-gray-600">Email:</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">User ID:</dt>
              <dd className="font-mono text-sm">{user.id}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">作成日時:</dt>
              <dd>{new Date(user.created_at).toLocaleString('ja-JP')}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
```

### 3. Sign Out Action作成
- [ ] `src/app/(protected)/dashboard/actions.ts`を作成
- [ ] サインアウト処理を実装
- [ ] リダイレクト処理を実装

**実装内容:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
```

### 4. Layout作成（オプション）
- [ ] `src/app/(protected)/layout.tsx`を作成
- [ ] 保護されたページ共通のレイアウトを実装
- [ ] ナビゲーションバーなどを追加

## 完了条件
- [ ] ダッシュボードページが表示される（/dashboard）
- [ ] 未認証時はログインページへリダイレクトされる
- [ ] 認証済みユーザーの情報が表示される
- [ ] サインアウトボタンが動作する
- [ ] サインアウト後はログインページへリダイレクトされる

## 依存チケット
- 002: Supabase Client Utilities作成
- 003: Middleware実装
- 005: ログインページ実装

## 参考資料
- [Next.js Layouts](https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/server-side/nextjs)
