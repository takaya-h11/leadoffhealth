# クイックデモセットアップ

このガイドでは、デモユーザーを最速でセットアップする方法を説明します。

## 手順

### 1. Supabaseダッシュボードを開く

https://supabase.com/dashboard にアクセスし、プロジェクトを開きます。

### 2. SQL Editorで以下のスクリプトを実行

**SQL Editor** を開き、「New Query」をクリックして以下のSQLを実行します：

```sql
-- ============================================================================
-- デモユーザークイックセットアップ
-- ============================================================================

-- Step 1: デモ法人を作成（数値ID: 100001, 100002）
INSERT INTO public.companies (id, name, address, phone, email, contract_start_date, contract_end_date, is_active, notes)
VALUES
  (100001, '株式会社サンプル商事', '東京都千代田区丸の内1-1-1', '03-1234-5678', 'sample@example.com', '2025-01-01', '2025-12-31', true, 'デモ用法人データ'),
  (100002, '株式会社テスト工業', '東京都港区虎ノ門2-2-2', '03-2345-6789', 'test@example.com', '2025-01-01', '2025-12-31', true, 'デモ用法人データ2')
ON CONFLICT (id) DO NOTHING;

-- シーケンスをリセット
SELECT setval('companies_id_seq', 100002, true);

-- Step 2: 施術メニューと症状マスターの確認（既に存在する場合はスキップ）
INSERT INTO public.symptoms (name, display_order) VALUES
  ('肩こり', 1),
  ('腰痛', 2),
  ('頭痛', 3),
  ('首痛', 4)
ON CONFLICT (name) DO NOTHING;

-- 施術メニュー（30分単位 9900円）
INSERT INTO public.service_menus (name, duration_minutes, price, description) VALUES
  ('基本整体 30分', 30, 9900, '30分コース'),
  ('基本整体 60分', 60, 19800, '60分コース（30分×2）'),
  ('基本整体 90分', 90, 29700, '90分コース（30分×3）'),
  ('基本整体 120分', 120, 39600, '120分コース（30分×4）')
ON CONFLICT DO NOTHING;

-- Step 3: この後、Authentication > Users でデモユーザーを作成してください
```

### 3. SQL Editorでデモユーザーを作成

**SQL Editor** で以下のSQLを実行（Supabase Authに直接ユーザーを作成）：

```sql
-- ============================================================================
-- デモユーザーをauth.usersに作成（固定UUIDで作成）
-- ============================================================================

-- 管理者ユーザー
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000101',
  'authenticated',
  'authenticated',
  'admin@demo.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 整体師ユーザー
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000102',
  'authenticated',
  'authenticated',
  'therapist@demo.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 法人担当者ユーザー
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000103',
  'authenticated',
  'authenticated',
  'company@demo.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- auth.identitiesテーブルにもエントリを追加
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000101', '{"sub":"00000000-0000-0000-0000-000000000101","email":"admin@demo.com"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000102', '{"sub":"00000000-0000-0000-0000-000000000102","email":"therapist@demo.com"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000103', '{"sub":"00000000-0000-0000-0000-000000000103","email":"company@demo.com"}', 'email', NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- public.usersテーブルにデモユーザー情報を追加（法人ID: 100001を使用）
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

-- therapistsテーブルに整体師情報を追加
INSERT INTO public.therapists (user_id, license_number, specialties, bio, is_available)
VALUES
  ('00000000-0000-0000-0000-000000000102', 'PT-12345', ARRAY['肩こり', '腰痛', '頭痛'], '理学療法士として10年の経験があります。', true)
ON CONFLICT (user_id) DO UPDATE SET
  license_number = EXCLUDED.license_number,
  specialties = EXCLUDED.specialties,
  bio = EXCLUDED.bio,
  is_available = EXCLUDED.is_available;
```

### 4. ログインテスト

http://localhost:3002/login にアクセスして、「開発者用デモログイン」セクションから各ロールでログインできることを確認します。

## トラブルシューティング

### 「デモユーザーでログインできませんでした」と表示される

1. **Authentication > Users** で該当ユーザーが「Confirmed」になっているか確認
2. **Auto Confirm User** にチェックを入れ忘れていないか確認
3. パスワードが `demo123` で正しく設定されているか確認

### ログインできるがエラーが出る

1. **SQL Editor** で以下を実行してデータを確認：

```sql
SELECT * FROM public.users WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');
```

2. データが正しく入っていない場合、Step 5のSQLを再実行

### 管理者メニューが表示されない

1. usersテーブルのroleカラムが 'admin' になっているか確認：

```sql
SELECT id, email, role FROM public.users WHERE email = 'admin@demo.com';
```

2. roleが間違っている場合は修正：

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'admin@demo.com';
```

## セットアップ完了後

以下の機能をテストできます：

- **管理者**: 法人管理、全データ閲覧
- **整体師**: 全施術履歴閲覧（今後実装予定: 空き枠管理、予約承認）
- **法人担当者**: 自社データ閲覧（今後実装予定: 予約申込）
