-- ============================================================================
-- 既存予約データの移行スクリプト
-- ============================================================================
-- 実行日: 2025年12月5日
-- 目的: 既存の appointments に user_id を設定する
-- ============================================================================

-- ============================================================================
-- 1. 現在の状況確認
-- ============================================================================

-- user_id が NULL の予約を確認
SELECT
  id,
  requested_by,
  employee_name,
  employee_id,
  user_id,
  status,
  created_at
FROM public.appointments
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- ============================================================================
-- 2. データ移行（オプション1: requested_by を user_id にコピー）
-- ============================================================================
-- これは「法人担当者が予約した」場合に有効
-- 新しい仕組みでは「利用者本人が予約する」ため、
-- requested_by = 法人担当者 だが、user_id = 利用者本人 とする必要がある

-- まず、requested_by を user_id にコピー（暫定措置）
UPDATE public.appointments
SET user_id = requested_by
WHERE user_id IS NULL
  AND requested_by IS NOT NULL;

-- 結果確認
SELECT
  COUNT(*) as total_appointments,
  COUNT(user_id) as appointments_with_user_id,
  COUNT(*) - COUNT(user_id) as appointments_without_user_id
FROM public.appointments;

-- ============================================================================
-- 3. データ移行（オプション2: employee_name から利用者を特定して設定）
-- ============================================================================
-- これは「employee_name と一致する users.full_name を探す」方法
-- 注意: 同姓同名がいる場合は手動確認が必要

/*
-- employee_name から users を検索して user_id を設定
WITH user_mapping AS (
  SELECT
    a.id as appointment_id,
    u.id as user_id,
    a.employee_name,
    u.full_name,
    a.company_id,
    u.company_id as user_company_id
  FROM public.appointments a
  LEFT JOIN public.users u
    ON u.full_name = a.employee_name
    AND u.company_id = a.company_id
    AND u.role = 'company_user'
  WHERE a.user_id IS NULL
)
UPDATE public.appointments
SET user_id = user_mapping.user_id
FROM user_mapping
WHERE appointments.id = user_mapping.appointment_id
  AND user_mapping.user_id IS NOT NULL;
*/

-- ============================================================================
-- 4. データ移行（オプション3: テスト環境なら全削除）
-- ============================================================================
-- テスト環境で既存データが不要な場合のみ実行

/*
-- 全ての予約を削除（注意: 本番環境では実行しないこと！）
TRUNCATE public.appointments CASCADE;

-- 関連する空き枠のステータスをリセット
UPDATE public.available_slots
SET status = 'available'
WHERE status IN ('pending', 'booked');
*/

-- ============================================================================
-- 5. データ整合性チェック
-- ============================================================================

-- user_id が NULL の予約を確認
SELECT
  id,
  user_id,
  requested_by,
  employee_name,
  company_id,
  status
FROM public.appointments
WHERE user_id IS NULL;

-- user_id が存在するが、users テーブルに該当ユーザーがいない予約を確認
SELECT
  a.id,
  a.user_id,
  a.employee_name,
  u.full_name as user_full_name
FROM public.appointments a
LEFT JOIN public.users u ON a.user_id = u.id
WHERE a.user_id IS NOT NULL
  AND u.id IS NULL;

-- company_id と user.company_id が一致しない予約を確認
SELECT
  a.id,
  a.company_id as appointment_company_id,
  u.company_id as user_company_id,
  a.employee_name,
  u.full_name
FROM public.appointments a
JOIN public.users u ON a.user_id = u.id
WHERE a.company_id != u.company_id;

-- ============================================================================
-- 完了
-- ============================================================================
-- 次のステップ:
-- 1. 上記のクエリを実行して結果を確認
-- 2. 必要に応じて手動でデータを修正
-- 3. 全ての予約に user_id が設定されたことを確認
-- ============================================================================
