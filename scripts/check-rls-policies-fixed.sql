-- ============================================================================
-- available_slotsテーブルのRLSポリシー確認（修正版）
-- ============================================================================

SELECT
  polname as policy_name,
  polcmd as command,
  polpermissive as permissive,
  polroles::regrole[] as roles,
  pg_get_expr(polqual, polrelid) as qual_expression,
  pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy
WHERE polrelid = 'public.available_slots'::regclass
ORDER BY polcmd, polname;
