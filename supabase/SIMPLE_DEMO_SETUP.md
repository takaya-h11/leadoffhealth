# 超シンプルなデモセットアップ

**所要時間: 5分**

## 手順

### Step 1: スキーマとデモ法人を作成

Supabase SQL Editorで以下を実行：

```sql
-- スキーマ変更マイグレーション全体を実行
-- migrations/20250103000000_change_to_numeric_ids.sql の内容をコピペ
```

そして：

```sql
-- デモ法人を作成
INSERT INTO public.companies (id, name, address, phone, email, contract_start_date, contract_end_date, is_active, notes)
VALUES
  (100001, '株式会社サンプル商事', '東京都千代田区丸の内1-1-1', '03-1234-5678', 'sample@example.com', '2025-01-01', '2025-12-31', true, 'デモ用法人データ'),
  (100002, '株式会社テスト工業', '東京都港区虎ノ門2-2-2', '03-2345-6789', 'test@example.com', '2025-01-01', '2025-12-31', true, 'デモ用法人データ2')
ON CONFLICT (id) DO NOTHING;

SELECT setval('companies_id_seq', 100002, true);
```

### Step 2: Supabase Authでデモユーザーを作成

**Authentication > Users** に移動し、「Add user」→「Create new user」をクリック。

以下の3ユーザーを作成：

#### 1. 管理者
- Email: `admin@demo.com`
- Password: `demo123`
- **Auto Confirm User: ✅ 必ずチェック**

#### 2. 整体師
- Email: `therapist@demo.com`
- Password: `demo123`
- **Auto Confirm User: ✅ 必ずチェック**

#### 3. 法人担当者
- Email: `company@demo.com`
- Password: `demo123`
- **Auto Confirm User: ✅ 必ずチェック**

### Step 3: User UIDをコピー

Authentication > Users で作成した各ユーザーをクリックし、**User UID** をコピー。

### Step 4: public.usersテーブルにデータを追加

SQL Editorで以下を実行（`YOUR_xxx_UUID` を実際のUser UIDに置き換える）：

```sql
-- 管理者
INSERT INTO public.users (id, email, full_name, role, company_id, phone, is_active, must_change_password)
VALUES
  ('YOUR_ADMIN_UUID', 'admin@demo.com', '管理者 太郎', 'admin', NULL, '090-1111-1111', true, false)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id;

-- 整体師
INSERT INTO public.users (id, email, full_name, role, company_id, phone, is_active, must_change_password)
VALUES
  ('YOUR_THERAPIST_UUID', 'therapist@demo.com', '整体師 花子', 'therapist', NULL, '090-2222-2222', true, false)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id;

-- 整体師の追加情報
INSERT INTO public.therapists (user_id, license_number, specialties, bio, is_available)
VALUES
  ('YOUR_THERAPIST_UUID', 'PT-12345', ARRAY['肩こり', '腰痛', '頭痛'], '理学療法士として10年の経験があります。', true)
ON CONFLICT (user_id) DO UPDATE SET
  license_number = EXCLUDED.license_number,
  specialties = EXCLUDED.specialties,
  bio = EXCLUDED.bio;

-- 法人担当者
INSERT INTO public.users (id, email, full_name, role, company_id, phone, is_active, must_change_password)
VALUES
  ('YOUR_COMPANY_USER_UUID', 'company@demo.com', '法人担当 次郎', 'company_user', 100001, '090-3333-3333', true, false)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id;
```

### Step 5: ログインテスト

http://localhost:3002/login にアクセスして、開発者用デモログインボタンをクリック！

## デモユーザー情報

| ロール | メール | パスワード | 氏名 | 法人ID |
|--------|--------|-----------|------|--------|
| 管理者 | admin@demo.com | demo123 | 管理者 太郎 | - |
| 整体師 | therapist@demo.com | demo123 | 整体師 花子 | - |
| 法人担当者 | company@demo.com | demo123 | 法人担当 次郎 | 100001 |

## トラブルシューティング

### ログインできない場合

1. **Authentication > Users** で該当ユーザーが「Confirmed」になっているか確認
2. **Auto Confirm User** にチェックを入れたか確認
3. public.usersテーブルにデータが入っているか確認：

```sql
SELECT id, email, role FROM public.users WHERE email LIKE '%@demo.com';
```

### 管理者メニューが表示されない

```sql
-- roleを確認
SELECT id, email, role FROM public.users WHERE email = 'admin@demo.com';

-- roleが間違っている場合は修正
UPDATE public.users SET role = 'admin' WHERE email = 'admin@demo.com';
```

## 注意事項

- このセットアップは**開発環境専用**です
- 本番環境ではデモユーザーを削除してください
- パスワードは必ず変更してください
