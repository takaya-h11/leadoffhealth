-- ============================================================================
-- デモユーザー作成（メタデータ後付け版）
-- ============================================================================
-- このSQLはSupabase Dashboardでユーザーを作成した後に実行してください
-- ============================================================================

-- ============================================================================
-- STEP 1: クリーンアップと前準備（前回のSQLと同じ）
-- ============================================================================

-- 既存のデモユーザーを削除
DELETE FROM public.therapists
WHERE user_id IN (
  SELECT id FROM public.users
  WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
);

DELETE FROM public.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');

DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
);

DELETE FROM auth.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');

-- ============================================================================
-- STEP 2: トリガーの設定
-- ============================================================================

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 実行完了 - ここまで実行してください
-- ============================================================================

-- ============================================================================
-- 次のステップ: Supabase Dashboardでユーザーを作成
-- ============================================================================
--
-- https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/auth/users
--
-- 「Add user」→「Create new user」をクリックして以下を作成:
--
-- 1. Email: admin@demo.com / Password: demo123 / Auto Confirm: ON
-- 2. Email: therapist@demo.com / Password: demo123 / Auto Confirm: ON
-- 3. Email: company@demo.com / Password: demo123 / Auto Confirm: ON
--
-- ※ User Metadataの入力欄がない場合は、上記だけ入力して作成してください
--
-- ============================================================================

-- ============================================================================
-- STEP 3: ユーザー作成後、このSQLを実行してメタデータを追加
-- ============================================================================

-- 管理者ユーザーのメタデータを更新
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'full_name', '管理者 太郎',
  'role', 'admin'
)
WHERE email = 'admin@demo.com';

-- 整体師ユーザーのメタデータを更新
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'full_name', '整体師 花子',
  'role', 'therapist'
)
WHERE email = 'therapist@demo.com';

-- 法人担当者ユーザーのメタデータを更新
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'full_name', '法人担当 次郎',
  'role', 'company_user'
)
WHERE email = 'company@demo.com';

-- public.usersテーブルを更新（メタデータから情報を反映）
UPDATE public.users u
SET
  full_name = (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = u.id),
  role = (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = u.id),
  updated_at = NOW()
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');

-- ============================================================================
-- STEP 4: 整体師テーブルのレコードを追加
-- ============================================================================

-- 整体師ユーザーのtherapistsテーブルレコードを作成
INSERT INTO public.therapists (user_id, license_number, specialties, bio, is_available)
SELECT
  id,
  'PT-12345',
  ARRAY['肩こり', '腰痛', '頭痛'],
  '理学療法士として10年の経験があります。',
  true
FROM public.users
WHERE email = 'therapist@demo.com'
ON CONFLICT (user_id) DO UPDATE SET
  license_number = EXCLUDED.license_number,
  specialties = EXCLUDED.specialties,
  bio = EXCLUDED.bio,
  is_available = EXCLUDED.is_available;

-- ============================================================================
-- STEP 5: 確認クエリ
-- ============================================================================

-- auth.users の確認
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'role' as role,
  email_confirmed_at
FROM auth.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
ORDER BY email;

-- public.users の確認
SELECT id, email, full_name, role, company_id, is_active
FROM public.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
ORDER BY email;

-- therapists の確認
SELECT t.id, u.email, t.license_number, t.specialties, t.is_available
FROM public.therapists t
JOIN public.users u ON t.user_id = u.id
WHERE u.email = 'therapist@demo.com';

-- ============================================================================
-- 完了！
-- ============================================================================
-- これでログインできるはずです:
-- - admin@demo.com / demo123 (管理者)
-- - therapist@demo.com / demo123 (整体師)
-- - company@demo.com / demo123 (法人担当者)
-- ============================================================================
