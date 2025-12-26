-- ============================================================================
-- ビューエラーの修正
-- ============================================================================
-- エラー: cannot drop columns from view
-- 解決策: 既存のビューを削除してから再作成
-- ============================================================================

-- 既存のビューを削除（存在する場合）
DROP VIEW IF EXISTS public.calendar_slots_for_users CASCADE;
DROP VIEW IF EXISTS public.calendar_slots_for_staff CASCADE;

SELECT '✅ 既存のビューを削除しました' as status;

-- ビューを再作成（利用者向け）- シンプル版
CREATE VIEW public.calendar_slots_for_users AS
SELECT
  s.id as slot_id,
  s.start_time,
  s.end_time,
  s.status,
  s.therapist_id,
  s.service_menu_id,
  a.id as appointment_id,
  a.company_id,
  a.user_id as appointment_user_id
FROM public.available_slots s
LEFT JOIN public.appointments a ON s.id = a.slot_id AND a.status IN ('approved', 'completed');

SELECT '✅ カレンダービュー（利用者向け）を作成しました' as status;

-- ビューを再作成（スタッフ向け）- シンプル版
CREATE VIEW public.calendar_slots_for_staff AS
SELECT
  s.id as slot_id,
  s.start_time,
  s.end_time,
  s.status,
  s.therapist_id,
  s.service_menu_id,
  a.id as appointment_id,
  a.company_id,
  a.user_id as appointment_user_id,
  a.symptoms,
  a.notes
FROM public.available_slots s
LEFT JOIN public.appointments a ON s.id = a.slot_id AND a.status IN ('approved', 'completed');

SELECT '✅ カレンダービュー（スタッフ向け）を作成しました' as status;

SELECT '🎉 ビューエラー修正完了！' as final_status;
