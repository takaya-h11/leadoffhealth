-- ============================================================================
-- 現在ログイン中のユーザー情報確認
-- ============================================================================

SELECT
  id as user_id,
  email,
  role,
  company_id as user_company_id
FROM public.users
WHERE id = auth.uid()
LIMIT 100;
