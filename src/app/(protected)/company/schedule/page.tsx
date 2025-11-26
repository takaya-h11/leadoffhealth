import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CompanyScheduleCalendar } from './company-schedule-calendar'

export default async function CompanySchedulePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 法人担当者権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'company_user') {
    redirect('/dashboard')
  }

  // 予約可能な空き枠と自社の予約を取得（今後3ヶ月分）
  const threeMonthsLater = new Date()
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

  // 1. 予約可能な空き枠を取得
  const { data: availableSlots } = await supabase
    .from('available_slots')
    .select(`
      *,
      therapists (
        id,
        users (
          full_name
        )
      ),
      service_menus (
        name,
        duration_minutes,
        price
      )
    `)
    .eq('status', 'available')
    .gte('start_time', new Date().toISOString())
    .lte('start_time', threeMonthsLater.toISOString())
    .order('start_time')

  // 2. 自社の予約（pending、booked、cancelled）を取得
  const { data: companyAppointments } = await supabase
    .from('appointments')
    .select(`
      *,
      available_slots!inner (
        id,
        start_time,
        end_time,
        status,
        therapist_id,
        service_menu_id,
        therapists:therapist_id (
          id,
          users:user_id (
            full_name
          )
        ),
        service_menus:service_menu_id (
          name,
          duration_minutes,
          price
        )
      )
    `)
    .eq('company_id', userProfile.company_id)
    .in('status', ['pending', 'approved', 'cancelled'])
    .gte('available_slots.start_time', new Date().toISOString())
    .lte('available_slots.start_time', threeMonthsLater.toISOString())

  // カレンダーイベント形式に変換
  const availableEvents = availableSlots?.map((slot) => {
    const therapist = Array.isArray(slot.therapists) ? slot.therapists[0] : slot.therapists
    const serviceMenu = Array.isArray(slot.service_menus) ? slot.service_menus[0] : slot.service_menus
    const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users
    const therapistName = therapistUser?.full_name || '不明'

    return {
      id: `slot-${slot.id}`, // slotのIDにプレフィックスを付けてユニークにする
      slotId: slot.id, // 予約用に元のslot IDも保持
      title: `${therapistName} - ${serviceMenu?.name || '不明'}`,
      start: new Date(slot.start_time),
      end: new Date(slot.end_time),
      resource: {
        therapistName,
        status: 'available' as const,
        serviceMenuName: serviceMenu?.name || '不明',
        price: serviceMenu?.price,
        durationMinutes: serviceMenu?.duration_minutes,
      },
    }
  }) || []

  const appointmentEvents = companyAppointments?.map((appointment) => {
    const slot = Array.isArray(appointment.available_slots)
      ? appointment.available_slots[0]
      : appointment.available_slots
    const therapist = Array.isArray(slot?.therapists) ? slot.therapists[0] : slot?.therapists
    const serviceMenu = Array.isArray(slot?.service_menus) ? slot.service_menus[0] : slot?.service_menus
    const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users
    const therapistName = therapistUser?.full_name || '不明'

    // appointment.statusに基づいてslotのstatusを判断
    let slotStatus: 'pending' | 'booked' | 'cancelled' = 'pending'
    if (appointment.status === 'approved') slotStatus = 'booked'
    else if (appointment.status === 'cancelled') slotStatus = 'cancelled'

    return {
      id: `appointment-${appointment.id}`, // appointmentのIDを使用してユニークにする
      title: `${therapistName} - ${serviceMenu?.name || '不明'} (${appointment.employee_name})`,
      start: new Date(slot?.start_time || ''),
      end: new Date(slot?.end_time || ''),
      resource: {
        therapistName,
        status: slotStatus,
        serviceMenuName: serviceMenu?.name || '不明',
        employeeName: appointment.employee_name,
      },
    }
  }) || []

  const events = [...availableEvents, ...appointmentEvents]
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">予約可能な空き枠</h1>
          <p className="mt-2 text-sm text-gray-600">
            空き枠をクリックして予約を申し込めます
          </p>
        </div>
        <CompanyScheduleCalendar events={events} />
      </div>
    </div>
  )
}
