# 009: パスワードリセット機能

## 概要
ユーザーがパスワードを忘れた場合のリセット機能を実装する。

## タスク

### 1. パスワードリセット依頼ページ
- [ ] `src/app/(auth)/reset-password`ディレクトリを作成
- [ ] `src/app/(auth)/reset-password/page.tsx`を作成
- [ ] メールアドレス入力フォームを実装

**実装内容:**
```typescript
import { requestPasswordReset } from './actions'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <form className="w-full max-w-md space-y-4 rounded-lg border p-8">
        <h1 className="text-2xl font-bold">パスワードリセット</h1>
        <p className="text-sm text-gray-600">
          登録済みのメールアドレスを入力してください。パスワードリセット用のリンクを送信します。
        </p>

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

        <button
          formAction={requestPasswordReset}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          リセットメールを送信
        </button>

        <a
          href="/login"
          className="block text-center text-sm text-blue-600 hover:underline"
        >
          ログインページに戻る
        </a>
      </form>
    </div>
  )
}
```

### 2. リセット依頼Action作成
- [ ] `src/app/(auth)/reset-password/actions.ts`を作成
- [ ] `resetPasswordForEmail()`を実装

**実装内容:**
```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
  })

  if (error) {
    redirect('/reset-password?message=Failed to send reset email')
  }

  redirect('/reset-password?message=Check your email for the reset link')
}
```

### 3. 新パスワード設定ページ
- [ ] `src/app/auth/update-password`ディレクトリを作成
- [ ] `src/app/auth/update-password/page.tsx`を作成
- [ ] 新しいパスワード入力フォームを実装

**実装内容:**
```typescript
import { updatePassword } from './actions'

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <form className="w-full max-w-md space-y-4 rounded-lg border p-8">
        <h1 className="text-2xl font-bold">新しいパスワードを設定</h1>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            新しいパスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium">
            パスワード確認
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        <button
          formAction={updatePassword}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          パスワードを更新
        </button>
      </form>
    </div>
  )
}
```

### 4. パスワード更新Action作成
- [ ] `src/app/auth/update-password/actions.ts`を作成
- [ ] `updateUser()`でパスワード更新を実装
- [ ] パスワード一致確認を追加

**実装内容:**
```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    redirect('/auth/update-password?message=Passwords do not match')
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    redirect('/auth/update-password?message=Failed to update password')
  }

  redirect('/login?message=Password updated successfully')
}
```

### 5. 環境変数追加
- [ ] `.env.local`に`NEXT_PUBLIC_SITE_URL`を追加
  ```
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```

### 6. Supabase設定更新
- [ ] Redirect URLsに`http://localhost:3000/auth/update-password`を追加

## 完了条件
- [ ] リセット依頼ページが動作する（/reset-password）
- [ ] メール送信が成功する
- [ ] メール内のリンクから新パスワード設定ページへ遷移できる
- [ ] 新パスワード設定が成功する
- [ ] パスワード更新後にログインできる

## 依存チケット
- 002: Supabase Client Utilities作成
- 005: ログインページ実装

## 参考資料
- [Supabase Password Reset](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
