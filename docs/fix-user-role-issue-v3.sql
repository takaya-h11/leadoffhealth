-- ============================================================================
-- ユーザーロール問題の修正SQL (v3 - provider_id対応版)
-- ============================================================================
-- このSQLをSupabase SQL Editorで実行してください:
-- https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/sql/new
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
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, true)
  );
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
-- STEP 2: デモユーザーのauth.usersレコード作成
-- ============================================================================

-- 既存のデモユーザーを削除（もし存在する場合）
DELETE FROM auth.identities
WHERE provider = 'email' AND user_id IN (
  SELECT id FROM auth.users WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
);

DELETE FROM auth.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');

-- デモユーザーをauth.usersに作成
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES
  -- 管理者ユーザー (admin@demo.com / demo123)
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000000',
    'admin@demo.com',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"管理者 太郎","role":"admin"}',
    false,
    'authenticated',
    'authenticated'
  ),
  -- 整体師ユーザー (therapist@demo.com / demo123)
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000000',
    'therapist@demo.com',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"整体師 花子","role":"therapist"}',
    false,
    'authenticated',
    'authenticated'
  ),
  -- 法人担当者ユーザー (company@demo.com / demo123)
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000000',
    'company@demo.com',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"法人担当 次郎","role":"company_user"}',
    false,
    'authenticated',
    'authenticated'
  );

-- auth.identitiesテーブルにもレコードを追加
-- provider_id は user_id と同じ値を使用
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000101',
    jsonb_build_object(
      'sub', '00000000-0000-0000-0000-000000000101',
      'email', 'admin@demo.com',
      'email_verified', true,
      'provider', 'email'
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000102',
    jsonb_build_object(
      'sub', '00000000-0000-0000-0000-000000000102',
      'email', 'therapist@demo.com',
      'email_verified', true,
      'provider', 'email'
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000103',
    jsonb_build_object(
      'sub', '00000000-0000-0000-0000-000000000103',
      'email', 'company@demo.com',
      'email_verified', true,
      'provider', 'email'
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

-- ============================================================================
-- STEP 3: public.usersテーブルのレコードを確実に作成
-- ============================================================================

INSERT INTO public.users (id, email, full_name, role, company_id, phone, is_active, must_change_password)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'admin@demo.com', '管理者 太郎', 'admin', NULL, '090-1111-1111', true, false),
  ('00000000-0000-0000-0000-000000000102', 'therapist@demo.com', '整体師 花子', 'therapist', NULL, '090-2222-2222', true, false),
  ('00000000-0000-0000-0000-000000000103', 'company@demo.com', '法人担当 次郎', 'company_user', 100001, '090-3333-3333', true, false)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active,
  must_change_password = EXCLUDED.must_change_password;

-- ============================================================================
-- STEP 4: 確認クエリ
-- ============================================================================

-- auth.users の確認
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
ORDER BY email;

-- auth.identities の確認
SELECT provider_id, user_id, provider, identity_data->>'email' as email
FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
)
ORDER BY identity_data->>'email';

-- public.users の確認
SELECT id, email, full_name, role, company_id, is_active
FROM public.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
ORDER BY email;

-- ============================================================================
-- 実行完了
-- ============================================================================
-- これでログインできるはずです:
-- - admin@demo.com / demo123 (管理者)
-- - therapist@demo.com / demo123 (整体師)
-- - company@demo.com / demo123 (法人担当者)
-- ============================================================================
