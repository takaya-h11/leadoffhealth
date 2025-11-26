# Database Migration Guide

## 概要
このディレクトリには、Lead off Health 予約管理システムのデータベーススキーマとマイグレーションファイルが含まれています。

## マイグレーションファイル

### `20250101000000_initial_schema.sql`
初期データベーススキーマを作成します。以下が含まれます：

#### テーブル
1. `companies` - 法人情報
2. `users` - ユーザー情報（管理者・整体師・法人担当者）
3. `therapists` - 整体師の追加情報
4. `service_menus` - 施術メニュー
5. `symptoms` - 症状マスター
6. `available_slots` - 空き枠
7. `appointments` - 予約
8. `treatment_records` - 施術記録
9. `treatment_symptoms` - 施術記録と症状の中間テーブル
10. `monthly_reports` - 月次レポート
11. `invoices` - 請求書
12. `notifications` - 通知

#### 機能
- Row Level Security (RLS) ポリシー
- 自動更新タイムスタンプトリガー
- インデックス（パフォーマンス最適化）
- 初期データ（症状マスター、施術メニュー）

## 実行方法

### 方法1: Supabase SQL Editorを使用（推奨）

1. Supabaseダッシュボードにログイン
   - https://supabase.com/dashboard

2. プロジェクトを選択
   - `leadoffhealth` プロジェクトを選択

3. SQL Editorを開く
   - 左サイドバーから「SQL Editor」をクリック

4. 新しいクエリを作成
   - 「New query」ボタンをクリック

5. SQLファイルの内容をコピー＆ペースト
   - `20250101000000_initial_schema.sql` の内容を全てコピー
   - SQL Editorにペースト

6. 実行
   - 「Run」ボタンをクリック（または Ctrl+Enter / Cmd+Enter）
   - 完了まで待つ（通常30秒〜1分程度）

7. 確認
   - 左サイドバーの「Table Editor」でテーブルが作成されていることを確認
   - 「Authentication」>「Policies」でRLSポリシーが設定されていることを確認

### 方法2: Supabase CLIを使用（上級者向け）

```bash
# Supabase CLIのインストール（未インストールの場合）
npm install -g supabase

# Supabaseプロジェクトにリンク
supabase link --project-ref your-project-ref

# マイグレーション実行
supabase db push
```

## 実行後の確認項目

### 1. テーブルの確認
- [ ] Table Editorで12個のテーブルが作成されている
- [ ] 各テーブルにコメントが設定されている

### 2. 初期データの確認
- [ ] `symptoms` テーブルに4件のデータが登録されている
  - 肩こり
  - 腰痛
  - 頭痛
  - 首痛
- [ ] `service_menus` テーブルに2件のデータが登録されている
  - 初回カウンセリング+整体（120分、15,000円）
  - 基本整体（60分、8,000円）

### 3. RLSポリシーの確認
- [ ] Authentication > Policies で各テーブルにポリシーが設定されている
- [ ] RLSが有効（Enabled）になっている

### 4. インデックスの確認
- [ ] Database > Indexes でインデックスが作成されている

## トラブルシューティング

### エラー: "permission denied"
- Supabaseプロジェクトのオーナー権限でログインしているか確認

### エラー: "relation already exists"
- テーブルが既に存在している場合は、既存のテーブルを削除するか、マイグレーションをスキップ

### エラー: "syntax error"
- SQLファイルの内容を全てコピーできているか確認
- 文字コードがUTF-8になっているか確認

## 次のステップ

マイグレーション完了後：

1. **認証設定**
   - Authentication > Providers で Email認証が有効になっているか確認
   - Authentication > URL Configuration で Site URL を設定
     - 開発環境: `http://localhost:3000`
     - 本番環境: 実際のドメイン

2. **初回管理者アカウント作成**
   - Authentication > Users から手動でユーザーを作成
   - SQL Editorで `users` テーブルにレコードを追加（role: 'admin'）

3. **動作確認**
   - アプリケーションからデータベースに接続できることを確認
   - RLSポリシーが正しく動作していることを確認

## 参考資料

- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
