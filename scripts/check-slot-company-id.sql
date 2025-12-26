-- ============================================================================
-- スロット97, 98のcompany_id確認
-- ============================================================================

-- 1. スロット97, 98の詳細（company_idを含む）
SELECT
  id,
  therapist_id,
  status,
  company_id,  -- ← 法人専用空き枠かどうか
  start_time,
  created_at,
  updated_at
FROM public.available_slots
WHERE id IN (97, 98)
ORDER BY id;

-- 2. 現在ログイン中のユーザーのcompany_id
SELECT
  id as user_id,
  email,
  role,
  company_id as user_company_id
FROM public.users
WHERE id = auth.uid();

-- 3. スロットのcompany_idとユーザーのcompany_idを比較
SELECT
  s.id as slot_id,
  s.company_id as slot_company_id,
  u.company_id as user_company_id,
  CASE
    WHEN s.company_id IS NULL THEN '全法人向け空き枠'
    WHEN s.company_id = u.company_id THEN '自社専用空き枠（予約可能）'
    ELSE '他社専用空き枠（予約不可）'
  END as slot_type
FROM public.available_slots s
CROSS JOIN (
  SELECT company_id FROM public.users WHERE id = auth.uid()
) u
WHERE s.id IN (97, 98)
ORDER BY s.id;
