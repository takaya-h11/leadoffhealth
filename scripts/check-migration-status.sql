-- ============================================================================
-- マイグレーション状態の簡易チェック
-- ============================================================================
-- エラーが発生した場合、マイグレーションが適用されていない可能性があります
-- ============================================================================

-- 1. appointments テーブルに user_id カラムが存在するか
SELECT
  '=== appointments.user_id の確認 ===' as check_item,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'appointments'
        AND column_name = 'user_id'
    ) THEN '✅ 存在します'
    ELSE '❌ 存在しません（マイグレーション未実施）'
  END as result;

-- 2. available_slots テーブルに company_id カラムが存在するか
SELECT
  '=== available_slots.company_id の確認 ===' as check_item,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'available_slots'
        AND column_name = 'company_id'
    ) THEN '✅ 存在します'
    ELSE '❌ 存在しません（マイグレーション未実施）'
  END as result;

-- 3. appointments.status のデフォルト値を確認
SELECT
  '=== appointments.status のデフォルト値 ===' as check_item,
  column_default as current_default,
  CASE
    WHEN column_default LIKE '%approved%' THEN '✅ approved（正しい）'
    WHEN column_default LIKE '%pending%' THEN '⚠️ pending（旧デフォルト値）'
    ELSE '❓ 不明'
  END as result
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'appointments'
  AND column_name = 'status';

-- 4. ビューの存在確認
SELECT
  '=== calendar_slots_for_users ビュー ===' as check_item,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_views
      WHERE schemaname = 'public'
        AND viewname = 'calendar_slots_for_users'
    ) THEN '✅ 存在します'
    ELSE '❌ 存在しません（マイグレーション未実施）'
  END as result;

SELECT
  '=== calendar_slots_for_staff ビュー ===' as check_item,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_views
      WHERE schemaname = 'public'
        AND viewname = 'calendar_slots_for_staff'
    ) THEN '✅ 存在します'
    ELSE '❌ 存在しません（マイグレーション未実施）'
  END as result;

-- 5. トリガーの存在確認
SELECT
  '=== auto_approve_appointment_trigger ===' as check_item,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND trigger_name = 'auto_approve_appointment_trigger'
    ) THEN '✅ 存在します'
    ELSE '❌ 存在しません（マイグレーション未実施）'
  END as result;

SELECT
  '=== release_slot_on_cancel_trigger ===' as check_item,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND trigger_name = 'release_slot_on_cancel_trigger'
    ) THEN '✅ 存在します'
    ELSE '❌ 存在しません（マイグレーション未実施）'
  END as result;

-- 6. available_slots の RLS ポリシー確認
SELECT
  '=== available_slots RLS ポリシー ===' as check_item,
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) >= 2 THEN '✅ 新しいポリシーが設定されています'
    ELSE '⚠️ ポリシーが少ない（要確認）'
  END as result
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'available_slots'
  AND policyname IN (
    '管理者と整体師は全枠を閲覧可能',
    '法人担当者は公開枠と自社専用枠を閲覧可能'
  );

-- ============================================================================
-- 結論
-- ============================================================================

SELECT
  '=== 結論 ===' as section,
  CASE
    WHEN (
      -- すべての条件をチェック
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'user_id')
      AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'available_slots' AND column_name = 'company_id')
      AND EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'calendar_slots_for_users')
      AND EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'calendar_slots_for_staff')
      AND EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name = 'auto_approve_appointment_trigger')
      AND EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name = 'release_slot_on_cancel_trigger')
    ) THEN '✅ マイグレーション完了（すべて正常）'
    ELSE '❌ マイグレーション未完了（要実施）'
  END as result,
  '上記の ❌ 項目を確認してください' as next_action;
