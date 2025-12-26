-- ============================================================================
-- 孤立したスロット（appointmentが存在しないのにbooked/pending）の修正スクリプト
-- ============================================================================

-- STEP 1: 問題の診断 - appointmentが存在しないのにbooked/pendingのスロットを検出
SELECT
  s.id as slot_id,
  s.status as slot_status,
  s.start_time,
  s.end_time,
  s.company_id,
  s.created_at,
  s.updated_at,
  a.id as appointment_id
FROM public.available_slots s
LEFT JOIN public.appointments a ON s.id = a.slot_id AND a.status != 'cancelled'
WHERE s.status IN ('booked', 'pending')
  AND a.id IS NULL
ORDER BY s.start_time;

-- STEP 2: 影響範囲の確認（何件のスロットが孤立しているか）
SELECT
  COUNT(*) as orphaned_slots_count
FROM public.available_slots s
LEFT JOIN public.appointments a ON s.id = a.slot_id AND a.status != 'cancelled'
WHERE s.status IN ('booked', 'pending')
  AND a.id IS NULL;

-- STEP 3: 孤立スロットをavailableに戻す（FIX）
-- ⚠️ このクエリを実行する前に、STEP 1とSTEP 2の結果を確認してください
UPDATE public.available_slots
SET
  status = 'available',
  updated_at = NOW()
WHERE id IN (
  SELECT s.id
  FROM public.available_slots s
  LEFT JOIN public.appointments a ON s.id = a.slot_id AND a.status != 'cancelled'
  WHERE s.status IN ('booked', 'pending')
    AND a.id IS NULL
);

-- STEP 4: 修正結果の確認
SELECT
  s.id as slot_id,
  s.status as slot_status,
  s.start_time,
  a.id as appointment_id,
  a.status as appointment_status
FROM public.available_slots s
LEFT JOIN public.appointments a ON s.id = a.slot_id AND a.status != 'cancelled'
WHERE s.id IN (97, 98)
ORDER BY s.id;

-- STEP 5: 全スロットのステータス分布を再確認
SELECT
  status,
  COUNT(*) as count
FROM public.available_slots
GROUP BY status
ORDER BY status;
