-- slot_id=8の既存予約を確認
SELECT id, slot_id, employee_name, status 
FROM appointments 
WHERE slot_id = 8;

-- 既存の予約を削除（テスト用データのため）
DELETE FROM appointments WHERE slot_id = 8;

-- 空き枠のステータスをavailableに戻す
UPDATE available_slots 
SET status = 'available' 
WHERE id = 8;

-- 確認
SELECT id, status FROM available_slots WHERE id = 8;
