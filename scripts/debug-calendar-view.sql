-- ============================================================================
-- カレンダービューのデバッグ用SQLスクリプト
-- ============================================================================

-- 1. calendar_slots_for_users ビューの確認
SELECT
  slot_id,
  appointment_id,
  appointment_status,
  slot_status,
  therapist_name,
  company_name,
  user_name,
  requested_by,
  start_time,
  end_time
FROM public.calendar_slots_for_users
WHERE start_time >= NOW()
ORDER BY start_time
LIMIT 10;

-- 2. available_slotsテーブルの生データ確認
SELECT
  id,
  therapist_id,
  service_menu_id,
  start_time,
  end_time,
  status,
  company_id,
  created_at
FROM public.available_slots
WHERE start_time >= NOW()
ORDER BY start_time
LIMIT 10;

-- 3. appointmentsテーブルの生データ確認
SELECT
  a.id,
  a.slot_id,
  a.company_id,
  a.user_id,
  a.requested_by,
  a.status,
  a.employee_name,
  a.employee_id,
  c.name as company_name,
  u.full_name as user_name
FROM public.appointments a
LEFT JOIN public.companies c ON a.company_id = c.id
LEFT JOIN public.users u ON a.user_id = u.id
WHERE a.created_at >= NOW() - INTERVAL '7 days'
ORDER BY a.created_at DESC
LIMIT 10;

-- 4. ビューとテーブルの整合性チェック
SELECT
  s.id as slot_id,
  s.status as slot_status,
  a.id as appointment_id,
  a.status as appointment_status,
  a.user_id,
  a.requested_by,
  c.name as company_name,
  u.full_name as user_name
FROM public.available_slots s
LEFT JOIN public.appointments a ON s.id = a.slot_id
LEFT JOIN public.companies c ON a.company_id = c.id
LEFT JOIN public.users u ON a.user_id = u.id
WHERE s.start_time >= NOW()
ORDER BY s.start_time
LIMIT 10;

-- 5. RLSポリシーの確認（company_userの権限で見える範囲）
-- 注: この部分は実際のユーザーIDで置き換えてください
-- SET LOCAL ROLE TO 'authenticated';
-- SET LOCAL request.jwt.claims TO '{"sub": "your-user-id-here"}';

-- 6. calendar_slots_for_usersビューの定義を確認
SELECT
  pg_get_viewdef('public.calendar_slots_for_users'::regclass, true) as view_definition;
