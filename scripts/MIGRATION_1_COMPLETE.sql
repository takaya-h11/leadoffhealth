-- ============================================================================
-- マイグレーション1: 予約フロー再設計（完全版・エラー修正済み）
-- ============================================================================
-- このファイルを Supabase SQL Editor で実行してください
-- ============================================================================

-- ステップ1: appointments.user_id カラムを追加
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT;

-- ステップ2: appointments.status のデフォルト値を変更
ALTER TABLE public.appointments
  ALTER COLUMN status SET DEFAULT 'approved';

-- ステップ2.1: employee_name と employee_id の NOT NULL 制約を削除
-- （新しい予約フローでは user_id を使用するため）
ALTER TABLE public.appointments
  ALTER COLUMN employee_name DROP NOT NULL;

ALTER TABLE public.appointments
  ALTER COLUMN employee_id DROP NOT NULL;

-- ステップ3: トリガー関数を作成（自動承認）
CREATE OR REPLACE FUNCTION public.auto_approve_appointment()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status := 'approved';
  UPDATE public.available_slots SET status = 'booked' WHERE id = NEW.slot_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ステップ4: トリガー関数を作成（キャンセル時スロット解放）
CREATE OR REPLACE FUNCTION public.release_slot_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.available_slots SET status = 'available' WHERE id = NEW.slot_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ステップ5: トリガーを作成（自動承認）
DROP TRIGGER IF EXISTS auto_approve_appointment_trigger ON public.appointments;
CREATE TRIGGER auto_approve_appointment_trigger
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_appointment();

-- ステップ6: トリガーを作成（キャンセル時スロット解放）
DROP TRIGGER IF EXISTS release_slot_on_cancel_trigger ON public.appointments;
CREATE TRIGGER release_slot_on_cancel_trigger
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
  EXECUTE FUNCTION public.release_slot_on_cancel();

-- ステップ7: 既存のビューを削除（エラー回避）
DROP VIEW IF EXISTS public.calendar_slots_for_users CASCADE;
DROP VIEW IF EXISTS public.calendar_slots_for_staff CASCADE;

-- ステップ8: ビューを作成（利用者向けカレンダー）
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

-- ステップ9: ビューを作成（スタッフ向けカレンダー）
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

-- 完了メッセージ
SELECT '✅ マイグレーション1完了！' as status;
