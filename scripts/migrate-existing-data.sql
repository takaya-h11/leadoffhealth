-- ============================================================================
-- 既存データ移行スクリプト
-- ============================================================================
-- このスクリプトをSupabase SQL Editorで実行してください
-- 注意: 実行前に必ずバックアップを取得してください！
-- ============================================================================

-- ============================================================================
-- ステップ1: 現状確認
-- ============================================================================

SELECT
  '=== ステップ1: 現状確認 ===' as step;

SELECT
  COUNT(*) as total_appointments,
  COUNT(user_id) as appointments_with_user_id,
  COUNT(*) - COUNT(user_id) as appointments_without_user_id,
  COUNT(DISTINCT company_id) as affected_companies
FROM public.appointments
WHERE user_id IS NULL;

-- ============================================================================
-- ステップ2: データ移行（オプション1: requested_by をコピー）
-- ============================================================================

SELECT
  '=== ステップ2: データ移行開始 ===' as step,
  '既存の予約の user_id に requested_by をコピーします' as action;

-- user_id が NULL で requested_by が存在する予約を更新
UPDATE public.appointments
SET user_id = requested_by
WHERE user_id IS NULL
  AND requested_by IS NOT NULL;

-- 結果確認
SELECT
  '=== 移行結果 ===' as result;

SELECT
  COUNT(*) as total_appointments,
  COUNT(user_id) as appointments_with_user_id,
  COUNT(*) - COUNT(user_id) as still_without_user_id
FROM public.appointments;

-- ============================================================================
-- ステップ3: データ整合性チェック
-- ============================================================================

SELECT
  '=== ステップ3: データ整合性チェック ===' as step;

-- 1. user_id が NULL の予約が残っていないか確認
SELECT
  '--- user_id が NULL の予約（要対応） ---' as check_item;

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

-- 2. user_id が存在するが、users テーブルに該当ユーザーがいない予約を確認
SELECT
  '--- user_id が無効な予約（要対応） ---' as check_item;

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

-- 3. company_id の整合性確認
SELECT
  '--- company_id が不整合な予約（要確認） ---' as check_item;

SELECT
  a.id,
  a.company_id as appointment_company_id,
  u.company_id as user_company_id,
  c1.name as appointment_company,
  c2.name as user_company
FROM public.appointments a
JOIN public.users u ON a.user_id = u.id
LEFT JOIN public.companies c1 ON a.company_id = c1.id
LEFT JOIN public.companies c2 ON u.company_id = c2.id
WHERE a.company_id IS DISTINCT FROM u.company_id
LIMIT 10;

-- ============================================================================
-- ステップ4: 統計情報
-- ============================================================================

SELECT
  '=== ステップ4: 統計情報 ===' as step;

-- 予約の統計
SELECT
  '--- 予約の統計 ---' as stats_item;

SELECT
  status,
  COUNT(*) as count,
  COUNT(user_id) as count_with_user_id,
  COUNT(*) - COUNT(user_id) as count_without_user_id
FROM public.appointments
GROUP BY status
ORDER BY status;

-- 空き枠の統計
SELECT
  '--- 空き枠の統計 ---' as stats_item;

SELECT
  status,
  COUNT(*) as count,
  COUNT(company_id) as count_with_company_id,
  COUNT(*) - COUNT(company_id) as count_public_slots
FROM public.available_slots
GROUP BY status
ORDER BY status;

-- 利用者アカウントの統計
SELECT
  '--- ユーザーの統計 ---' as stats_item;

SELECT
  role,
  COUNT(*) as count,
  COUNT(company_id) as count_with_company
FROM public.users
GROUP BY role
ORDER BY role;

-- ============================================================================
-- 完了メッセージ
-- ============================================================================

SELECT
  '=== データ移行完了 ===' as result,
  '上記のチェック結果を確認してください。' as message,
  'エラーがなければ、次は動作確認テストを実施してください。' as next_step;
