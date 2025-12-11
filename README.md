This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

Before running the application, you need to configure environment variables:

1. **Copy the example environment file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Configure the following environment variables in `.env.local`:**

   - **Supabase Configuration** (Required)
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
       - Find this in your Supabase project settings → API → Project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
       - Find this in your Supabase project settings → API → Project API keys (anon/public)

   - **Email Service Configuration** (Required for notifications)
     - `RESEND_API_KEY`: Your Resend API key for sending transactional emails
       - Sign up at [resend.com](https://resend.com)
       - Create an API key in your Resend dashboard
       - This is used for appointment notifications (request, approval, rejection, completion)

   - **Application URL** (Required for email links)
     - `NEXT_PUBLIC_APP_URL`: The base URL of your application
       - Development: `http://localhost:3000`
       - Production: Your deployed domain (e.g., `https://yourdomain.com`)

   - **Cron Job Secret** (Required for production)
     - `CRON_SECRET`: A random secret key for authenticating Vercel Cron Jobs
       - Generate a secure random string (e.g., use `openssl rand -base64 32`)
       - Used to verify that cron job requests are from Vercel
       - Must be set in Vercel's environment variables for production

3. **Example `.env.local` configuration:**
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

   # Resend (Email Service)
   RESEND_API_KEY=re_your_resend_api_key_here

   # Application URL (for email links)
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Cron Job Secret (for Vercel Cron Jobs)
   CRON_SECRET=your_random_secret_key_here
   ```

## Getting Started

After setting up your environment variables, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Development Workflow

このプロジェクトはGit-flowスタイルのブランチ戦略を採用しています。

### Branch Strategy

- **`main`** - 本番環境用ブランチ（Production）
  - 常に安定した状態を保つ
  - Vercelの本番環境にデプロイされる
  - 直接pushは禁止（Pull Requestのみ）

- **`develop`** - 開発用ブランチ（Development）
  - 日々の開発はこのブランチで行う
  - Vercelのプレビュー環境にデプロイされる
  - 機能開発、バグ修正はここで実施

### 開発手順

1. **通常の開発作業**
   ```bash
   # developブランチで作業
   git checkout develop
   git pull origin develop

   # 開発作業を実施
   # ...

   # コミット＆プッシュ
   git add .
   git commit -m "feat: 新機能の実装"
   git push origin develop
   ```

2. **本番リリース**
   ```bash
   # mainブランチに切り替え
   git checkout main
   git pull origin main

   # developブランチをマージ
   git merge develop

   # 本番環境にプッシュ
   git push origin main
   ```

3. **緊急修正（Hotfix）**
   ```bash
   # mainブランチから直接修正
   git checkout main
   git pull origin main

   # 修正を実施
   # ...

   git add .
   git commit -m "fix: 緊急修正"
   git push origin main

   # developブランチにもマージ
   git checkout develop
   git merge main
   git push origin develop
   ```

### 詳細な設定ガイド

- 📘 **[GitHub ブランチ保護ルール設定ガイド](./docs/GITHUB_BRANCH_PROTECTION_SETUP.md)** - mainブランチを保護するための詳細な手順
- 🚀 **[Vercel デプロイメント設定ガイド](./docs/VERCEL_DEPLOYMENT_SETUP.md)** - 本番環境とプレビュー環境のセットアップ方法

## 🚨 Migration Status - **実施が必要です**

**📊 [マイグレーション完了レポート](./MIGRATION_STATUS_REPORT.md)** - 予約フロー再設計と法人専用空き枠機能のマイグレーション状況

### 重要: マイグレーション未実施

エラー `column "company_id" does not exist` が発生しました。以下の手順でマイグレーションを実施してください:

1. **📋 [マイグレーション実施手順](./docs/HOW_TO_RUN_MIGRATIONS.md)** を確認
2. `scripts/check-migration-status.sql` で現在の状態を確認
3. マイグレーションを実施（CLI または 手動でSQL実行）

### 関連ドキュメント
- 🚀 **[マイグレーション実施手順](./docs/HOW_TO_RUN_MIGRATIONS.md)** - 詳細な手順とトラブルシューティング
- 📋 **[実装計画書](./docs/POST_MIGRATION_IMPLEMENTATION_PLAN.md)** - 残りの実装タスクと優先度
- 🔧 **[マイグレーション後チェックリスト](./docs/POST_MIGRATION_CHECKLIST.md)** - データベース確認とテスト手順
- 📝 **[予約フロー変更サマリー](./docs/BOOKING_FLOW_CHANGES_SUMMARY.md)** - 変更内容の詳細

### 確認・移行スクリプト
- `scripts/check-migration-status.sql` - マイグレーション状態の簡易確認（⚡ 最初に実行）
- `scripts/verify-migration.sql` - マイグレーション状態の詳細確認
- `scripts/migrate-existing-data.sql` - 既存データ移行（マイグレーション後に実行）

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# leadoffhealth
