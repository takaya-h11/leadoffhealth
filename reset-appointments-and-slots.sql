-- ============================================================================
-- 予約データと空き枠データを全削除（テスト用）
-- ============================================================================
-- 警告: このスクリプトは本番環境では実行しないでください！
-- ============================================================================

-- 1. 通知を削除（appointments参照があるため先に削除）
DELETE FROM public.notifications
WHERE appointment_id IS NOT NULL;

-- 2. 施術記録を削除（appointments参照があるため先に削除）
DELETE FROM public.treatment_records;

-- 3. 予約を全削除
DELETE FROM public.appointments;

-- 4. 空き枠を全削除
DELETE FROM public.available_slots;

-- 確認用: 削除後の件数を表示
SELECT 'appointments' as table_name, COUNT(*) as count FROM public.appointments
UNION ALL
SELECT 'available_slots', COUNT(*) FROM public.available_slots
UNION ALL
SELECT 'treatment_records', COUNT(*) FROM public.treatment_records
UNION ALL
SELECT 'notifications (with appointment_id)', COUNT(*) FROM public.notifications WHERE appointment_id IS NOT NULL;
