-- ============================================================================
-- 予約フロー再設計マイグレーション
-- ============================================================================
-- 変更内容:
-- 1. company_user ロールを個別利用者アカウント用に変更
-- 2. 予約の即時承認（pending ステータスを廃止）
-- 3. キャンセル制限の撤廃
-- 4. カレンダー表示のプライバシー制御
-- ============================================================================

-- ============================================================================
-- 1. users テーブルのコメント更新
-- ============================================================================
comment on column public.users.role is 'admin: 管理者, therapist: 整体師, company_user: 整体利用者（個別アカウント）';

-- ============================================================================
-- 2. appointments テーブルの変更
-- ============================================================================

-- employee_name と employee_id を削除（users テーブルの情報を使用）
-- まずは既存データを保持したまま、新カラムを追加
alter table public.appointments
  add column if not exists user_id uuid references public.users(id) on delete restrict;

comment on column public.appointments.user_id is '予約した利用者のID（company_userロールのユーザー）';
comment on column public.appointments.requested_by is '非推奨: 予約を申し込んだユーザー（今後はuser_idを使用）';
comment on column public.appointments.employee_name is '非推奨: 今後はusers.full_nameを参照';
comment on column public.appointments.employee_id is '非推奨: 今後はusers.idを参照';

-- ステータスのデフォルトを 'approved' に変更（即時承認）
alter table public.appointments
  alter column status set default 'approved';

-- employee_name と employee_id の NOT NULL 制約を削除
-- （新しい予約フローでは user_id を使用するため、これらは NULL 許可）
alter table public.appointments
  alter column employee_name drop not null;

alter table public.appointments
  alter column employee_id drop not null;

comment on column public.appointments.status is 'approved: 予約確定, cancelled: キャンセル, completed: 施術完了（pending/rejectedは廃止）';

-- rejected_reason は履歴データのため残すが、新規では使用しない
comment on column public.appointments.rejected_reason is '非推奨: 拒否機能廃止のため使用しない';

-- ============================================================================
-- 3. available_slots のステータス更新
-- ============================================================================

-- pending ステータスを使用しないため、available または booked のみ
comment on column public.available_slots.status is 'available: 予約可能, booked: 予約確定, cancelled: キャンセル済み（pendingは廃止）';

-- ============================================================================
-- 4. 通知タイプの更新
-- ============================================================================

-- appointment_requested と appointment_rejected を廃止
comment on table public.notifications is '通知テーブル（appointment_requested/rejected は廃止、appointment_approved と reminder のみ使用）';

-- ============================================================================
-- 5. RLS ポリシーの更新: カレンダー表示のプライバシー制御
-- ============================================================================

-- 既存のポリシーを削除して再作成
drop policy if exists "Company users can manage own company appointments" on public.appointments;
drop policy if exists "All authenticated users can view available_slots" on public.appointments;

-- Company users: 自社の予約のみアクセス可能（新ポリシー）
create policy "Company users can manage own company appointments"
  on public.appointments for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.company_id = appointments.company_id
        and users.role = 'company_user'
    )
  );

-- Company users: 自分の予約のみ作成可能
create policy "Company users can create own appointments"
  on public.appointments for insert
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.id = appointments.user_id
        and users.company_id = appointments.company_id
        and users.role = 'company_user'
    )
  );

-- ============================================================================
-- 6. カレンダー用のビュー作成（プライバシー制御付き）
-- ============================================================================

-- 利用者向けカレンダービュー（他社の個人情報を隠す）
create or replace view public.calendar_slots_for_users as
select
  s.id as slot_id,
  s.therapist_id,
  s.service_menu_id,
  s.start_time,
  s.end_time,
  s.status as slot_status,
  th.user_id as therapist_user_id,
  tu.full_name as therapist_name,
  sm.name as service_menu_name,
  sm.duration_minutes,
  sm.price,
  a.id as appointment_id,
  a.status as appointment_status,
  -- 自社の予約のみ法人名と利用者名を表示
  case
    when exists (
      select 1 from public.users cu
      where cu.id = auth.uid()
        and cu.company_id = a.company_id
        and cu.role = 'company_user'
    ) then c.name
    else '予約済み'
  end as company_name,
  case
    when exists (
      select 1 from public.users cu
      where cu.id = auth.uid()
        and cu.company_id = a.company_id
        and cu.role = 'company_user'
    ) then u.full_name
    else null
  end as user_name
from public.available_slots s
left join public.therapists th on s.therapist_id = th.id
left join public.users tu on th.user_id = tu.id
left join public.service_menus sm on s.service_menu_id = sm.id
left join public.appointments a on s.id = a.slot_id
left join public.companies c on a.company_id = c.id
left join public.users u on a.user_id = u.id;

-- ビューへのRLS設定
alter view public.calendar_slots_for_users set (security_invoker = true);

comment on view public.calendar_slots_for_users is '利用者向けカレンダービュー（他社の個人情報は非表示）';

-- 管理者・整体師向けカレンダービュー（全情報表示）
create or replace view public.calendar_slots_for_staff as
select
  s.id as slot_id,
  s.therapist_id,
  s.service_menu_id,
  s.start_time,
  s.end_time,
  s.status as slot_status,
  th.user_id as therapist_user_id,
  tu.full_name as therapist_name,
  sm.name as service_menu_name,
  sm.duration_minutes,
  sm.price,
  a.id as appointment_id,
  a.status as appointment_status,
  c.name as company_name,
  u.full_name as user_name,
  a.symptoms,
  a.notes
from public.available_slots s
left join public.therapists th on s.therapist_id = th.id
left join public.users tu on th.user_id = tu.id
left join public.service_menus sm on s.service_menu_id = sm.id
left join public.appointments a on s.id = a.slot_id
left join public.companies c on a.company_id = c.id
left join public.users u on a.user_id = u.id;

alter view public.calendar_slots_for_staff set (security_invoker = true);

comment on view public.calendar_slots_for_staff is 'スタッフ向けカレンダービュー（全情報表示）';

-- ============================================================================
-- 7. トリガー: 予約作成時の自動承認
-- ============================================================================

create or replace function public.auto_approve_appointment()
returns trigger as $$
begin
  -- 予約作成時に自動的に status を 'approved' に設定
  if new.status = 'pending' then
    new.status := 'approved';
  end if;

  -- available_slots のステータスを 'booked' に更新
  update public.available_slots
  set status = 'booked'
  where id = new.slot_id;

  return new;
end;
$$ language plpgsql;

create trigger auto_approve_appointment_trigger
  before insert on public.appointments
  for each row
  execute function public.auto_approve_appointment();

comment on function public.auto_approve_appointment is '予約作成時に自動承認し、スロットをbookedに変更';

-- ============================================================================
-- 8. トリガー: キャンセル時のスロット解放
-- ============================================================================

create or replace function public.release_slot_on_cancel()
returns trigger as $$
begin
  -- キャンセル時に available_slots を 'available' に戻す
  if new.status = 'cancelled' and old.status != 'cancelled' then
    update public.available_slots
    set status = 'available'
    where id = new.slot_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger release_slot_on_cancel_trigger
  after update on public.appointments
  for each row
  when (new.status = 'cancelled' and old.status != 'cancelled')
  execute function public.release_slot_on_cancel();

comment on function public.release_slot_on_cancel is 'キャンセル時にスロットをavailableに戻す';

-- ============================================================================
-- 9. インデックス追加
-- ============================================================================

create index if not exists idx_appointments_user_id on public.appointments(user_id);
create index if not exists idx_users_company_id on public.users(company_id);

-- ============================================================================
-- 完了
-- ============================================================================
