# 完全リセット＆セットアップガイド

データベースを完全にクリーンな状態にしてから、デモユーザーまで作成する手順です。

**所要時間: 10分**

---

## Step 1: すべてのテーブルとユーザーを削除

Supabase Dashboard → **SQL Editor** → **New Query** をクリックし、以下のSQLを実行：

```sql
-- ============================================================================
-- すべてのテーブルとデータを削除（完全リセット）
-- ============================================================================

-- 既存テーブルを削除（CASCADE で関連データもすべて削除）
DROP TABLE IF EXISTS public.treatment_symptoms CASCADE;
DROP TABLE IF EXISTS public.treatment_records CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.available_slots CASCADE;
DROP TABLE IF EXISTS public.therapists CASCADE;
DROP TABLE IF EXISTS public.monthly_reports CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.service_menus CASCADE;
DROP TABLE IF EXISTS public.symptoms CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- ============================================================================
-- デモユーザーをauth.usersから削除
-- ============================================================================
-- 注意: これにより既存のデモユーザーが削除されます

DELETE FROM auth.users WHERE email IN (
  'admin@demo.com',
  'therapist@demo.com',
  'company@demo.com'
);
```

実行後、「Success. 3 rows returned」のように表示されればOKです（既存ユーザーがいた場合）。
「Success. 0 rows returned」の場合は、デモユーザーが存在していなかったことを意味します。

---

## Step 2: 新しいスキーマを作成

同じSQL Editorで、以下のSQLを実行：

```sql
-- ============================================================================
-- 新しいスキーマ作成（数値ID使用）
-- ============================================================================

-- 1. Companies（法人） - BIGINT ID
CREATE TABLE public.companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.companies IS '法人情報';

-- 2. Users（ユーザー） - auth.usersと連携（UUID）
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'therapist', 'company_user')),
  company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  must_change_password BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'ユーザー情報（管理者・整体師・法人担当者）';

-- 3. Therapists（整体師）
CREATE TABLE public.therapists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  license_number TEXT,
  specialties TEXT[],
  bio TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.therapists IS '整体師の追加情報';

-- 4. Service Menus（施術メニュー）
CREATE TABLE public.service_menus (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.service_menus IS '施術メニュー';

-- 5. Symptoms（症状マスター）
CREATE TABLE public.symptoms (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.symptoms IS '症状マスター';

-- 6. Available Slots（空き枠）
CREATE TABLE public.available_slots (
  id BIGSERIAL PRIMARY KEY,
  therapist_id BIGINT NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
  service_menu_id BIGINT NOT NULL REFERENCES public.service_menus(id) ON DELETE RESTRICT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'booked', 'cancelled')),
  auto_delete_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

COMMENT ON TABLE public.available_slots IS '整体師の空き枠';

-- 7. Appointments（予約）
CREATE TABLE public.appointments (
  id BIGSERIAL PRIMARY KEY,
  slot_id BIGINT UNIQUE NOT NULL REFERENCES public.available_slots(id) ON DELETE RESTRICT,
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  employee_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  symptoms TEXT[],
  notes TEXT,
  rejected_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.appointments IS '予約情報';

-- 8. Treatment Records（施術記録）
CREATE TABLE public.treatment_records (
  id BIGSERIAL PRIMARY KEY,
  appointment_id BIGINT UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE RESTRICT,
  therapist_id BIGINT NOT NULL REFERENCES public.therapists(id) ON DELETE RESTRICT,
  treatment_content TEXT NOT NULL,
  patient_condition TEXT NOT NULL,
  improvement_level INTEGER CHECK (improvement_level BETWEEN 1 AND 5),
  satisfaction_level INTEGER CHECK (satisfaction_level BETWEEN 1 AND 5),
  actual_duration_minutes INTEGER,
  next_recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.treatment_records IS '施術記録';

-- 9. Treatment Symptoms（施術記録と症状の中間テーブル）
CREATE TABLE public.treatment_symptoms (
  id BIGSERIAL PRIMARY KEY,
  treatment_record_id BIGINT NOT NULL REFERENCES public.treatment_records(id) ON DELETE CASCADE,
  symptom_id BIGINT NOT NULL REFERENCES public.symptoms(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(treatment_record_id, symptom_id)
);

COMMENT ON TABLE public.treatment_symptoms IS '施術記録と症状の関連';

-- 10. Monthly Reports（月次レポート）
CREATE TABLE public.monthly_reports (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_appointments INTEGER NOT NULL,
  total_employees INTEGER NOT NULL,
  unique_employees INTEGER NOT NULL,
  total_duration_minutes INTEGER NOT NULL,
  average_improvement DECIMAL(3,2),
  average_satisfaction DECIMAL(3,2),
  symptom_breakdown JSONB,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, year, month)
);

COMMENT ON TABLE public.monthly_reports IS '月次健康経営レポート';

-- 11. Invoices（請求書）
CREATE TABLE public.invoices (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_amount INTEGER NOT NULL,
  appointment_count INTEGER NOT NULL,
  pdf_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, year, month)
);

COMMENT ON TABLE public.invoices IS '請求書';

-- 12. Notifications（通知）
CREATE TABLE public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('appointment_requested', 'appointment_approved', 'appointment_rejected', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  appointment_id BIGINT REFERENCES public.appointments(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS '通知';

-- インデックス作成
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_company_id ON public.users(company_id);
CREATE INDEX idx_therapists_user_id ON public.therapists(user_id);
CREATE INDEX idx_available_slots_therapist_id ON public.available_slots(therapist_id);
CREATE INDEX idx_available_slots_start_time ON public.available_slots(start_time);
CREATE INDEX idx_available_slots_status ON public.available_slots(status);
CREATE INDEX idx_appointments_slot_id ON public.appointments(slot_id);
CREATE INDEX idx_appointments_company_id ON public.appointments(company_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_treatment_records_appointment_id ON public.treatment_records(appointment_id);
CREATE INDEX idx_treatment_records_therapist_id ON public.treatment_records(therapist_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
```

