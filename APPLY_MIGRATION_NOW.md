# 緊急: データベースマイグレーションを実行してください

## 問題
予約をキャンセルした後、同じ枠を再予約できないバグが発生しています。

## 原因
`appointments` テーブルの `slot_id` カラムに UNIQUE 制約があり、キャンセル済みの予約レコードが残っているため、同じ slot_id で新しい予約を作成できません。

## 解決方法
以下の SQL をSupabase ダッシュボードで実行してください。

### 手順

1. Supabase ダッシュボードを開く
   https://supabase.com/dashboard

2. プロジェクトを選択

3. 左メニューから「SQL Editor」をクリック

4. 「New Query」ボタンをクリック

5. 以下の SQL をコピー&ペーストして実行:

```sql
-- Fix slot_id unique constraint to allow re-booking cancelled slots
-- Drop the existing UNIQUE constraint on slot_id
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_slot_id_key;

-- Create a partial unique index that only applies to non-cancelled appointments
-- This allows multiple cancelled appointments for the same slot, but prevents duplicate active appointments
CREATE UNIQUE INDEX appointments_slot_id_active_unique
ON public.appointments(slot_id)
WHERE status != 'cancelled';
```

6. 「Run」ボタンをクリック

## 実行後の確認

実行が成功すると、以下のメッセージが表示されます:
- `Success. No rows returned`

または、エラーなく完了します。

## 効果

この変更により:
- ✅ キャンセル済みの予約は履歴として残る
- ✅ キャンセル済みの枠を再予約できる
- ✅ 同じ枠に複数のアクティブな予約は作成できない（重複防止）

## トラブルシューティング

もしエラーが発生した場合:
1. 制約名が違う可能性があります。以下のSQLで確認:
```sql
SELECT conname
FROM pg_constraint
WHERE conrelid = 'public.appointments'::regclass
AND contype = 'u';
```

2. 正しい制約名を使って再実行してください。
