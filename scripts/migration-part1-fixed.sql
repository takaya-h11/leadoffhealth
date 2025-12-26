-- ============================================================================
-- 予約フロー再設計マイグレーション（修正版）
-- ============================================================================
-- エラーが発生した場合、このファイルを使用してください
-- ============================================================================

-- ============================================================================
-- パート1: テーブル変更とコメント（エラーが起きにくい部分）
-- ============================================================================

-- 1. users テーブルのコメント更新
COMMENT ON COLUMN public.users.role IS 'admin: 管理者, therapist: 整体師, company_user: 整体利用者（個別アカウント）';

-- 2. appointments テーブルの変更
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.appointments.user_id IS '予約した利用者のID（company_userロールのユーザー）';
COMMENT ON COLUMN public.appointments.requested_by IS '非推奨: 予約を申し込んだユーザー（今後はuser_idを使用）';
COMMENT ON COLUMN public.appointments.employee_name IS '非推奨: 今後はusers.full_nameを参照';
COMMENT ON COLUMN public.appointments.employee_id IS '非推奨: 今後はusers.idを参照';

ALTER TABLE public.appointments
  ALTER COLUMN status SET DEFAULT 'approved';

COMMENT ON COLUMN public.appointments.status IS 'approved: 予約確定, cancelled: キャンセル, completed: 施術完了（pending/rejectedは廃止）';
COMMENT ON COLUMN public.appointments.rejected_reason IS '非推奨: 拒否機能廃止のため使用しない';

-- 3. available_slots のステータス更新
COMMENT ON COLUMN public.available_slots.status IS 'available: 予約可能, booked: 予約確定, cancelled: キャンセル済み（pendingは廃止）';

-- 4. 通知タイプの更新
COMMENT ON COLUMN public.notifications.type IS 'appointment_approved: 予約確定, appointment_cancelled: 予約キャンセル, reminder: リマインド（appointment_requested/rejectedは廃止）';

SELECT 'パート1完了: テーブル変更とコメント更新' as status;
