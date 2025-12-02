-- 通知タイプに appointment_cancelled を追加
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('appointment_requested', 'appointment_approved', 'appointment_rejected', 'appointment_cancelled', 'reminder'));
