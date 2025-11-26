-- 重複予約のクリーンアップ

-- ステップ1: 重複している予約を確認
SELECT
  slot_id,
  COUNT(*) as appointment_count,
  array_agg(id ORDER BY created_at) as appointment_ids,
  array_agg(status ORDER BY created_at) as statuses,
  array_agg(created_at ORDER BY created_at) as created_dates
FROM appointments
GROUP BY slot_id
HAVING COUNT(*) > 1;

-- ステップ2: 重複している予約のうち、古い方を削除
-- 注意: これは最初の予約（created_atが最も古い）を残して、他を削除します
WITH ranked_appointments AS (
  SELECT
    id,
    slot_id,
    status,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY slot_id ORDER BY created_at ASC) as rn
  FROM appointments
)
DELETE FROM appointments
WHERE id IN (
  SELECT id
  FROM ranked_appointments
  WHERE rn > 1
);

-- ステップ3: 空き枠のステータスを修正
-- pending状態の空き枠で、対応する予約がない場合はavailableに戻す
UPDATE available_slots
SET
  status = 'available',
  updated_at = NOW()
WHERE status = 'pending'
  AND id NOT IN (
    SELECT slot_id
    FROM appointments
    WHERE status IN ('pending', 'approved')
  );

-- ステップ4: 確認クエリ
-- 重複がないことを確認
SELECT
  slot_id,
  COUNT(*) as count
FROM appointments
GROUP BY slot_id
HAVING COUNT(*) > 1;

-- 空き枠のステータスと予約の整合性を確認
SELECT
  s.id as slot_id,
  s.status as slot_status,
  COUNT(a.id) as appointment_count,
  array_agg(a.status) as appointment_statuses
FROM available_slots s
LEFT JOIN appointments a ON s.id = a.slot_id
GROUP BY s.id, s.status
HAVING
  (s.status = 'available' AND COUNT(a.id) > 0) OR
  (s.status IN ('pending', 'booked') AND COUNT(a.id) = 0);
