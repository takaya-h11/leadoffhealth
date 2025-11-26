-- ============================================================================
-- デモユーザー作成スクリプト
-- ============================================================================
-- このスクリプトは開発用のデモユーザーを作成します
-- パスワードは全て 'demo123' です
-- ============================================================================

-- デモ法人を作成（数値IDに変更）
INSERT INTO public.companies (id, name, address, phone, email, contract_start_date, contract_end_date, is_active, notes)
VALUES
  (100001, '株式会社サンプル商事', '東京都千代田区丸の内1-1-1', '03-1234-5678', 'sample@example.com', '2025-01-01', '2025-12-31', true, 'デモ用法人データ'),
  (100002, '株式会社テスト工業', '東京都港区虎ノ門2-2-2', '03-2345-6789', 'test@example.com', '2025-01-01', '2025-12-31', true, 'デモ用法人データ2')
ON CONFLICT (id) DO NOTHING;

-- シーケンスをリセット（次に自動採番されるIDが100003以降になるように）
SELECT setval('companies_id_seq', 100002, true);

-- ============================================================================
-- デモユーザーをauth.usersに作成
-- ============================================================================
-- 注意: これらのユーザーは Supabase Auth に手動で作成する必要があります
-- または、以下のSQLをSupabase SQLエディタで実行してください
-- ============================================================================

-- 管理者ユーザー (admin@demo.com / demo123)
-- ID: 00000000-0000-0000-0000-000000000101

-- 整体師ユーザー (therapist@demo.com / demo123)
-- ID: 00000000-0000-0000-0000-000000000102

-- 法人担当者ユーザー (company@demo.com / demo123)
-- ID: 00000000-0000-0000-0000-000000000103

-- ============================================================================
-- public.usersテーブルにデモユーザー情報を追加
-- ============================================================================
-- 注意: 上記のauth.usersが作成された後に実行してください
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
-- therapistsテーブルに整体師情報を追加
-- ============================================================================
INSERT INTO public.therapists (user_id, license_number, specialties, bio, is_available)
VALUES
  ('00000000-0000-0000-0000-000000000102', 'PT-12345', ARRAY['肩こり', '腰痛', '頭痛'], '理学療法士として10年の経験があります。', true)
ON CONFLICT (user_id) DO UPDATE SET
  license_number = EXCLUDED.license_number,
  specialties = EXCLUDED.specialties,
  bio = EXCLUDED.bio,
  is_available = EXCLUDED.is_available;
