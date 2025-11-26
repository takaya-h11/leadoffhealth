-- ============================================================================
-- Lead off Health 予約管理システム - 初期スキーマ
-- ============================================================================

-- ============================================================================
-- 1. Extensions
-- ============================================================================
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 2. Companies（法人）
-- ============================================================================
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  email text,
  contract_start_date date,
  contract_end_date date,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.companies is '法人情報';

-- ============================================================================
-- 3. Users（ユーザー）
-- ============================================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('admin', 'therapist', 'company_user')),
  company_id uuid references public.companies(id) on delete set null,
  phone text,
  is_active boolean default true,
  must_change_password boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.users is 'ユーザー情報（管理者・整体師・法人担当者）';
comment on column public.users.role is 'admin: 管理者, therapist: 整体師, company_user: 法人担当者';
comment on column public.users.must_change_password is '初回ログイン時のパスワード変更フラグ';

-- ============================================================================
-- 4. Therapists（整体師）
-- ============================================================================
create table public.therapists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.users(id) on delete cascade,
  license_number text,
  specialties text[],
  bio text,
  is_available boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.therapists is '整体師の追加情報';
comment on column public.therapists.license_number is '理学療法士の資格番号';
comment on column public.therapists.specialties is '専門分野（配列）';

-- ============================================================================
-- 5. Service Menus（施術メニュー）
-- ============================================================================
create table public.service_menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes integer not null,
  price integer not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.service_menus is '施術メニュー';

-- ============================================================================
-- 6. Symptoms（症状マスター）
-- ============================================================================
create table public.symptoms (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

comment on table public.symptoms is '症状マスター';

-- ============================================================================
-- 7. Available Slots（空き枠）
-- ============================================================================
create table public.available_slots (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  service_menu_id uuid not null references public.service_menus(id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'available' check (
    status in ('available', 'pending', 'booked', 'cancelled')
  ),
  auto_delete_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint valid_time_range check (end_time > start_time)
);

comment on table public.available_slots is '整体師の空き枠';
comment on column public.available_slots.status is 'available: 予約可能, pending: 予約申込中, booked: 予約確定, cancelled: キャンセル済み';
comment on column public.available_slots.auto_delete_at is '自動削除日時（施術日時から1週間後）';

-- インデックス作成
create index idx_available_slots_therapist on public.available_slots(therapist_id);
create index idx_available_slots_status on public.available_slots(status);
create index idx_available_slots_start_time on public.available_slots(start_time);

-- ============================================================================
-- 8. Appointments（予約）
-- ============================================================================
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid unique not null references public.available_slots(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  requested_by uuid not null references public.users(id) on delete restrict,
  employee_name text not null,
  employee_id text not null,
  symptoms text[],
  notes text,
  rejected_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid references public.users(id),
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'cancelled', 'completed')
  ),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.appointments is '予約情報';
comment on column public.appointments.employee_id is '社員番号（同姓同名対策）';
comment on column public.appointments.status is 'pending: 承認待ち, approved: 承認済み, rejected: 拒否, cancelled: キャンセル, completed: 施術完了';

-- インデックス作成
create index idx_appointments_company on public.appointments(company_id);
create index idx_appointments_status on public.appointments(status);
create index idx_appointments_employee_id on public.appointments(employee_id);

-- ============================================================================
-- 9. Treatment Records（施術記録）
-- ============================================================================
create table public.treatment_records (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid unique not null references public.appointments(id) on delete restrict,
  therapist_id uuid not null references public.therapists(id) on delete restrict,
  treatment_content text not null,
  patient_condition text not null,
  improvement_level integer check (improvement_level between 1 and 5),
  satisfaction_level integer check (satisfaction_level between 1 and 5),
  actual_duration_minutes integer,
  next_recommendation text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.treatment_records is '施術記録';
comment on column public.treatment_records.improvement_level is '改善度（1-5の5段階評価）';
comment on column public.treatment_records.satisfaction_level is '満足度（1-5の5段階評価）';

-- ============================================================================
-- 10. Treatment Symptoms（施術記録と症状の中間テーブル）
-- ============================================================================
create table public.treatment_symptoms (
  id uuid primary key default gen_random_uuid(),
  treatment_record_id uuid not null references public.treatment_records(id) on delete cascade,
  symptom_id uuid not null references public.symptoms(id) on delete restrict,
  created_at timestamptz default now(),
  unique(treatment_record_id, symptom_id)
);

comment on table public.treatment_symptoms is '施術記録と症状の関連テーブル';

-- ============================================================================
-- 11. Monthly Reports（月次レポート）
-- ============================================================================
create table public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  year integer not null,
  month integer not null check (month between 1 and 12),
  total_appointments integer not null,
  total_employees integer not null,
  unique_employees integer not null,
  total_duration_minutes integer not null,
  average_improvement decimal(3,2),
  average_satisfaction decimal(3,2),
  symptom_breakdown jsonb,
  pdf_url text,
  generated_at timestamptz,
  created_at timestamptz default now(),
  unique(company_id, year, month)
);

comment on table public.monthly_reports is '月次健康経営レポート';

-- ============================================================================
-- 12. Invoices（請求書）
-- ============================================================================
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  year integer not null,
  month integer not null check (month between 1 and 12),
  total_amount integer not null,
  appointment_count integer not null,
  pdf_url text,
  issued_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(company_id, year, month)
);

