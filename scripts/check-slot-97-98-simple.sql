-- ============================================================================
-- スロット97, 98の詳細確認（シンプル版）
-- ============================================================================
-- Supabase SQL Editorで実行してください
-- 右下の「Limit」設定を「No limit」にするか、LIMITを手動で追加

-- 【最重要】スロット97, 98の実際のステータスとcompany_id
SELECT
  id,
  therapist_id,
  status,           -- ← 実際のステータス
  company_id,       -- ← 法人専用かどうか
  start_time,
  created_at,
  updated_at
FROM public.available_slots
WHERE id IN (97, 98)
ORDER BY id
LIMIT 100;
