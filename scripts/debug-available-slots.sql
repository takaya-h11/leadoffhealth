-- ============================================================================
-- available_slotsテーブルの直接確認スクリプト
-- ============================================================================
-- 目的: appointment recordが存在しないのに"booked"状態のslotを特定

-- 1. 問題のスロット（97, 98）の詳細確認
SELECT
  id,
  therapist_id,
  service_menu_id,
  start_time,
  end_time,
  status,
  company_id,
  created_at,
  updated_at
FROM public.available_slots
WHERE id IN (97, 98)
ORDER BY id;

-- 2. 全てのスロットのステータス分布を確認
SELECT
  status,
  COUNT(*) as count
FROM public.available_slots
GROUP BY status
ORDER BY status;

-- 3. 'booked' または 'pending' ステータスだが対応するappointmentが存在しないスロットを検出
SELECT
  s.id as slot_id,
  s.therapist_id,
  s.start_time,
  s.end_time,
  s.status as slot_status,
  s.company_id,
  a.id as appointment_id,
  a.status as appointment_status
FROM public.available_slots s
LEFT JOIN public.appointments a ON s.id = a.slot_id AND a.status != 'cancelled'
WHERE s.status IN ('booked', 'pending')
  AND a.id IS NULL
ORDER BY s.start_time;

-- 4. スロットIDとappointmentの対応関係を全件確認
SELECT
  s.id as slot_id,
  s.status as slot_status,
  s.start_time,
  a.id as appointment_id,
  a.status as appointment_status,
  a.employee_name,
  c.name as company_name
FROM public.available_slots s
LEFT JOIN public.appointments a ON s.id = a.slot_id
LEFT JOIN public.companies c ON a.company_id = c.id
WHERE s.start_time >= NOW()
ORDER BY s.start_time
LIMIT 20;

-- 5. 予約申込エラーログから確認（スロット97, 98が実際にどう使われているか）
SELECT
  s.id as slot_id,
  s.status,
  s.start_time,
  COUNT(a.id) as appointment_count,
  STRING_AGG(a.status, ', ') as appointment_statuses
FROM public.available_slots s
LEFT JOIN public.appointments a ON s.id = a.slot_id
WHERE s.id IN (97, 98)
GROUP BY s.id, s.status, s.start_time;