comment on table public.invoices is '請求書';

-- ============================================================================
-- 13. Notifications（通知）
-- ============================================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (
    type in ('appointment_requested', 'appointment_approved', 'appointment_rejected', 'reminder')
  ),
  title text not null,
  message text not null,
  appointment_id uuid references public.appointments(id) on delete cascade,
  is_read boolean default false,
  created_at timestamptz default now()
);

comment on table public.notifications is '通知テーブル';

-- インデックス作成
create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_is_read on public.notifications(is_read);

-- ============================================================================
-- 14. Updated_at トリガー関数
-- ============================================================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- updated_atトリガーを各テーブルに設定
create trigger update_companies_updated_at before update on public.companies
  for each row execute function public.update_updated_at_column();

create trigger update_users_updated_at before update on public.users
  for each row execute function public.update_updated_at_column();

create trigger update_therapists_updated_at before update on public.therapists
  for each row execute function public.update_updated_at_column();

create trigger update_service_menus_updated_at before update on public.service_menus
  for each row execute function public.update_updated_at_column();

create trigger update_available_slots_updated_at before update on public.available_slots
  for each row execute function public.update_updated_at_column();

create trigger update_appointments_updated_at before update on public.appointments
  for each row execute function public.update_updated_at_column();

create trigger update_treatment_records_updated_at before update on public.treatment_records
  for each row execute function public.update_updated_at_column();

-- ============================================================================
-- 15. 初期データ投入
-- ============================================================================

-- 症状マスター
insert into public.symptoms (name, display_order) values
  ('肩こり', 1),
  ('腰痛', 2),
  ('頭痛', 3),
  ('首痛', 4);

-- 施術メニュー
insert into public.service_menus (name, duration_minutes, price, description) values
  ('初回カウンセリング+整体', 120, 15000, '初回限定の丁寧なカウンセリングと施術'),
  ('基本整体', 60, 8000, '通常の整体施術');

-- ============================================================================
-- 16. Row Level Security (RLS) 有効化
-- ============================================================================

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.therapists enable row level security;
alter table public.service_menus enable row level security;
alter table public.symptoms enable row level security;
alter table public.available_slots enable row level security;
alter table public.appointments enable row level security;
alter table public.treatment_records enable row level security;
alter table public.treatment_symptoms enable row level security;
alter table public.monthly_reports enable row level security;
alter table public.invoices enable row level security;
alter table public.notifications enable row level security;

-- ============================================================================
-- 17. RLS ポリシー設定
-- ============================================================================

