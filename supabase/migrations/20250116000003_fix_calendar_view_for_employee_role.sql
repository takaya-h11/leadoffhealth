-- Fix calendar_slots_for_users view to recognize employee role
-- The view was only checking for company_user role, causing employees
-- to not see their own company's booking details

DROP VIEW IF EXISTS public.calendar_slots_for_users;

CREATE OR REPLACE VIEW public.calendar_slots_for_users AS
SELECT
  s.id as slot_id,
  s.therapist_id,
  s.service_menu_id,
  s.start_time,
  s.end_time,
  s.status as slot_status,
  th.user_id as therapist_user_id,
  tu.full_name as therapist_name,
  sm.name as service_menu_name,
  sm.duration_minutes,
  sm.price,
  a.id as appointment_id,
  a.status as appointment_status,
  -- 自社の予約のみ法人名と利用者名を表示
  -- company_user または employee ロールの場合、同じ会社の予約は詳細表示
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.users cu
      WHERE cu.id = auth.uid()
        AND cu.company_id = a.company_id
        AND cu.role IN ('company_user', 'employee')
    ) THEN c.name
    WHEN a.id IS NOT NULL THEN '予約済み'
    ELSE NULL
  END as company_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.users cu
      WHERE cu.id = auth.uid()
        AND cu.company_id = a.company_id
        AND cu.role IN ('company_user', 'employee')
    ) THEN u.full_name
    ELSE NULL
  END as user_name
FROM public.available_slots s
LEFT JOIN public.therapists th ON s.therapist_id = th.id
LEFT JOIN public.users tu ON th.user_id = tu.id
LEFT JOIN public.service_menus sm ON s.service_menu_id = sm.id
LEFT JOIN public.appointments a ON s.id = a.slot_id
LEFT JOIN public.companies c ON a.company_id = c.id
LEFT JOIN public.users u ON a.user_id = u.id;

-- ビューへのRLS設定
ALTER VIEW public.calendar_slots_for_users SET (security_invoker = true);

COMMENT ON VIEW public.calendar_slots_for_users IS '利用者向けカレンダービュー（他社の個人情報は非表示、company_user と employee の両方に対応）';
