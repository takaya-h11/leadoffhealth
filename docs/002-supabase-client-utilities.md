# 002: Supabase Client Utilities作成

## 概要
Server Components用とClient Components用の2種類のSupabaseクライアントユーティリティを作成する。

## タスク

### 1. ディレクトリ構造作成
- [ ] `src/utils/supabase`ディレクトリを作成

### 2. Server Client作成
- [ ] `src/utils/supabase/server.ts`を作成
- [ ] `cookies()`を使用したクライアント作成関数を実装
- [ ] Cookie設定時のエラーハンドリングを実装（try-catch）
- [ ] TypeScript型定義を適切に設定

**実装内容:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Componentからのset時のエラーを無視
          }
        },
      },
    }
  )
}
```

### 3. Browser Client作成
- [ ] `src/utils/supabase/client.ts`を作成
- [ ] Browser用のクライアント作成関数を実装
- [ ] シングルトンパターンで実装

**実装内容:**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## 完了条件
- [ ] Server Client utilityが作成されている
- [ ] Browser Client utilityが作成されている
- [ ] 両方のクライアントが正しくエクスポートされている
- [ ] TypeScriptのエラーがない

## 依存チケット
- 001: Supabase Project Setup

## 参考資料
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
