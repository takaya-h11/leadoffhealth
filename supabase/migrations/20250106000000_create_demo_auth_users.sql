-- ============================================================================
-- デモユーザーのauth.usersレコード作成
-- ============================================================================
-- このスクリプトはSupabaseの内部auth.usersテーブルにデモユーザーを作成します
-- パスワードは全て 'demo123' です
-- ============================================================================

-- 注意: auth.users テーブルへの直接INSERTは通常推奨されません
-- 本番環境ではSupabase Auth APIを使用してください
-- これは開発環境専用のスクリプトです

-- パスワード 'demo123' のハッシュを生成
-- Supabaseはbcryptを使用しているため、以下のハッシュは 'demo123' に対応
-- この値は pg_crypto の crypt() 関数で生成可能

-- 既存のデモユーザーを削除（もし存在する場合）
DELETE FROM auth.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');

-- デモユーザーをauth.usersに作成
-- パスワードハッシュは Supabase が使用する形式に従う
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
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  updated_at = NOW();

-- auth.identitiesテーブルにもレコードを追加
INSERT INTO auth.identities (
  id,
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
    '{"sub":"00000000-0000-0000-0000-000000000101","email":"admin@demo.com"}',
    'email',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000102',
    '{"sub":"00000000-0000-0000-0000-000000000102","email":"therapist@demo.com"}',
    'email',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000103',
    '{"sub":"00000000-0000-0000-0000-000000000103","email":"company@demo.com"}',
    'email',
    NOW(),
    NOW(),
    NOW()
  )
ON CONFLICT (id, provider) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  updated_at = NOW();

-- public.usersテーブルのレコードは既に20250102000000_demo_users.sqlで作成済み
-- トリガーによって自動的に作成されるはずですが、念のため再実行
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
