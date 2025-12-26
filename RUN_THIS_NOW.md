# ⚡ マイグレーション実行手順（最終修正版）

**エラー修正済み**:
- ✅ ビューエラーを修正
- ✅ データ型エラーを修正（UUID → BIGINT）

---

## 🚀 実行手順（10分）

### ステップ1: Supabase SQL Editorを開く

```
https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/sql
```

---

### ステップ2: マイグレーション1を実行

**New query** をクリックして、以下のファイルの内容をコピー＆ペーストして実行:

📋 **`scripts/MIGRATION_1_COMPLETE.sql`**

このスクリプトは以下を実行します:
- ✅ `appointments.user_id` カラム追加
- ✅ `appointments.status` デフォルト値変更
- ✅ 自動承認トリガー作成
- ✅ キャンセル時スロット解放トリガー作成
- ✅ カレンダービュー作成（利用者向け・スタッフ向け）

**実行後の確認:**
```sql
SELECT '✅ マイグレーション1完了！' as status;
```
このメッセージが表示されればOK。

---

### ステップ3: マイグレーション2を実行

新しいクエリタブで、以下のファイルの内容をコピー＆ペーストして実行:

📋 **`scripts/MIGRATION_2_COMPLETE.sql`**

このスクリプトは以下を実行します:
- ✅ `available_slots.company_id` カラム追加
- ✅ インデックス作成
- ✅ RLSポリシー更新

**実行後の確認:**
```sql
SELECT '✅ マイグレーション2完了！' as status;
```

---

### ステップ4: 確認

以下のSQLを実行して、`company_id` カラムが追加されたことを確認:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'available_slots' AND column_name = 'company_id';
```

**期待される結果:**
| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| company_id | uuid | YES |

---

### ステップ5: 既存データ移行

以下のSQLを実行して、既存の予約に `user_id` を設定:

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
- `appointments_without_user_id` が 0

---

## ✅ 完了チェックリスト

- [ ] マイグレーション1を実行（エラーなし）
- [ ] マイグレーション2を実行（エラーなし）
- [ ] `company_id` カラムが存在することを確認
- [ ] 既存データ移行を実行
- [ ] `appointments_without_user_id` が 0

---

## 🎉 完了！

すべてのステップが完了したら、以下のドキュメントを確認してください:

- **📋 [実装計画書](./docs/POST_MIGRATION_IMPLEMENTATION_PLAN.md)** - 次の実装タスク
- **📊 [マイグレーション完了レポート](./MIGRATION_STATUS_REPORT.md)** - 全体像

---

## 🐛 エラーが発生した場合

### エラー: `cannot drop columns from view`
→ **解決済み**: `MIGRATION_1_COMPLETE.sql` に修正が含まれています

### エラー: `column already exists`
→ すでに一部適用済みです。次のステップに進んでください

### その他のエラー
→ `docs/HOW_TO_RUN_MIGRATIONS.md` のトラブルシューティングを参照

---

**最終更新**: 2025年12月9日
