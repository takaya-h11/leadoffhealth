# 006: Email確認ハンドラー実装

## 概要
メール確認リンクからのコールバックを処理するRoute Handlerを実装する。

## タスク

### 1. Route Handler作成
- [ ] `src/app/auth/confirm`ディレクトリを作成
- [ ] `src/app/auth/confirm/route.ts`を作成

### 2. 確認ロジック実装
- [ ] URLパラメータから`code`を取得
- [ ] `exchangeCodeForSession()`でセッション確立
- [ ] 成功時はダッシュボードへリダイレクト
- [ ] エラー時はログインページへリダイレクト

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // リダイレクト先のURLを返す
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // エラー時はログインページへ
  return NextResponse.redirect(
    new URL('/login?message=Authentication failed', request.url)
  )
}
```

### 3. Supabase設定更新
- [ ] Supabaseダッシュボード > Authentication > URL Configuration
- [ ] Redirect URLsに`http://localhost:3000/auth/confirm`を追加
- [ ] 本番環境のURLも追加（デプロイ時）

## 完了条件
- [ ] Email確認ハンドラーが実装されている
- [ ] メール内のリンクをクリックして認証が完了する
- [ ] 成功時に適切なページへリダイレクトされる
- [ ] エラー時にログインページへリダイレクトされる

## 依存チケット
- 002: Supabase Client Utilities作成
- 004: Authentication Schema Setup
- 005: ログインページ実装

## 参考資料
- [Supabase Email Confirmation](https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr)
