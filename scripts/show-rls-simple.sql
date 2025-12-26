-- ============================================================================
-- RLSポリシーの簡易確認
-- ============================================================================

-- 方法1: pg_policiesビューを使用（最もシンプル）
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'available_slots'
ORDER BY cmd, policyname
LIMIT 100;
