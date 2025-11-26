# 005: ログインページ実装

## 概要
Server Actionsを使用したログインページを実装する。

## タスク

### 1. ディレクトリ構造作成
- [ ] `src/app/(auth)/login`ディレクトリを作成
  - Note: `(auth)`はroute groupで、URLには含まれない

### 2. Login Page作成
- [ ] `src/app/(auth)/login/page.tsx`を作成
- [ ] ログインフォームを実装
- [ ] メールアドレスとパスワード入力フィールド
- [ ] エラーメッセージ表示機能

**実装内容:**
```typescript
import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <form className="w-full max-w-md space-y-4 rounded-lg border p-8">
        <h1 className="text-2xl font-bold">ログイン</h1>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="flex gap-2">
          <button
            formAction={login}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            ログイン
          </button>
          <button
            formAction={signup}
            className="flex-1 rounded-md border px-4 py-2 hover:bg-gray-50"
          >
            サインアップ
          </button>
        </div>
      </form>
    </div>
  )
}
```

### 3. Server Actions作成
- [ ] `src/app/(auth)/login/actions.ts`を作成
- [ ] `login`アクションを実装
- [ ] `signup`アクションを実装
- [ ] エラーハンドリングを実装

**実装内容:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/login?message=Could not create user')
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check email to continue sign in process')
}
```

### 4. エラーメッセージ表示
- [ ] URLパラメータからエラーメッセージを取得して表示
- [ ] ページコンポーネントでsearchParamsを使用

## 完了条件
- [ ] ログインページが表示される（/login）
- [ ] フォーム送信が動作する
- [ ] ログイン成功時にダッシュボードへリダイレクトされる
- [ ] サインアップ成功時に確認メッセージが表示される
- [ ] エラー時に適切なメッセージが表示される

## 依存チケット
- 002: Supabase Client Utilities作成
- 003: Middleware実装
- 004: Authentication Schema Setup

## 参考資料
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase Auth Methods](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
