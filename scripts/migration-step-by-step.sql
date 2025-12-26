-- ============================================================================
-- マイグレーション: ステップバイステップ版
-- ============================================================================
-- 各ステップを個別に実行してください
-- エラーが発生したら、そのステップをスキップして次に進んでください
-- ============================================================================

-- ============================================================================
-- ステップ1: appointments.user_id カラムを追加
-- ============================================================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT;

-- ✅ 確認: 以下のクエリを実行して user_id が追加されたことを確認
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'user_id';

SELECT '✅ ステップ1完了: user_id カラム追加' as status;

-- ============================================================================
-- ステップ2: appointments.status のデフォルト値を変更
-- ============================================================================

ALTER TABLE public.appointments
  ALTER COLUMN status SET DEFAULT 'approved';

SELECT '✅ ステップ2完了: status デフォルト値変更' as status;

-- ============================================================================
-- ステップ3: トリガー関数を作成（自動承認）
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_approve_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- 予約作成時に自動的に approved に設定
  NEW.status := 'approved';

  -- スロットを booked に変更
  UPDATE public.available_slots
  SET status = 'booked'
  WHERE id = NEW.slot_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ ステップ3完了: 自動承認トリガー関数作成' as status;

-- ============================================================================
-- ステップ4: トリガー関数を作成（キャンセル時スロット解放）
-- ============================================================================

CREATE OR REPLACE FUNCTION public.release_slot_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- キャンセル時にスロットを available に戻す
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.available_slots
    SET status = 'available'
    WHERE id = NEW.slot_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ ステップ4完了: キャンセル時スロット解放関数作成' as status;

-- ============================================================================
-- ステップ5: トリガーを作成（自動承認）
-- ============================================================================

DROP TRIGGER IF EXISTS auto_approve_appointment_trigger ON public.appointments;

CREATE TRIGGER auto_approve_appointment_trigger
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_appointment();

SELECT '✅ ステップ5完了: 自動承認トリガー作成' as status;

-- ============================================================================
-- ステップ6: トリガーを作成（キャンセル時スロット解放）
-- ============================================================================

DROP TRIGGER IF EXISTS release_slot_on_cancel_trigger ON public.appointments;

CREATE TRIGGER release_slot_on_cancel_trigger
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
  EXECUTE FUNCTION public.release_slot_on_cancel();

SELECT '✅ ステップ6完了: キャンセル時スロット解放トリガー作成' as status;

-- ============================================================================
-- ステップ7: ビューを作成（利用者向けカレンダー）- 簡易版
-- ============================================================================

CREATE OR REPLACE VIEW public.calendar_slots_for_users AS
SELECT
  s.id as slot_id,
  s.start_time,
  s.end_time,
  s.status,
  s.therapist_id,
  s.service_menu_id,
  -- 予約情報（存在する場合）
  a.id as appointment_id,
  a.company_id,
  a.user_id as appointment_user_id
FROM public.available_slots s
LEFT JOIN public.appointments a ON s.id = a.slot_id AND a.status IN ('approved', 'completed');

SELECT '✅ ステップ7完了: カレンダービュー（利用者向け）作成' as status;

-- ============================================================================
-- ステップ8: ビューを作成（スタッフ向けカレンダー）- 簡易版
-- ============================================================================

CREATE OR REPLACE VIEW public.calendar_slots_for_staff AS
SELECT
  s.id as slot_id,
  s.start_time,
  s.end_time,
  s.status,
  s.therapist_id,
  s.service_menu_id,
  -- 予約情報（すべて表示）
  a.id as appointment_id,
  a.company_id,
  a.user_id as appointment_user_id,
  a.symptoms,
  a.notes
FROM public.available_slots s
LEFT JOIN public.appointments a ON s.id = a.slot_id AND a.status IN ('approved', 'completed');

SELECT '✅ ステップ8完了: カレンダービュー（スタッフ向け）作成' as status;

-- ============================================================================
-- 完了メッセージ
-- ============================================================================

SELECT '🎉 マイグレーション1完了！次はマイグレーション2を実行してください' as final_status;
