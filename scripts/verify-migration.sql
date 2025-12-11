-- ============================================================================
-- マイグレーション確認スクリプト
-- ============================================================================
-- このスクリプトをSupabase SQL Editorで実行してください
-- https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/sql
-- ============================================================================

-- ============================================================================
-- 1. appointments テーブルのスキーマ確認
-- ============================================================================

SELECT
  '=== appointments テーブルのカラム確認 ===' as section;

SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'appointments'
  AND column_name IN ('user_id', 'status', 'employee_name', 'employee_id')
ORDER BY column_name;

-- ============================================================================
-- 2. available_slots テーブルのスキーマ確認
-- ============================================================================

SELECT
  '=== available_slots テーブルのカラム確認 ===' as section;

SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'available_slots'
  AND column_name IN ('company_id', 'status')
ORDER BY column_name;

-- ============================================================================
-- 3. 外部キー制約の確認
-- ============================================================================

SELECT
  '=== 外部キー制約の確認 ===' as section;

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (
    (tc.table_name = 'appointments' AND kcu.column_name = 'user_id')
    OR (tc.table_name = 'available_slots' AND kcu.column_name = 'company_id')
  )
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 4. ビューの確認
-- ============================================================================

SELECT
  '=== ビューの存在確認 ===' as section;

SELECT
  viewname,
  viewowner
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('calendar_slots_for_users', 'calendar_slots_for_staff')
ORDER BY viewname;

-- ============================================================================
-- 5. トリガーの確認
-- ============================================================================

SELECT
  '=== トリガーの存在確認 ===' as section;

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('auto_approve_appointment_trigger', 'release_slot_on_cancel_trigger')
ORDER BY trigger_name;

-- ============================================================================
-- 6. RLSポリシーの確認
-- ============================================================================

SELECT
  '=== available_slots のRLSポリシー確認 ===' as section;

SELECT
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'available_slots'
ORDER BY policyname;

-- ============================================================================
-- 7. インデックスの確認
-- ============================================================================

SELECT
  '=== インデックスの確認 ===' as section;

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'available_slots'
  AND indexname LIKE '%company_id%'
ORDER BY indexname;

-- ============================================================================
-- 8. 既存データの状態確認
-- ============================================================================

SELECT
  '=== appointments テーブルのデータ状態 ===' as section;

SELECT
  status,
  COUNT(*) as total_count,
  COUNT(user_id) as count_with_user_id,
  COUNT(*) - COUNT(user_id) as count_without_user_id,
  COUNT(DISTINCT company_id) as unique_companies
FROM public.appointments
GROUP BY status
ORDER BY status;

SELECT
  '=== available_slots テーブルのデータ状態 ===' as section;

SELECT
  status,
  COUNT(*) as total_count,
  COUNT(company_id) as count_with_company_id,
  COUNT(*) - COUNT(company_id) as count_public_slots
FROM public.available_slots
GROUP BY status
ORDER BY status;

-- ============================================================================
-- 9. user_id が NULL の予約を確認
-- ============================================================================

SELECT
  '=== user_id が NULL の予約（要対応） ===' as section;

SELECT
  id,
  requested_by,
  employee_name,
  employee_id,
  status,
  created_at
FROM public.appointments
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 10. データ整合性チェック
-- ============================================================================

SELECT
  '=== user_id が存在しないユーザーを参照している予約 ===' as section;

SELECT
  a.id,
  a.user_id,
  a.employee_name,
  a.status
FROM public.appointments a
LEFT JOIN public.users u ON a.user_id = u.id
WHERE a.user_id IS NOT NULL
  AND u.id IS NULL
LIMIT 10;

SELECT
  '=== company_id の不整合チェック ===' as section;

SELECT
  a.id,
  a.company_id as appointment_company_id,
  u.company_id as user_company_id,
  c1.name as appointment_company,
  c2.name as user_company
FROM public.appointments a
LEFT JOIN public.users u ON a.user_id = u.id
LEFT JOIN public.companies c1 ON a.company_id = c1.id
LEFT JOIN public.companies c2 ON u.company_id = c2.id
WHERE a.user_id IS NOT NULL
  AND a.company_id IS DISTINCT FROM u.company_id
LIMIT 10;

-- ============================================================================
-- 完了メッセージ
-- ============================================================================

SELECT
  '=== マイグレーション確認完了 ===' as section,
  '上記の結果を確認してください。' as message,
  'user_id が NULL の予約がある場合は、データ移行が必要です。' as next_step;