実行後、「Success. No rows returned」と表示されればOKです。

---

## Step 3: RLS（Row Level Security）を設定

同じSQL Editorで、以下のSQLを実行：

```sql
-- ============================================================================
-- RLS (Row Level Security) ポリシー設定
-- ============================================================================

-- Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理者は全ての法人を閲覧可能"
  ON public.companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "管理者は法人を作成可能"
  ON public.companies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "管理者は法人を更新可能"
  ON public.companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分の情報を閲覧可能"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "ユーザーは自分の情報を更新可能"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
```

実行後、「Success. No rows returned」と表示されればOKです。

---

## Step 4: 初期データ（症状・施術メニュー）を投入

同じSQL Editorで、以下のSQLを実行：

```sql
-- ============================================================================
-- 初期データ投入
-- ============================================================================

-- 症状マスター
INSERT INTO public.symptoms (name, display_order) VALUES
  ('肩こり', 1),
  ('腰痛', 2),
  ('頭痛', 3),
  ('首痛', 4);

-- 施術メニュー（30分単位 9,900円）
INSERT INTO public.service_menus (name, duration_minutes, price, description) VALUES
  ('基本整体 30分', 30, 9900, '30分コース'),
  ('基本整体 60分', 60, 19800, '60分コース（30分×2）'),
  ('基本整体 90分', 90, 29700, '90分コース（30分×3）'),
  ('基本整体 120分', 120, 39600, '120分コース（30分×4）');
```

実行後、「Success. 8 rows returned」のように表示されればOKです。

---

## Step 5: デモ法人を作成

同じSQL Editorで、以下のSQLを実行：

```sql
-- ============================================================================
-- デモ法人作成
-- ============================================================================

INSERT INTO public.companies (id, name, address, phone, email, contract_start_date, contract_end_date, is_active, notes)
VALUES
  (100001, '株式会社サンプル商事', '東京都千代田区丸の内1-1-1', '03-1234-5678', 'sample@example.com', '2025-01-01', '2025-12-31', true, 'デモ用法人データ'),
  (100002, '株式会社テスト工業', '東京都港区虎ノ門2-2-2', '03-2345-6789', 'test@example.com', '2025-01-01', '2025-12-31', true, 'デモ用法人データ2');

-- シーケンスをリセット（次のIDが100003以降になるように）
SELECT setval('companies_id_seq', 100002, true);
```

実行後、「Success. 2 rows returned」と表示されればOKです。

---

## Step 6: デモユーザーを作成（Supabase Auth UI）

Supabase Dashboard → **Authentication** → **Users** に移動。

「**Add user**」→「**Create new user**」をクリックし、以下の3ユーザーを作成：

### ① 管理者ユーザー
- **Email**: `admin@demo.com`
- **Password**: `demo123`
- **✅ Auto Confirm User**: 必ずチェック

