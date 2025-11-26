import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CompanyDashboard } from './CompanyDashboard'

export default async function CompanyDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 法人担当者権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select(`
      role,
      full_name,
      company_id,
      companies (
        name
      )
    `)
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'company_user') {
    redirect('/dashboard')
  }

  if (!userProfile.company_id) {
    redirect('/dashboard?message=Company+info+not+found')
  }

  const company = Array.isArray(userProfile.companies)
    ? userProfile.companies[0]
    : userProfile.companies

  // 今日の日付
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 次回予約（最も近い承認済み予約）
  const { data: nextAppointment } = await supabase
    .from('appointments')
    .select(`
      *,
      available_slots (
        start_time,
        end_time,
        therapists (
          users (
            full_name
          )
        ),
        service_menus (
          name
        )
      )
    `)
    .eq('company_id', userProfile.company_id)
    .eq('status', 'approved')
    .gte('available_slots.start_time', today.toISOString())
    .order('available_slots(start_time)')
    .limit(1)
    .single()

  // 承認待ちの予約
  const { count: pendingCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', userProfile.company_id)
    .eq('status', 'pending')

  // 今月の利用状況
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)

  const { count: monthAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', userProfile.company_id)
    .gte('available_slots.start_time', monthStart.toISOString())
    .lt('available_slots.start_time', monthEnd.toISOString())
    .in('status', ['approved', 'completed'])

  // 今月の施術完了数
  const { count: monthCompletedCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', userProfile.company_id)
    .gte('available_slots.start_time', monthStart.toISOString())
    .lt('available_slots.start_time', monthEnd.toISOString())
    .eq('status', 'completed')

  // 次回予約の詳細
  let nextAppointmentDetails = null
  if (nextAppointment) {
    const slot = Array.isArray(nextAppointment.available_slots)
      ? nextAppointment.available_slots[0]
      : nextAppointment.available_slots
    const therapist = Array.isArray(slot?.therapists) ? slot.therapists[0] : slot?.therapists
    const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users
    const serviceMenu = Array.isArray(slot?.service_menus) ? slot.service_menus[0] : slot?.service_menus

    nextAppointmentDetails = {
      id: nextAppointment.id,
      startTime: new Date(slot.start_time),
      endTime: new Date(slot.end_time),
      therapistName: therapistUser?.full_name || '不明',
      serviceMenuName: serviceMenu?.name || '不明',
      employeeName: nextAppointment.employee_name,
    }
  }

  return (
    <CompanyDashboard
      userName={userProfile?.full_name || user.email}
      companyName={company?.name || '不明'}
      nextAppointmentDetails={nextAppointmentDetails}
      pendingCount={pendingCount || 0}
      monthAppointments={monthAppointments || 0}
      monthCompletedCount={monthCompletedCount || 0}
    />
  )
}
