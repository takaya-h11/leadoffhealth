-- ============================================================================
-- ユーザーロール問題のデバッグSQL
-- ============================================================================

-- 現在ログインしているユーザーのIDを確認
-- （Supabase Dashboardで最後にログインしたユーザーを確認してください）

-- すべてのデモユーザーの情報を確認
SELECT
  'auth.users' as table_name,
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'role' as metadata_role,
  au.email_confirmed_at,
  au.created_at
FROM auth.users au
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')

UNION ALL

SELECT
  'public.users' as table_name,
  pu.id,
  pu.email,
  pu.full_name,
  pu.role as metadata_role,
  NULL as email_confirmed_at,
  pu.created_at
FROM public.users pu
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')

ORDER BY table_name, email;

-- auth.usersとpublic.usersのIDが一致しているか確認
SELECT
  au.email,
  au.id as auth_id,
  pu.id as public_id,
  CASE WHEN au.id = pu.id THEN 'OK' ELSE 'NG - ID mismatch!' END as id_match,
  au.raw_user_meta_data->>'role' as auth_role,
  pu.role as public_role,
  CASE WHEN (au.raw_user_meta_data->>'role') = pu.role THEN 'OK' ELSE 'NG - Role mismatch!' END as role_match
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
ORDER BY au.email;

-- public.usersテーブルのRLS（Row Level Security）を確認
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
WHERE tablename = 'users';
