-- ============================================================================
-- RLSポリシーの詳細確認
-- ============================================================================

-- 1. available_slotsテーブルのRLSポリシー一覧
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
ORDER BY policyname;

-- 2. 現在のユーザーで実際にスロット97を見れるか確認
SELECT
  id,
  status,
  start_time,
  company_id,
  created_at
FROM public.available_slots
WHERE id = 97;

-- 3. 現在のユーザー情報を確認
SELECT
  id,
  email,
  role,
  company_id
FROM public.users
WHERE id = auth.uid();

-- 4. スロット97を更新できるか試す（DRY RUN - 実際には更新しない）
-- この部分はコメントアウト。実際に試す場合はBEGIN; ... ROLLBACK;で囲む
-- BEGIN;
-- UPDATE public.available_slots
-- SET status = 'booked'
-- WHERE id = 97 AND status = 'available';
-- SELECT * FROM public.available_slots WHERE id = 97;
-- ROLLBACK;