-- Companies: 管理者は全て、整体師は閲覧のみ、法人担当者は自社のみ
create policy "Admin can do everything on companies"
  on public.companies for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Therapist can view companies"
  on public.companies for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'therapist'
    )
  );

create policy "Company users can view own company"
  on public.companies for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.company_id = companies.id
    )
  );

-- Users: 管理者は全て、その他は自分のみ閲覧可能
create policy "Admin can do everything on users"
  on public.users for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Therapists: 管理者は全て、整体師は全て閲覧可能
create policy "Admin can do everything on therapists"
  on public.therapists for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "All authenticated users can view therapists"
  on public.therapists for select
  using (auth.uid() is not null);

create policy "Therapist can update own profile"
  on public.therapists for update
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.id = therapists.user_id
    )
  );

-- Service Menus: 管理者は全て、その他は閲覧のみ
create policy "Admin can do everything on service_menus"
  on public.service_menus for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "All authenticated users can view service_menus"
  on public.service_menus for select
  using (auth.uid() is not null);

-- Symptoms: 管理者は全て、その他は閲覧のみ
create policy "Admin can do everything on symptoms"
  on public.symptoms for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "All authenticated users can view symptoms"
  on public.symptoms for select
  using (auth.uid() is not null);

-- Available Slots: 管理者は全て、整体師は自分の枠を管理、法人担当者は閲覧のみ
create policy "Admin can do everything on available_slots"
  on public.available_slots for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Therapist can manage own slots"
  on public.available_slots for all
  using (
    exists (
      select 1 from public.users u
      join public.therapists t on u.id = t.user_id
      where u.id = auth.uid() and t.id = available_slots.therapist_id
    )
  );

create policy "All authenticated users can view available_slots"
  on public.available_slots for select
  using (auth.uid() is not null);

-- Appointments: 管理者は全て、整体師は全て閲覧可能、法人担当者は自社のみ
create policy "Admin can do everything on appointments"
  on public.appointments for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Therapist can view and update appointments"
  on public.appointments for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'therapist'
    )
  );

create policy "Company users can manage own company appointments"
  on public.appointments for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.company_id = appointments.company_id
    )
  );

-- Treatment Records: 管理者は全て、整体師は全て閲覧・作成可能、法人担当者は自社のみ閲覧
create policy "Admin can do everything on treatment_records"
  on public.treatment_records for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Therapist can view and create treatment_records"
  on public.treatment_records for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'therapist'
    )
  );

create policy "Company users can view own company treatment_records"
  on public.treatment_records for select
  using (
    exists (
      select 1 from public.users u
      join public.appointments a on a.company_id = u.company_id
      where u.id = auth.uid() and a.id = treatment_records.appointment_id
    )
  );

-- Treatment Symptoms: 管理者・整体師は全て、法人担当者は自社分のみ閲覧
create policy "Admin can do everything on treatment_symptoms"
  on public.treatment_symptoms for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Therapist can manage treatment_symptoms"
  on public.treatment_symptoms for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'therapist'
    )
  );

create policy "Company users can view own company treatment_symptoms"
  on public.treatment_symptoms for select
  using (
    exists (
      select 1 from public.users u
      join public.appointments a on a.company_id = u.company_id
      join public.treatment_records tr on tr.appointment_id = a.id
      where u.id = auth.uid() and tr.id = treatment_symptoms.treatment_record_id
    )
  );

-- Monthly Reports: 管理者は全て、法人担当者は自社のみ閲覧
create policy "Admin can do everything on monthly_reports"
  on public.monthly_reports for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Company users can view own monthly_reports"
  on public.monthly_reports for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.company_id = monthly_reports.company_id
    )
  );

-- Invoices: 管理者は全て、法人担当者は自社のみ閲覧
create policy "Admin can do everything on invoices"
  on public.invoices for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Company users can view own invoices"
  on public.invoices for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.company_id = invoices.company_id
    )
  );

-- Notifications: 自分宛の通知のみアクセス可能
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Admin can create notifications"
  on public.notifications for insert
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

-- ============================================================================
-- 完了
-- ============================================================================
