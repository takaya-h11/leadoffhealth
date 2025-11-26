-- ============================================================================
-- 法人担当者のcompany_id設定
-- ============================================================================

-- 法人担当者ユーザーの状態を確認
SELECT
  id,
  email,
  full_name,
  role,
  company_id,
  is_active
FROM public.users
WHERE email = 'company@demo.com';

-- 既存の法人を確認
SELECT id, name FROM public.companies ORDER BY created_at;

-- 法人担当者にcompany_idを設定（最初の法人を割り当て）
UPDATE public.users
SET company_id = (SELECT id FROM public.companies ORDER BY created_at LIMIT 1)
WHERE email = 'company@demo.com';

-- 結果を確認
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.company_id,
  c.name as company_name
FROM public.users u
LEFT JOIN public.companies c ON u.company_id = c.id
WHERE u.email = 'company@demo.com';

-- ============================================================================
-- 完了！
-- ============================================================================
