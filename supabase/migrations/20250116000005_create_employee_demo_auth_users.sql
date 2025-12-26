-- ============================================================================
-- 整体利用者デモユーザーのauth.usersレコード作成
-- ============================================================================
-- employee@demo.com と employee2@demo.com のauth.usersレコードを作成
-- パスワードは全て 'demo123' です
-- ============================================================================

-- 注意: auth.users テーブルへの直接INSERTは通常推奨されません
-- 本番環境ではSupabase Auth APIを使用してください
-- これは開発環境専用のスクリプトです

-- 既存の整体利用者デモユーザーを削除（もし存在する場合）
DELETE FROM auth.users
WHERE email IN ('employee@demo.com', 'employee2@demo.com');

-- 整体利用者デモユーザーをauth.usersに作成
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
  -- 整体利用者1 (employee@demo.com / demo123) - 次郎さん - 会社ID: 100001
  (
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000000',
    'employee@demo.com',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"次郎さん（デモ利用者）","role":"employee"}',
    false,
    'authenticated',
    'authenticated'
  ),
  -- 整体利用者2 (employee2@demo.com / demo123) - 三郎さん - 会社ID: 100002
  (
    '00000000-0000-0000-0000-000000000105',
    '00000000-0000-0000-0000-000000000000',
    'employee2@demo.com',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"三郎さん（デモ利用者2）","role":"employee"}',
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
-- Note: auth.identitiesのプライマリキーは(provider, id)またはidのみの可能性があるため
-- 既存レコードがあれば削除してから挿入
DELETE FROM auth.identities
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000105'
);

INSERT INTO auth.identities (
  provider_id,
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000104',
    '{"sub":"00000000-0000-0000-0000-000000000104","email":"employee@demo.com"}',
    'email',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000105',
    '00000000-0000-0000-0000-000000000105',
    '00000000-0000-0000-0000-000000000105',
    '{"sub":"00000000-0000-0000-0000-000000000105","email":"employee2@demo.com"}',
    'email',
    NOW(),
    NOW(),
    NOW()
  );

-- public.usersテーブルにもレコードを作成
INSERT INTO public.users (id, email, full_name, role, company_id, is_active, must_change_password)
VALUES
  ('00000000-0000-0000-0000-000000000104', 'employee@demo.com', '次郎さん（デモ利用者）', 'employee', '100001', true, false),
  ('00000000-0000-0000-0000-000000000105', 'employee2@demo.com', '三郎さん（デモ利用者2）', 'employee', '100002', true, false)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id,
  is_active = EXCLUDED.is_active,
  must_change_password = EXCLUDED.must_change_password,
  updated_at = NOW();

-- 確認用コメント
COMMENT ON TABLE public.users IS 'Users table with roles: admin, therapist, company_user, employee. Demo employees: employee@demo.com (次郎さん, company 100001), employee2@demo.com (三郎さん, company 100002)';
