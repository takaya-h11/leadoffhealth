# 🚨 マイグレーション実施 - クイックスタート

**ステータス**: ⚠️ マイグレーション未実施（エラー発生）

---

## 問題の概要

エラー `column "company_id" does not exist` が発生しました。これは、データベースマイグレーションが適用されていないことを示しています。

---

## 今すぐやるべきこと（3ステップ）

### ステップ1: 現在の状態を確認（5分）

1. Supabase SQL Editorを開く:
   ```
   https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/sql
   ```

2. 以下のスクリプトをコピー＆ペーストして実行:
   ```
   scripts/check-migration-status.sql
   ```

3. 結果を確認:
   - ✅ = 正常（マイグレーション済み）
   - ❌ = マイグレーション未実施（次のステップへ）

---

### ステップ2: マイグレーションを実施（10-15分）

**⚠️ 必ず事前にバックアップを取得してください！**

#### 方法1: Supabase CLI（推奨）

```bash
# プロジェクトにリンク
npx supabase link --project-ref jtdaguehanvqozhhfxru

# マイグレーションを適用
npx supabase db push
```

#### 方法2: 手動でSQLを実行

1. Supabase SQL Editorで以下を順番に実行:

   a. `supabase/migrations/20250111000000_redesign_booking_flow.sql`

   b. `supabase/migrations/20250112000000_add_company_specific_slots.sql`

2. `scripts/check-migration-status.sql` を再度実行して確認

---

### ステップ3: 既存データを移行（5分）

マイグレーション完了後、以下のスクリプトを実行:

```
scripts/migrate-existing-data.sql
```

このスクリプトは:
- 既存の予約に `user_id` を設定
- データ整合性をチェック
- 統計情報を表示

---

## 詳細なドキュメント

困ったときは以下を参照してください:

- 🚀 **[マイグレーション実施手順](./docs/HOW_TO_RUN_MIGRATIONS.md)** - 詳細な手順とトラブルシューティング
- 📊 **[マイグレーション完了レポート](./MIGRATION_STATUS_REPORT.md)** - 全体像と次のステップ
- 📋 **[実装計画書](./docs/POST_MIGRATION_IMPLEMENTATION_PLAN.md)** - 残りの実装タスク

---

## トラブルシューティング

### エラー: `permission denied`
→ Supabaseダッシュボードから実行してください

### エラー: `column already exists`
→ すでに一部適用済みです。`check-migration-status.sql` で確認してください

### エラー: `relation does not exist`
→ テーブル名を確認してください。スキーマは `public` です。

---

## サポート

問題が解決しない場合:
1. `docs/HOW_TO_RUN_MIGRATIONS.md` のトラブルシューティングを確認
2. GitHub Issueで報告

---

**最終更新**: 2025年12月9日
