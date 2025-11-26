# 003: Middleware実装

## 概要
認証トークンを自動的にリフレッシュするためのミドルウェアを実装する。これはSupabase認証において**必須**の実装。

## タスク

### 1. Middlewareファイル作成
- [ ] プロジェクトルートに`middleware.ts`を作成

### 2. Middleware実装
- [ ] Supabaseクライアントの作成
- [ ] `getUser()`でトークンリフレッシュ
- [ ] リクエストとレスポンスの両方にcookieを設定
- [ ] 適切なエラーハンドリング

**実装内容:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // トークンをリフレッシュ（重要: getSession()ではなくgetUser()を使用）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 3. 動作確認
- [ ] 開発サーバーを起動してエラーがないことを確認
- [ ] ミドルウェアが全てのルートで実行されることを確認（ログ追加で確認可能）

## 完了条件
- [ ] middleware.tsが作成されている
- [ ] トークンリフレッシュが正しく動作している
- [ ] matcherが静的ファイルを除外している
- [ ] TypeScriptのエラーがない

## 重要事項
⚠️ **セキュリティ上重要**: 必ず`getUser()`を使用すること。`getSession()`はサーバーサイドでの使用は安全ではありません。

## 依存チケット
- 001: Supabase Project Setup
- 002: Supabase Client Utilities作成

## 参考資料
- [Supabase Middleware Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