「Create user」をクリック。

### ② 整体師ユーザー
- **Email**: `therapist@demo.com`
- **Password**: `demo123`
- **✅ Auto Confirm User**: 必ずチェック

「Create user」をクリック。

### ③ 法人担当者ユーザー
- **Email**: `company@demo.com`
- **Password**: `demo123`
- **✅ Auto Confirm User**: 必ずチェック

「Create user」をクリック。

---

## Step 7: User UIDを確認

**Authentication** → **Users** で、作成した各ユーザーをクリックし、**User UID**（UUID）をコピーします。

例:
- 管理者: `a1b2c3d4-e5f6-7890-abcd-111111111111`
- 整体師: `b2c3d4e5-f6g7-8901-bcde-222222222222`
- 法人担当者: `c3d4e5f6-g7h8-9012-cdef-333333333333`

---

## Step 8: public.usersテーブルにユーザー情報を追加

SQL Editorに戻り、以下のSQLを実行（**`YOUR_xxx_UUID`を実際のUser UIDに置き換える**）：

```sql
-- ============================================================================
-- デモユーザー情報をpublic.usersに追加
-- ============================================================================

-- 管理者
INSERT INTO public.users (id, email, full_name, role, company_id, phone, is_active, must_change_password)
VALUES
  ('YOUR_ADMIN_UUID', 'admin@demo.com', '管理者 太郎', 'admin', NULL, '090-1111-1111', true, false);

-- 整体師
INSERT INTO public.users (id, email, full_name, role, company_id, phone, is_active, must_change_password)
VALUES
  ('YOUR_THERAPIST_UUID', 'therapist@demo.com', '整体師 花子', 'therapist', NULL, '090-2222-2222', true, false);

-- 整体師の追加情報
INSERT INTO public.therapists (user_id, license_number, specialties, bio, is_available)
VALUES
  ('YOUR_THERAPIST_UUID', 'PT-12345', ARRAY['肩こり', '腰痛', '頭痛'], '理学療法士として10年の経験があります。', true);

-- 法人担当者
INSERT INTO public.users (id, email, full_name, role, company_id, phone, is_active, must_change_password)
VALUES
  ('YOUR_COMPANY_USER_UUID', 'company@demo.com', '法人担当 次郎', 'company_user', 100001, '090-3333-3333', true, false);
```

実行後、「Success. 4 rows returned」のように表示されればOKです。

---

## Step 9: 動作確認

ブラウザで http://localhost:3002/login にアクセスし、「**開発者用デモログイン**」セクションから各ロールでログインできることを確認します。

### テスト項目:

- ✅ **管理者としてログイン** → ダッシュボードに「管理者メニュー」が表示される
- ✅ **管理者メニュー** → 「法人管理」リンクをクリック → 法人一覧が表示される
- ✅ デモ法人2社が表示される（ID: 100001, 100002）
- ✅ **整体師としてログイン** → ダッシュボードが表示される
- ✅ **法人担当者としてログイン** → ダッシュボードが表示される

---

## 完了！

これでデータベースが完全にクリーンな状態から、デモユーザーまで作成できました。

## トラブルシューティング

### ログインできない

1. **Authentication > Users** で該当ユーザーが「Confirmed」になっているか確認
2. パスワードが `demo123` で正しいか確認

### 管理者メニューが表示されない

```sql
-- roleを確認
SELECT id, email, role FROM public.users WHERE email = 'admin@demo.com';

-- roleが間違っている場合は修正
UPDATE public.users SET role = 'admin' WHERE email = 'admin@demo.com';
```

### 法人一覧が表示されない

```sql
-- 法人データを確認
SELECT * FROM public.companies;

-- データがない場合はStep 5を再実行
```

---

## データベースの状態確認

すべてのテーブルとデータを確認するSQL:

```sql
-- テーブル一覧
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 各テーブルのレコード数
SELECT 'companies' as table_name, COUNT(*) as count FROM public.companies
UNION ALL
SELECT 'users', COUNT(*) FROM public.users
UNION ALL
SELECT 'therapists', COUNT(*) FROM public.therapists
UNION ALL
SELECT 'symptoms', COUNT(*) FROM public.symptoms
UNION ALL
SELECT 'service_menus', COUNT(*) FROM public.service_menus;
```

期待される結果:
- companies: 2件
- users: 3件
- therapists: 1件
- symptoms: 4件
- service_menus: 4件
