# マイグレーション実施手順

**重要**: このドキュメントは、Supabaseのマイグレーションを実施するための詳細な手順書です。

---

## 🚨 エラーが発生した場合

もし `column "company_id" does not exist` のようなエラーが発生した場合、マイグレーションが正しく適用されていません。以下の手順に従ってください。

---

## 📋 事前準備

### 1. バックアップの取得（必須）

**Supabase ダッシュボードでバックアップを取得:**

1. https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru にアクセス
2. 左メニュー → **Database** → **Backups**
3. **Create backup** ボタンをクリック
4. バックアップ名を入力（例: `before-migration-2025-12-09`）
5. 完了を待つ（数分かかる場合があります）

### 2. 現在の状態を確認

**Supabase SQL Editor で確認:**

1. https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/sql にアクセス
2. `scripts/check-migration-status.sql` の内容をコピー＆ペースト
3. **Run** をクリック
4. 結果を確認:
   - ✅ = 正常
   - ❌ = マイグレーション未実施

---

## 🔧 マイグレーション実施方法

### 方法1: Supabase CLI（推奨）

#### ステップ1: Supabase CLI のインストール

```bash
# Windows (PowerShell)
scoop install supabase

# または npm でインストール
npm install -g supabase
```

#### ステップ2: Supabaseプロジェクトにリンク

```bash
# プロジェクトディレクトリで実行
npx supabase link --project-ref jtdaguehanvqozhhfxru

# アクセストークンを入力するよう求められます
# Supabaseダッシュボード → Account → Access Tokens で作成
```

#### ステップ3: マイグレーションの適用

```bash
# ローカルでマイグレーションをテスト（Docker必須）
npx supabase db reset

# 本番環境に適用
npx supabase db push
```

**注意**: `db push` は本番環境に直接適用されます。必ずバックアップを取得してから実行してください。

---

### 方法2: Supabase SQL Editor（手動）

Supabase CLIが使えない場合、手動でSQLを実行します。

#### ステップ1: マイグレーション1を実行

1. https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/sql にアクセス
2. `supabase/migrations/20250111000000_redesign_booking_flow.sql` の内容をコピー
3. SQL Editorにペースト
4. **Run** をクリック
5. エラーがないことを確認

**実行内容:**
- `appointments` テーブルに `user_id` カラム追加
- `appointments.status` のデフォルト値を `'approved'` に変更
- ビュー `calendar_slots_for_users` と `calendar_slots_for_staff` を作成
- トリガー `auto_approve_appointment_trigger` と `release_slot_on_cancel_trigger` を作成

#### ステップ2: マイグレーション2を実行

1. 同じSQL Editorで新しいタブを開く
2. `supabase/migrations/20250112000000_add_company_specific_slots.sql` の内容をコピー
3. SQL Editorにペースト
4. **Run** をクリック
5. エラーがないことを確認

**実行内容:**
- `available_slots` テーブルに `company_id` カラム追加
- インデックス `idx_available_slots_company_id` を作成
- RLSポリシーを更新（法人専用枠用）

#### ステップ3: 実施確認

1. 新しいタブで `scripts/check-migration-status.sql` を実行
2. すべての項目が ✅ になっていることを確認

---

## ✅ マイグレーション後の確認

### 1. 基本確認

```sql
-- appointments.user_id カラムの確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments' AND column_name = 'user_id';

-- available_slots.company_id カラムの確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'available_slots' AND column_name = 'company_id';
```

**期待される結果:**
| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| user_id | uuid | YES |
| company_id | uuid | YES |

### 2. ビューの確認

```sql
-- ビューが存在するか確認
SELECT viewname FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('calendar_slots_for_users', 'calendar_slots_for_staff');
```

**期待される結果:**
```
viewname
--------------------------
calendar_slots_for_users
calendar_slots_for_staff
```

### 3. トリガーの確認

```sql
-- トリガーが存在するか確認
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('auto_approve_appointment_trigger', 'release_slot_on_cancel_trigger');
```

**期待される結果:**
| trigger_name | event_manipulation | event_object_table |
|--------------|--------------------|--------------------|
| auto_approve_appointment_trigger | INSERT | appointments |
| release_slot_on_cancel_trigger | UPDATE | appointments |

---

## 🔄 既存データの移行

マイグレーション完了後、既存の予約データに `user_id` を設定します。

### 実行スクリプト

```sql
-- 既存の予約に user_id を設定（requested_by をコピー）
UPDATE public.appointments
SET user_id = requested_by
WHERE user_id IS NULL
  AND requested_by IS NOT NULL;

-- 結果確認
SELECT
  COUNT(*) as total_appointments,
  COUNT(user_id) as appointments_with_user_id,
  COUNT(*) - COUNT(user_id) as appointments_without_user_id
FROM public.appointments;
```

**期待される結果:**
- `appointments_without_user_id` が 0 であること

---

## 🐛 トラブルシューティング

### エラー1: `relation "appointments" does not exist`

**原因**: テーブル名が間違っている、またはスキーマが異なる

**対処法:**
```sql
-- テーブルの存在確認
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### エラー2: `column "user_id" already exists`

**原因**: すでにマイグレーションが適用されている

**対処法:**
- `scripts/check-migration-status.sql` で現在の状態を確認
- すでに適用済みの場合、スキップして次のステップへ

### エラー3: `permission denied for table appointments`

**原因**: 権限不足

**対処法:**
1. Supabaseダッシュボードで SQL Editor を使用していることを確認
2. Service Role を使用している場合は、正しいロールを設定

### エラー4: マイグレーションを途中で中断した

**対処法:**
1. バックアップから復元
2. または、現在の状態を確認して続きから実行

---

## 📊 完了チェックリスト

マイグレーション完了後、以下をチェックしてください:

### データベース
- [ ] `appointments.user_id` カラムが存在する
- [ ] `available_slots.company_id` カラムが存在する
- [ ] `appointments.status` のデフォルト値が `'approved'`
- [ ] ビュー `calendar_slots_for_users` が存在する
- [ ] ビュー `calendar_slots_for_staff` が存在する
- [ ] トリガー `auto_approve_appointment_trigger` が存在する
- [ ] トリガー `release_slot_on_cancel_trigger` が存在する
- [ ] RLSポリシーが正しく設定されている

### データ移行
- [ ] 既存の予約に `user_id` が設定されている
- [ ] `user_id` が NULL の予約が 0 件

### 動作確認
- [ ] 予約作成が正常に動作する
- [ ] 予約のステータスが `approved` になる
- [ ] キャンセルが正常に動作する
- [ ] スロットが正しく解放される

---

## 📞 サポート

問題が発生した場合:
1. `scripts/check-migration-status.sql` で現在の状態を確認
2. このドキュメントの「トラブルシューティング」を参照
3. GitHub Issueで報告

---

## 🔗 関連ドキュメント

- [マイグレーション完了レポート](../MIGRATION_STATUS_REPORT.md)
- [実装計画書](./POST_MIGRATION_IMPLEMENTATION_PLAN.md)
- [マイグレーション後チェックリスト](./POST_MIGRATION_CHECKLIST.md)

---

**最終更新**: 2025年12月9日
