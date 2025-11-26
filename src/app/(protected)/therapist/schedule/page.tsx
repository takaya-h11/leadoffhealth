import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ScheduleClient } from './schedule-client'

export default async function TherapistSchedulePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 整体師権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'therapist' && userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // 施術メニューを取得
  const { data: serviceMenus } = await supabase
    .from('service_menus')
    .select('id, name, duration_minutes')
    .eq('is_active', true)
    .order('name')

  // 全整体師の空き枠と予約を取得（今後3ヶ月分）
  const threeMonthsLater = new Date()
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

  const { data: slots } = await supabase
    .from('available_slots')
    .select(`
      *,
      therapists:therapist_id (
        id,
        user_id,
        users:user_id (
          full_name
        )
      ),
      service_menus:service_menu_id (
        name
      ),
      appointments (
        id,
        status,
        employee_name,
        companies:company_id (
          name
        )
      )
    `)
    .gte('start_time', new Date().toISOString())
    .lte('start_time', threeMonthsLater.toISOString())
    .order('start_time')

  // カレンダーイベント形式に変換
  const events = slots?.map((slot) => {
    // therapistsとservice_menusの配列処理
    const therapist = Array.isArray(slot.therapists) ? slot.therapists[0] : slot.therapists
    const serviceMenu = Array.isArray(slot.service_menus) ? slot.service_menus[0] : slot.service_menus
    const appointment = Array.isArray(slot.appointments) ? slot.appointments[0] : slot.appointments

    const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users
    const therapistName = therapistUser?.full_name || '不明'

    // ステータスを判定（appointmentのstatusを優先）
    let displayStatus: 'available' | 'pending' | 'booked' | 'cancelled' = slot.status as 'available' | 'pending' | 'booked' | 'cancelled'
    if (appointment) {
      if (appointment.status === 'pending') displayStatus = 'pending'
      else if (appointment.status === 'approved') displayStatus = 'booked'
      else if (appointment.status === 'cancelled') displayStatus = 'cancelled'
    }

    let title = `${therapistName} - ${serviceMenu?.name || '不明'}`
    if (appointment && displayStatus !== 'available') {
      const company = Array.isArray(appointment.companies) ? appointment.companies[0] : appointment.companies
      title = `${therapistName} - ${company?.name || '不明'} (${appointment.employee_name})`
    }

    return {
      id: slot.id,
      title,
      start: new Date(slot.start_time),
      end: new Date(slot.end_time),
      resource: {
        therapistName,
        status: displayStatus,
        serviceMenuName: serviceMenu?.name || '不明',
        companyName: appointment ? (Array.isArray(appointment.companies) ? appointment.companies[0]?.name : appointment.companies?.name) : undefined,
        employeeName: appointment?.employee_name,
      },
    }
  }) || []

  return <ScheduleClient events={events} serviceMenus={serviceMenus || []} />
}
