-- ============================================================================
-- available_slotsテーブルのRLSポリシー確認
-- ============================================================================

-- RLSポリシー一覧
SELECT
  policyname,
  cmd,  -- SELECT, INSERT, UPDATE, DELETE
  qual,  -- 条件式
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'available_slots'
ORDER BY cmd, policyname;
