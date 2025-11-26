# パスワードリセット（セルフサービス）機能

**ステータス**: 将来機能（MVP範囲外）
**優先度**: 中
**推定工数**: 1-2週間
**関連要件**: セキュリティ、ユーザー体験向上

---

## 概要

法人担当者が初期パスワードを忘れた場合に、管理者の手を介さず自分自身でパスワードをリセットできる機能。

## 背景

### 現状の課題
- 法人担当者が初期パスワードを忘れた場合、管理者に連絡して再発行してもらう必要がある
- 管理者の手間がかかる
- 対応に時間がかかり、ユーザー体験が悪い
- 法人数が増えるとスケールしない

### 解決したい問題
- 管理者の業務負担を軽減
- 法人担当者が即座に自分で解決できるようにする
- セキュアな方法でパスワードリセットを実現

---

## 機能仕様

### 1. パスワードリセット申請画面

**URL**: `/forgot-password`

**機能**:
- メールアドレスを入力
- Supabase Authの `resetPasswordForEmail()` を使用
- リセット用のメールを送信

**画面イメージ**:
```
┌─────────────────────────────────────┐
│ パスワードをお忘れの方                │
├─────────────────────────────────────┤
│ 登録メールアドレス                    │
│ [                              ]    │
│                                     │
│ [リセットメールを送信]                │
└─────────────────────────────────────┘
```

### 2. パスワード再設定画面

**URL**: `/reset-password`

**機能**:
- メールから遷移（トークン付きURL）
- 新しいパスワードを入力（8文字以上）
- パスワード確認入力
- Supabase Authの `updateUser()` でパスワード更新
- `must_change_password` フラグを `false` に更新

**画面イメージ**:
```
┌─────────────────────────────────────┐
│ 新しいパスワードの設定                │
├─────────────────────────────────────┤
│ 新しいパスワード（8文字以上）          │
│ [                              ]    │
│                                     │
│ パスワード確認                       │
│ [                              ]    │
│                                     │
│ [パスワードを更新]                    │
└─────────────────────────────────────┘
```

### 3. ログイン画面の修正

**追加要素**:
- 「パスワードを忘れた方」リンクを追加
- `/forgot-password` へ遷移

---

## 技術仕様

### 使用技術
- **Supabase Auth**
  - `resetPasswordForEmail()` - パスワードリセットメール送信
  - `updateUser()` - パスワード更新
- **Resend** - メール送信（Supabaseの設定で自動）

### 実装ファイル

```
src/
├── app/
│   ├── (auth)/
│   │   ├── forgot-password/
│   │   │   └── page.tsx          # パスワードリセット申請画面
│   │   ├── reset-password/
│   │   │   └── page.tsx          # パスワード再設定画面
│   │   └── login/
│   │       └── page.tsx          # 「パスワードを忘れた方」リンク追加
│   └── api/
│       └── auth/
│           └── reset-password/
│               └── route.ts      # パスワードリセットAPI（必要に応じて）
```

### データフロー

```
[法人担当者]
    ↓
[ログイン画面] → 「パスワードを忘れた方」クリック
    ↓
[/forgot-password] → メールアドレス入力
    ↓
[Supabase Auth] → resetPasswordForEmail() 実行
    ↓
[メール送信] → リセットリンク送信（トークン付きURL）
    ↓
[法人担当者] → メールのリンクをクリック
    ↓
[/reset-password] → 新しいパスワード入力
    ↓
[Supabase Auth] → updateUser() 実行
    ↓
[usersテーブル] → must_change_password = false に更新
    ↓
[ダッシュボード] → リダイレクト
```

---

## 実装コード例

### 1. パスワードリセット申請画面

**ファイル**: `src/app/(auth)/forgot-password/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setIsLoading(false)

    if (error) {
      setMessage({ type: 'error', text: 'メールの送信に失敗しました。メールアドレスをご確認ください。' })
    } else {
      setMessage({
        type: 'success',
        text: 'パスワードリセット用のメールを送信しました。メールをご確認ください。'
      })
      setEmail('')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>パスワードをお忘れの方</CardTitle>
          <CardDescription>
            登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                メールアドレス
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? '送信中...' : 'リセットメールを送信'}
            </Button>
            {message && (
              <div className={`p-3 rounded text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}>
                {message.text}
              </div>
            )}
            <div className="text-center text-sm">
              <Link href="/login" className="text-blue-600 hover:underline">
                ログイン画面に戻る
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 2. パスワード再設定画面

