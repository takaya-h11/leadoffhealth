# Vercel デプロイメント設定ガイド

このガイドでは、LeadOffHealthプロジェクトをVercelにデプロイし、本番環境とプレビュー環境を適切に設定する方法を説明します。

## 概要

このプロジェクトは以下のブランチ戦略を採用しています：

- **`main`ブランチ** → Vercel本番環境（Production）
- **`develop`ブランチ** → Vercelプレビュー環境（Preview）

## 初回デプロイ設定

### 1. Vercelプロジェクトの作成

1. [Vercel](https://vercel.com)にログイン

2. **Add New** > **Project** をクリック

3. GitHubリポジトリ `takaya-h11/leadoffhealth` を選択

4. 以下の設定を確認：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. **Deploy** をクリック

### 2. Production Branch の設定

1. Vercelプロジェクトの **Settings** に移動

2. **Git** セクションを選択

3. **Production Branch** を `main` に設定

4. **Save** をクリック

これにより、`main`ブランチへのpushが本番環境にデプロイされます。

### 3. 環境変数の設定

#### 本番環境（Production）

1. **Settings** > **Environment Variables** に移動

2. 以下の環境変数を **Production** 環境に追加：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key

# Resend API (Email Service)
RESEND_API_KEY=your_production_resend_api_key

# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Cron Job Secret
CRON_SECRET=your_production_random_secret_key

# Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

#### プレビュー環境（Preview）

1. 同じく **Environment Variables** で、各変数の **Preview** 環境を追加

2. 開発用のSupabaseプロジェクトやResendキーを使用：

```bash
# Supabase Configuration (Development)
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_supabase_anon_key

# Resend API (Development)
RESEND_API_KEY=your_dev_resend_api_key

# Application URL (Preview)
NEXT_PUBLIC_APP_URL=https://your-project-git-develop-yourusername.vercel.app

# Cron Job Secret (Development)
CRON_SECRET=your_dev_random_secret_key

# Supabase Service Role Key (Development)
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key
```

**注意**: プレビュー環境には本番データベースではなく、開発用のSupabaseプロジェクトを使用してください。

### 4. Cron Jobs の設定

このプロジェクトは `vercel.json` で定義されたCron Jobsを使用しています。

現在の設定：
```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 11 * * *"
    }
  ]
}
```

これは毎日午前11時（UTC）にリマインダー通知を送信します（日本時間20時）。

**確認事項**:
- Cron Jobsは本番環境（`main`ブランチ）でのみ実行されます
- `CRON_SECRET` 環境変数が正しく設定されていることを確認
- `/api/cron/send-reminders` エンドポイントが実装されていることを確認

### 5. カスタムドメインの設定（オプション）

1. **Settings** > **Domains** に移動

2. **Add** をクリック

3. 独自ドメイン（例: `leadoffhealth.com`）を入力

4. DNSレコードを設定（Vercelの指示に従う）

5. ドメインが追加されたら、`NEXT_PUBLIC_APP_URL` 環境変数を更新

## デプロイフロー

### 通常の開発作業

```bash
# developブランチで開発
git checkout develop
git add .
git commit -m "feat: 新機能の追加"
git push origin develop
```

→ Vercelが自動的にプレビューデプロイを作成します。

### 本番リリース

```bash
# mainブランチにマージ
git checkout main
git merge develop
git push origin main
```

→ Vercelが本番環境にデプロイします。

### 緊急修正（Hotfix）

```bash
# mainブランチで直接修正
git checkout main
git add .
git commit -m "fix: 緊急バグ修正"
git push origin main

# developにもマージ
git checkout develop
git merge main
git push origin develop
```

## トラブルシューティング

### デプロイが失敗する場合

1. **Vercel Build Logs** を確認
   - プロジェクトページの **Deployments** タブで失敗したデプロイをクリック
   - Build Logsでエラーメッセージを確認

2. **環境変数の確認**
   - すべての必須環境変数が設定されているか確認
   - 特に `NEXT_PUBLIC_` プレフィックスの変数は正しく設定されているか

3. **ローカルでビルド確認**
   ```bash
   npm run build
   ```
   ローカルでビルドが成功するか確認

### Cron Jobsが実行されない場合

1. **環境変数 `CRON_SECRET` が設定されているか確認**

2. **Cron Jobsのログを確認**
   - Vercelプロジェクトの **Logs** タブで実行履歴を確認

3. **エンドポイントが正しく動作するか確認**
   ```bash
   curl -X GET "https://your-domain.vercel.app/api/cron/send-reminders" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### プレビュー環境で本番データが表示される場合

- **環境変数の設定を確認**
  - Preview環境に開発用のSupabase URLとキーが設定されているか
  - 本番環境のキーが誤ってPreview環境に設定されていないか

## セキュリティベストプラクティス

1. **本番環境と開発環境のSupabaseプロジェクトを分ける**
   - 本番データの漏洩や誤操作を防ぐ

2. **CRON_SECRET は推測不可能なランダム文字列を使用**
   ```bash
   openssl rand -base64 32
   ```

3. **Supabase Service Role Key は慎重に管理**
   - 管理者権限を持つキーなので、本番環境でのみ使用
   - GitHub Secretsなどで管理しない（Vercel環境変数のみ）

4. **環境変数は決してコードにハードコードしない**
   - `.env.local` はgitignoreに追加されていることを確認

## 参考リンク

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Next.js デプロイメント](https://nextjs.org/docs/app/building-your-application/deploying)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Supabase環境設定](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

**最終更新日**: 2025年12月4日
