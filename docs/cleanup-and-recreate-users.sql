-- ============================================================================
-- デモユーザーのクリーンアップと再作成
-- ============================================================================
-- このSQLは既存のデモユーザーを完全に削除してから、
-- トリガーを設定します
-- ============================================================================

-- ============================================================================
-- STEP 1: 既存のデモユーザーを完全に削除
-- ============================================================================

-- まず、関連する全てのテーブルから削除
-- therapistsテーブルから削除（もし存在する場合）
DELETE FROM public.therapists
WHERE user_id IN (
  SELECT id FROM public.users
  WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
);

-- public.usersから削除
DELETE FROM public.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');

-- auth.identitiesから削除
DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
);

-- auth.usersから削除
DELETE FROM auth.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');

-- ============================================================================
-- STEP 2: Auth Users自動作成トリガー
-- ============================================================================

-- トリガー関数の作成（既存の場合は上書き）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, is_active, must_change_password)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'company_user'),
    true,
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- トリガーの作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'auth.usersに新規ユーザーが作成されたときにpublic.usersテーブルにレコードを自動作成';

-- ============================================================================
-- STEP 3: 確認クエリ
-- ============================================================================

-- 削除されたことを確認（結果が0件であればOK）
SELECT 'auth.users count' as check_type, COUNT(*) as count
FROM auth.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
UNION ALL
SELECT 'public.users count' as check_type, COUNT(*) as count
FROM public.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
UNION ALL
SELECT 'auth.identities count' as check_type, COUNT(*) as count
FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
);

-- ============================================================================
-- 実行完了
-- ============================================================================
--
-- このSQLを実行したら、Supabase Dashboard > Authentication > Users で
-- デモユーザーを作成してください:
-- https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/auth/users
--
-- 【重要】「Add user」→「Create new user」をクリックして以下を作成:
--
-- ============================================================================
-- 1. 管理者ユーザー
-- ============================================================================
-- Email: admin@demo.com
-- Password: demo123
-- User Metadata (JSONを入力):
-- {
--   "full_name": "管理者 太郎",
--   "role": "admin"
-- }
-- ✓ Auto Confirm User にチェックを入れる
--
-- ============================================================================
-- 2. 整体師ユーザー
-- ============================================================================
-- Email: therapist@demo.com
-- Password: demo123
-- User Metadata (JSONを入力):
-- {
--   "full_name": "整体師 花子",
--   "role": "therapist"
-- }
-- ✓ Auto Confirm User にチェックを入れる
--
-- ============================================================================
-- 3. 法人担当者ユーザー
-- ============================================================================
-- Email: company@demo.com
-- Password: demo123
-- User Metadata (JSONを入力):
-- {
--   "full_name": "法人担当 次郎",
--   "role": "company_user"
-- }
-- ✓ Auto Confirm User にチェックを入れる
--
-- ============================================================================
-- 注意事項
-- ============================================================================
-- - User Metadataは必ずJSON形式で入力してください
-- - Auto Confirm User にチェックを入れないとメール確認が必要になります
-- - トリガーによってpublic.usersテーブルに自動的にレコードが作成されます
-- - 整体師ユーザーの場合、therapistsテーブルのレコードは後で手動で作成してください
-- ============================================================================
