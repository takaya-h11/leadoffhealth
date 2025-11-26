-- 重複予約の確認

-- スロット15と40の状態を確認
SELECT
  'available_slots' as table_name,
  id,
  therapist_id,
  start_time,
  end_time,
  status,
  created_at,
  updated_at
FROM available_slots
WHERE id IN ('15', '40')
ORDER BY id;

-- スロット15と40に紐づく予約を確認
SELECT
  'appointments' as table_name,
  id,
  slot_id,
  company_id,
  employee_name,
  employee_id,
  status,
  created_at,
  updated_at
FROM appointments
WHERE slot_id IN ('15', '40')
ORDER BY slot_id, created_at;

-- 重複している予約を見つける
SELECT
  slot_id,
  COUNT(*) as count,
  array_agg(id) as appointment_ids
FROM appointments
GROUP BY slot_id
HAVING COUNT(*) > 1;
