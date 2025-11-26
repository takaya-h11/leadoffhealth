-- slot_id=8の確認
SELECT 
  id,
  therapist_id,
  service_menu_id,
  start_time,
  end_time,
  status
FROM available_slots
WHERE id = 8;
