-- ============================================================================
-- available_slotsテーブルの実際のステータスを直接確認
-- ============================================================================

-- 1. スロット97, 98の実際のステータスを確認
SELECT
  id,
  therapist_id,
  service_menu_id,
  start_time,
  end_time,
  status,  -- ← 実際のステータス
  company_id,
  created_at,
  updated_at
FROM public.available_slots
WHERE id IN (97, 98)
ORDER BY id;

-- 2. ビューとテーブルの比較
SELECT
  'VIEW' as source,
  slot_id,
  slot_status
FROM public.calendar_slots_for_users
WHERE slot_id IN (97, 98)
UNION ALL
SELECT
  'TABLE' as source,
  id as slot_id,
  status as slot_status
FROM public.available_slots
WHERE id IN (97, 98)
ORDER BY slot_id, source;

-- 3. 全てのスロットのステータス分布
SELECT
  status,
  COUNT(*) as count
FROM public.available_slots
GROUP BY status
ORDER BY status;
