-- ============================================================================
-- calendar_slots_for_users ビューに requested_by を追加
-- ============================================================================
-- 問題: ビューに requested_by カラムがないため、ステータス判定が正しく動作しない
-- 解決: ビューを再作成して requested_by を含める
-- ============================================================================

-- ビューを削除して再作成
drop view if exists public.calendar_slots_for_users;

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
  a.requested_by, -- ★ 追加: 予約者のID（ステータス判定に必要）
  -- 自社の予約のみ法人名と利用者名を表示
  case
    when exists (
      select 1 from public.users cu
      where cu.id = auth.uid()
        and cu.company_id = a.company_id
        and (cu.role = 'company_user' or cu.role = 'employee')
    ) then c.name
    when a.id is not null then '予約済み'
    else null
  end as company_name,
  case
    when exists (
      select 1 from public.users cu
      where cu.id = auth.uid()
        and cu.company_id = a.company_id
        and (cu.role = 'company_user' or cu.role = 'employee')
    ) then u.full_name
    else null
  end as user_name
from public.available_slots s
left join public.therapists th on s.therapist_id = th.id
left join public.users tu on th.user_id = tu.id
left join public.service_menus sm on s.service_menu_id = sm.id
left join public.appointments a on s.id = a.slot_id and a.status != 'cancelled'
left join public.companies c on a.company_id = c.id
left join public.users u on a.user_id = u.id;

-- ビューへのRLS設定
alter view public.calendar_slots_for_users set (security_invoker = true);

comment on view public.calendar_slots_for_users is '利用者向けカレンダービュー（他社の個人情報は非表示、requested_by含む）';
