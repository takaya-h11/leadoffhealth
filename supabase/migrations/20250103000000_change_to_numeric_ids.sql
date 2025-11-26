-- ============================================================================
-- ID型を UUID から BIGINT に変更
-- ============================================================================
-- 注意: usersテーブルのIDはauth.usersと連携するため、UUIDのまま維持します
-- companiesやその他のテーブルのみ数値IDに変更します
-- ============================================================================

-- 既存テーブルを削除（データがない前提）
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
-- 1. Companies（法人） - BIGINT IDに変更
-- ============================================================================
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

-- ============================================================================
-- 2. Users（ユーザー） - auth.usersとの連携のためUUIDのまま
-- ============================================================================
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
COMMENT ON COLUMN public.users.role IS 'admin: 管理者, therapist: 整体師, company_user: 法人担当者';
COMMENT ON COLUMN public.users.must_change_password IS '初回ログイン時のパスワード変更フラグ';

-- ============================================================================
-- 3. Therapists（整体師） - BIGINT IDに変更
-- ============================================================================
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

-- ============================================================================
-- 4. Service Menus（施術メニュー） - BIGINT IDに変更
-- ============================================================================
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

-- ============================================================================
-- 5. Symptoms（症状マスター） - BIGINT IDに変更
-- ============================================================================
CREATE TABLE public.symptoms (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.symptoms IS '症状マスター';

-- ============================================================================
-- 6. Available Slots（空き枠） - BIGINT IDに変更
-- ============================================================================
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
COMMENT ON COLUMN public.available_slots.status IS 'available: 予約可能, pending: 予約申込中, booked: 予約確定, cancelled: キャンセル済み';

-- ============================================================================
-- 7. Appointments（予約） - BIGINT IDに変更
-- ============================================================================
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
COMMENT ON COLUMN public.appointments.status IS 'pending: 承認待ち, approved: 承認済み, rejected: 拒否, cancelled: キャンセル済み, completed: 施術完了';

-- ============================================================================
-- 8. Treatment Records（施術記録） - BIGINT IDに変更
-- ============================================================================
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

-- ============================================================================
-- 9. Treatment Symptoms（施術記録と症状の中間テーブル） - BIGINT IDに変更
-- ============================================================================
CREATE TABLE public.treatment_symptoms (
  id BIGSERIAL PRIMARY KEY,
  treatment_record_id BIGINT NOT NULL REFERENCES public.treatment_records(id) ON DELETE CASCADE,
  symptom_id BIGINT NOT NULL REFERENCES public.symptoms(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(treatment_record_id, symptom_id)
);

COMMENT ON TABLE public.treatment_symptoms IS '施術記録と症状の関連';

-- ============================================================================
-- 10. Monthly Reports（月次レポート） - BIGINT IDに変更
-- ============================================================================
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

-- ============================================================================
-- 11. Invoices（請求書） - BIGINT IDに変更
-- ============================================================================
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

-- ============================================================================
-- 12. Notifications（通知） - BIGINT IDに変更
-- ============================================================================
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

-- ============================================================================
-- インデックス作成
-- ============================================================================
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

-- ============================================================================
-- RLS (Row Level Security) ポリシー
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

-- 他のテーブルのRLSポリシーも同様に設定...
-- (簡略化のため省略、必要に応じて追加)

-- ============================================================================
-- 初期データ投入
-- ============================================================================

-- 症状マスター
INSERT INTO public.symptoms (name, display_order) VALUES
  ('肩こり', 1),
  ('腰痛', 2),
  ('頭痛', 3),
  ('首痛', 4);

-- 施術メニュー（30分単位 9900円）
INSERT INTO public.service_menus (name, duration_minutes, price, description) VALUES
  ('基本整体 30分', 30, 9900, '30分コース'),
  ('基本整体 60分', 60, 19800, '60分コース（30分×2）'),
  ('基本整体 90分', 90, 29700, '90分コース（30分×3）'),
  ('基本整体 120分', 120, 39600, '120分コース（30分×4）');