**ファイル**: `src/app/(auth)/reset-password/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isValidToken, setIsValidToken] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // トークンの検証
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidToken(true)
      } else {
        setError('リンクが無効または期限切れです。再度パスワードリセットを申請してください。')
      }
    })
  }, [supabase])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください')
      return
    }

    setIsLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {
      setIsLoading(false)
      setError('パスワードの更新に失敗しました')
      return
    }

    // must_change_password フラグをfalseに更新
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error: dbError } = await supabase
        .from('users')
        .update({ must_change_password: false })
        .eq('id', user.id)

      if (dbError) {
        console.error('Failed to update must_change_password flag:', dbError)
      }
    }

    setIsLoading(false)

    // ダッシュボードにリダイレクト
    router.push('/dashboard')
  }

  if (!isValidToken) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>エラー</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>新しいパスワードの設定</CardTitle>
          <CardDescription>
            8文字以上の安全なパスワードを設定してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                新しいパスワード（8文字以上）
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                パスワード確認
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? '更新中...' : 'パスワードを更新'}
            </Button>
            {error && (
              <div className="p-3 rounded text-sm bg-red-50 text-red-800">
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3. ログイン画面の修正

**ファイル**: `src/app/(auth)/login/page.tsx` に以下を追加

```typescript
// フォームの下に追加
<div className="text-center text-sm">
  <Link href="/forgot-password" className="text-blue-600 hover:underline">
    パスワードを忘れた方
  </Link>
</div>
```

---

## Supabase設定

### 1. メールテンプレートの設定

**Supabaseダッシュボード**:
1. `Authentication` → `Email Templates` → `Reset Password`
2. テンプレートをカスタマイズ:

```html
<h2>パスワードのリセット</h2>
<p>{{ .Email }} 様</p>
<p>LeadOffHealth予約管理システムのパスワードリセットリクエストを受け付けました。</p>
<p>以下のリンクをクリックして、新しいパスワードを設定してください:</p>
<p><a href="{{ .ConfirmationURL }}">パスワードをリセット</a></p>
<p><strong>このリンクは24時間有効です。</strong></p>
<p>もしこのリクエストに心当たりがない場合は、このメールを無視してください。</p>
<hr>
<p style="font-size: 12px; color: #666;">
  Lead off Health 整体院<br>
  このメールは自動送信されています。返信しないでください。
</p>
```

### 2. Redirect URLの設定

**Supabaseダッシュボード**:
1. `Authentication` → `URL Configuration` → `Redirect URLs`
2. 以下のURLを追加:
   - 本番: `https://your-domain.com/reset-password`
   - 開発: `http://localhost:3000/reset-password`

### 3. セキュリティ設定

**推奨設定**:
- リセットトークン有効期限: 24時間（デフォルト）
- パスワード最小文字数: 8文字以上
- パスワード強度チェック: 有効

---

## セキュリティ考慮事項

### 1. トークンの有効期限
- リセットリンクは24時間で無効化
- 期限切れの場合は再度申請が必要

### 2. レート制限
- 同一IPからの連続リクエストを制限（Supabase側で実装済み）
- 1時間に5回までのリセット申請

### 3. メールアドレスの検証
- 存在しないメールアドレスでも「送信しました」と表示（列挙攻撃対策）
- 実際にはSupabaseが存在チェックを行う

### 4. パスワード要件
- 最小8文字以上
- 将来的に大文字・小文字・数字・記号の組み合わせを推奨

---

## ユーザー体験

### メリット
- ✅ 即座に自分で解決できる（24時間365日）
- ✅ 管理者の対応を待つ必要がない
- ✅ セキュアな方法でリセット可能

### ユーザーフロー
1. ログイン画面で「パスワードを忘れた方」をクリック
2. メールアドレスを入力
3. 「リセットメールを送信」をクリック
4. メール受信（数分以内）
5. メールのリンクをクリック
6. 新しいパスワードを入力
7. ログイン画面にリダイレクト
8. 新しいパスワードでログイン

**所要時間**: 5分以内

---

## 実装ステップ

### Phase 1: 基本機能実装（3-4日）
- [ ] `/forgot-password` ページ作成
- [ ] `/reset-password` ページ作成
- [ ] ログイン画面にリンク追加
- [ ] Supabase Auth連携

### Phase 2: UI/UX改善（1-2日）
- [ ] エラーハンドリング
- [ ] ローディング状態
- [ ] 成功/失敗メッセージ
- [ ] レスポンシブ対応

### Phase 3: メール設定（1日）
- [ ] Supabaseメールテンプレート設定
- [ ] Redirect URL設定
- [ ] テストメール送信

### Phase 4: テスト（2-3日）
- [ ] 機能テスト（正常系・異常系）
- [ ] セキュリティテスト
- [ ] ユーザビリティテスト
- [ ] メール受信テスト

**総工数**: 7-10日間

---

## 依存関係

### 必須
- Supabase Auth設定完了
- メール送信設定（Resend連携）
- ユーザー登録機能

### 推奨
- ログイン機能
- パスワード変更強制機能（初回ログイン時）

---

## 将来の拡張

### Phase 2
- パスワード強度チェック（リアルタイム）
- パスワード履歴管理（過去のパスワードの再利用防止）
- 二要素認証（2FA）

### Phase 3
- SMS認証オプション
- セキュリティログ（パスワード変更履歴）
- 管理者への通知（不審なリセット試行）

---

## 参考資料

- [Supabase Auth - Reset Password](https://supabase.com/docs/guides/auth/passwords#reset-password)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Next.js App Router Authentication](https://nextjs.org/docs/app/building-your-application/authentication)

---

**最終更新日**: 2025年11月10日
**作成者**: Claude Code
**レビュアー**: 未定
