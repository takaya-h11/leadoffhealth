# 010: ナビゲーションとレイアウト改善

## 概要
アプリケーション全体のナビゲーションとレイアウトを改善し、ユーザビリティを向上させる。

## タスク

### 1. 共通ナビゲーションコンポーネント作成
- [ ] `src/components/navigation`ディレクトリを作成
- [ ] `src/components/navigation/navbar.tsx`を作成
- [ ] ログイン状態に応じたナビゲーションを実装

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold">
          LeadOffHealth
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm hover:text-blue-600"
              >
                ダッシュボード
              </Link>
              <Link
                href="/profile"
                className="text-sm hover:text-blue-600"
              >
                プロフィール
              </Link>
              <span className="text-sm text-gray-600">{user.email}</span>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm hover:text-blue-600"
              >
                ログイン
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
```

### 2. ルートレイアウト更新
- [ ] `src/app/layout.tsx`にナビゲーションを追加
- [ ] メタデータを更新

**実装内容:**
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navigation/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeadOffHealth",
  description: "Healthcare management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
```

### 3. ホームページ更新
- [ ] `src/app/page.tsx`を更新
- [ ] LeadOffHealthの説明とCTAを追加

**実装内容:**
```typescript
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ログイン済みの場合はダッシュボードへ
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-5xl font-bold">LeadOffHealth</h1>
        <p className="mb-8 text-xl text-gray-600">
          あなたの健康管理をサポートするプラットフォーム
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            ログイン
          </Link>
          <Link
            href="/login"
            className="rounded-md border px-6 py-3 hover:bg-gray-50"
          >
            新規登録
          </Link>
        </div>
      </div>
    </div>
  )
}
```

### 4. Protected Layout作成
- [ ] `src/app/(protected)/layout.tsx`を作成
- [ ] サイドバーナビゲーションを追加（オプション）

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
```

### 5. Loading States追加
- [ ] `src/app/(protected)/loading.tsx`を作成
- [ ] ローディングインジケーターを実装

## 完了条件
- [ ] ナビゲーションバーが全ページに表示される
- [ ] ログイン状態に応じて適切なリンクが表示される
- [ ] ホームページが更新されている
- [ ] Protected routesで共通のレイアウトが適用される
- [ ] ローディング状態が表示される

## 依存チケット
- 005: ログインページ実装
- 007: 保護されたダッシュボードページ実装

## 参考資料
- [Next.js Layouts](https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates)
- [Next.js Loading UI](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
