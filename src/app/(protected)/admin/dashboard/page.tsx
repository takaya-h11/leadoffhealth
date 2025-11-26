import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AdminDashboard } from './AdminDashboard'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 管理者権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // 今日の日付
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // 今日の予約を取得
  const { data: todayAppointments } = await supabase
    .from('appointments')
    .select(`
      *,
      available_slots!inner (
        start_time,
        end_time,
        therapists (
          users (
            full_name
          )
        )
      ),
      companies (
        name
      )
    `)
    .gte('available_slots.start_time', today.toISOString())
    .lt('available_slots.start_time', tomorrow.toISOString())
    .in('status', ['approved', 'completed'])
    .order('available_slots(start_time)')

  // 承認待ち件数
  const { count: pendingCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // 今週の予約数
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const { count: weekAppointments } = await supabase
    .from('appointments')
    .select('*, available_slots!inner(*)', { count: 'exact', head: true })
    .gte('available_slots.start_time', weekStart.toISOString())
    .lt('available_slots.start_time', weekEnd.toISOString())
    .in('status', ['approved', 'completed'])

  // 今月の施術完了数
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)

  const { count: monthCompletedCount } = await supabase
    .from('appointments')
    .select('*, available_slots!inner(*)', { count: 'exact', head: true })
    .gte('available_slots.start_time', monthStart.toISOString())
    .lt('available_slots.start_time', monthEnd.toISOString())
    .eq('status', 'completed')

  // アクティブな法人数
  const { count: activeCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return (
    <AdminDashboard
      userName={userProfile?.full_name || user.email}
      todayCount={todayAppointments?.length || 0}
      pendingCount={pendingCount || 0}
      weekCount={weekAppointments || 0}
      monthCompletedCount={monthCompletedCount || 0}
      activeCompanies={activeCompanies || 0}
      todayAppointments={todayAppointments || []}
    />
  )
}
