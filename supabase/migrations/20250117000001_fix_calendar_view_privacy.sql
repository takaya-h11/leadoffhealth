-- Fix calendar_slots_for_users view privacy filtering
-- Problem: Other companies' appointments are showing actual company names instead of "予約済み"
-- Cause: company_id comparison may be failing due to type mismatch or incorrect logic

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
  -- 自社の予約のみ法人名を表示、他社の予約は「予約済み」と表示
  CASE
    -- ログインユーザーの company_id を取得
    WHEN a.id IS NOT NULL THEN
      CASE
        WHEN (SELECT company_id FROM public.users WHERE id = auth.uid()) = a.company_id
        THEN c.name  -- 同じ会社なら法人名を表示
        ELSE '予約済み'  -- 違う会社なら「予約済み」
      END
    ELSE NULL  -- 予約がない場合は NULL
  END as company_name,
  -- 自社の予約のみ利用者名を表示
  CASE
    WHEN a.id IS NOT NULL THEN
      CASE
        WHEN (SELECT company_id FROM public.users WHERE id = auth.uid()) = a.company_id
        THEN u.full_name  -- 同じ会社なら利用者名を表示
        ELSE NULL  -- 違う会社なら NULL
      END
    ELSE NULL  -- 予約がない場合は NULL
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

COMMENT ON VIEW public.calendar_slots_for_users IS '利用者向けカレンダービュー（他社の個人情報は非表示、company_idを明示的に比較）';
