import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TherapistDashboard } from './TherapistDashboard'

export default async function TherapistDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 整体師権限チェック（管理者も許可）
  const { data: userProfile } = await supabase
    .from('users')
    .select(`
      role,
      full_name,
      therapists (
        id
      )
    `)
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'therapist' && userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const therapistData = Array.isArray(userProfile.therapists)
    ? userProfile.therapists[0]
    : userProfile.therapists

  if (!therapistData) {
    redirect('/dashboard?message=Therapist+info+not+found')
  }

  // 今日の日付
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // 今日の予約を取得（自分の予約のみ）
  const { data: todayAppointments } = await supabase
    .from('appointments')
    .select(`
      *,
      available_slots!inner (
        id,
        start_time,
        end_time,
        therapist_id
      ),
      companies (
        name
      )
    `)
    .eq('available_slots.therapist_id', therapistData.id)
    .gte('available_slots.start_time', today.toISOString())
    .lt('available_slots.start_time', tomorrow.toISOString())
    .in('status', ['pending', 'approved'])
    .order('available_slots(start_time)')

  // 承認待ち件数（自分宛）
  const { count: pendingCount } = await supabase
    .from('appointments')
    .select('*, available_slots!inner(therapists!inner(id))', { count: 'exact', head: true })
    .eq('available_slots.therapists.id', therapistData.id)
    .eq('status', 'pending')

  // 今週の予約数（自分）
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const { count: weekAppointments } = await supabase
    .from('appointments')
    .select('*, available_slots!inner(therapists!inner(id))', { count: 'exact', head: true })
    .eq('available_slots.therapists.id', therapistData.id)
    .gte('available_slots.start_time', weekStart.toISOString())
    .lt('available_slots.start_time', weekEnd.toISOString())
    .in('status', ['approved', 'completed'])

  // 今月の施術完了数（自分）
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)

  const { count: monthCompletedCount } = await supabase
    .from('appointments')
    .select('*, available_slots!inner(therapists!inner(id))', { count: 'exact', head: true })
    .eq('available_slots.therapists.id', therapistData.id)
    .gte('available_slots.start_time', monthStart.toISOString())
    .lt('available_slots.start_time', monthEnd.toISOString())
    .eq('status', 'completed')

  // レポート記入待ちの予約（施術日が過去で、statusがapproved）
  const { data: needReportAppointments } = await supabase
    .from('appointments')
    .select(`
      *,
      available_slots!inner (
        id,
        start_time,
        end_time,
        therapist_id
      ),
      companies (
        name
      )
    `)
    .eq('available_slots.therapist_id', therapistData.id)
    .lt('available_slots.end_time', new Date().toISOString())
    .eq('status', 'approved')
    .order('available_slots(start_time)', { ascending: false })
    .limit(10)

  return (
    <TherapistDashboard
      userName={userProfile?.full_name || user.email}
      todayCount={todayAppointments?.length || 0}
      pendingCount={pendingCount || 0}
      weekCount={weekAppointments || 0}
      monthCompletedCount={monthCompletedCount || 0}
      todayAppointments={todayAppointments || []}
      needReportAppointments={needReportAppointments || []}
    />
  )
}
