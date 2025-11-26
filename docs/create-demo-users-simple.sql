-- ============================================================================
-- デモユーザー作成（シンプル版）
-- ============================================================================
-- このSQLはトリガーとpublic.usersテーブルのみを設定します
-- 実際のユーザーはSupabase Dashboardから作成してください
-- ============================================================================

-- ============================================================================
-- STEP 1: Auth Users自動作成トリガー
-- ============================================================================

-- トリガー関数の作成
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
    role = EXCLUDED.role;
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
-- STEP 2: 既存のデモユーザーを削除（クリーンアップ）
-- ============================================================================

-- public.usersから削除（auth.usersは自動的にカスケード削除される）
DELETE FROM public.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');

-- ============================================================================
-- 完了 - 次のステップ
-- ============================================================================
--
-- このSQLを実行したら、Supabase Dashboardでユーザーを作成してください:
-- https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/auth/users
--
-- 「Add user」→「Create new user」をクリックして以下を作成:
--
-- 1. 管理者ユーザー
--    Email: admin@demo.com
--    Password: demo123
--    User Metadata (JSON):
--    {
--      "full_name": "管理者 太郎",
--      "role": "admin"
--    }
--    ✓ Auto Confirm User にチェック
--
-- 2. 整体師ユーザー
--    Email: therapist@demo.com
--    Password: demo123
--    User Metadata (JSON):
--    {
--      "full_name": "整体師 花子",
--      "role": "therapist"
--    }
--    ✓ Auto Confirm User にチェック
--
-- 3. 法人担当者ユーザー
--    Email: company@demo.com
--    Password: demo123
--    User Metadata (JSON):
--    {
--      "full_name": "法人担当 次郎",
--      "role": "company_user"
--    }
--    ✓ Auto Confirm User にチェック
--
-- トリガーによって自動的にpublic.usersテーブルにレコードが作成されます！
-- ============================================================================
