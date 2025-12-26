# ⚡ employee_name エラーの修正

**エラー**: `null value in column "employee_name" violates not-null constraint`

---

## 🐛 エラーの原因

`appointments` テーブルの `employee_name` と `employee_id` カラムに NOT NULL 制約があるため、新しい予約フローで予約を作成できません。

新しい予約フローでは、`user_id` を使用して利用者を特定するため、`employee_name` と `employee_id` は不要です。

---

## ✅ 修正方法

### Supabase SQL Editor で実行

```
https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/sql
```

以下のSQLを実行してください：

```sql
-- employee_name の NOT NULL 制約を削除
ALTER TABLE public.appointments
  ALTER COLUMN employee_name DROP NOT NULL;

-- employee_id の NOT NULL 制約も削除
ALTER TABLE public.appointments
  ALTER COLUMN employee_id DROP NOT NULL;

-- 確認
SELECT
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
  AND column_name IN ('employee_name', 'employee_id', 'user_id')
ORDER BY column_name;
```

**期待される結果:**
| column_name | is_nullable |
|-------------|-------------|
| employee_id | YES |
| employee_name | YES |
| user_id | YES |

すべて `YES` になればOKです。

---

## 🧪 動作確認

修正後、再度予約申し込みを試してください。

1. 法人担当者でログイン
2. 空き枠を選択
3. 予約申し込み

**期待される動作:**
- ✅ 予約が正常に作成される
- ✅ `status` が `'approved'` になる
- ✅ `employee_name` と `employee_id` は NULL
- ✅ `user_id` に利用者のIDが設定される

---

## 📝 補足情報

### データベース設計の変更点

| カラム | 旧仕様 | 新仕様 |
|--------|--------|--------|
| `employee_name` | NOT NULL（必須） | NULL許可（非推奨） |
| `employee_id` | NOT NULL（必須） | NULL許可（非推奨） |
| `user_id` | なし | 追加（UUID、NULL許可） |

### マイグレーションファイルの更新

以下のファイルに制約削除の処理を追加しました：
- ✅ `scripts/MIGRATION_1_COMPLETE.sql`
- ✅ `supabase/migrations/20250111000000_redesign_booking_flow.sql`

---

## 🎉 完了

このSQLを実行後、予約申し込みが正常に動作するようになります！

---

**最終更新**: 2025年12月9日
