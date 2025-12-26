import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { translateMessage } from '@/utils/messages'
import { TreatmentReportForm } from './TreatmentReportForm'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ message?: string }>
}

export default async function TreatmentReportPage({ params, searchParams }: PageProps) {
  const supabase = await createClient()
  const { id: appointmentId } = await params
  const resolvedSearchParams = await searchParams
  const message = resolvedSearchParams.message

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 整体師権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, therapists(id)')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'therapist' && userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const therapistData = Array.isArray(userProfile.therapists)
    ? userProfile.therapists[0]
    : userProfile.therapists

  const therapistId = therapistData?.id

  if (!therapistId) {
    redirect('/dashboard?message=Therapist+info+not+found')
  }

  // まず予約が存在するか確認（statusフィルターなし）
  const { data: appointmentCheck, error: checkError } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', appointmentId)
    .single()

  console.log('🔍 [REPORT PAGE] Appointment existence check:', {
    appointmentId,
    exists: !!appointmentCheck,
    status: appointmentCheck?.status,
    checkError: checkError?.message || checkError,
  })

  if (!appointmentCheck) {
    console.error('❌ [REPORT PAGE] Appointment not found with ID:', appointmentId)
    redirect('/therapist/appointments?message=Appointment+not+found')
  }

  if (appointmentCheck.status !== 'approved' && appointmentCheck.status !== 'completed') {
    console.error('❌ [REPORT PAGE] Appointment status is not approved or completed:', appointmentCheck.status)
    redirect(`/therapist/appointments?message=Appointment+status+is+${appointmentCheck.status}`)
  }

  // approved または completed 状態の予約を取得
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .select(`
      *,
      available_slots (
        id,
        start_time,
        end_time,
        therapist_id,
        service_menus (
          name,
          duration_minutes,
          price
        )
      ),
      companies (
        name
      ),
      users!appointments_user_id_fkey (
        full_name,
        id
      )
    `)
    .eq('id', appointmentId)
    .single()

  if (appointmentError || !appointment) {
    console.error('❌ [REPORT PAGE] Appointment fetch error:', appointmentError)
    redirect('/therapist/appointments?message=Appointment+not+ready+for+report')
  }

  // 自分の担当予約かチェック
  const slot = Array.isArray(appointment.available_slots)
    ? appointment.available_slots[0]
    : appointment.available_slots

  if (slot.therapist_id !== therapistId) {
    redirect('/therapist/appointments?message=No+permission+to+fill+report')
  }

  // すでにレポートが記入されているかチェック
  const { data: existingRecord } = await supabase
    .from('treatment_records')
    .select('id')
    .eq('appointment_id', appointmentId)
    .single()

  if (existingRecord) {
    // 既にレポートがある場合は編集ページにリダイレクト
    redirect(`/therapist/appointments/${appointmentId}/edit`)
  }

  // 症状マスター取得
  const { data: symptoms } = await supabase
    .from('symptoms')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const company = Array.isArray(appointment.companies)
    ? appointment.companies[0]
    : appointment.companies
  const serviceMenu = Array.isArray(slot.service_menus)
    ? slot.service_menus[0]
    : slot.service_menus
  const startTime = new Date(slot.start_time)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">施術後レポート記入</h1>

        {message && (
          <div className={`mb-4 rounded-md p-4 ${
            message.includes('success')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            <p className="text-sm">{translateMessage(message)}</p>
          </div>
        )}

        {/* 予約情報サマリー */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">予約情報</h2>
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="w-32 font-medium text-gray-700">法人:</span>
              <span className="text-gray-900">{company?.name || '不明'}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium text-gray-700">社員名:</span>
              <span className="text-gray-900">
                {Array.isArray(appointment.users) ? appointment.users[0]?.full_name : appointment.users?.full_name || appointment.employee_name || '不明'}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium text-gray-700">施術日時:</span>
              <span className="text-gray-900">
                {startTime.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
                {' '}
                {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium text-gray-700">メニュー:</span>
              <span className="text-gray-900">{serviceMenu?.name || '不明'}</span>
            </div>
            {appointment.symptoms && appointment.symptoms.length > 0 && (
              <div className="flex">
                <span className="w-32 font-medium text-gray-700">申込時の症状:</span>
                <span className="text-gray-900">{appointment.symptoms.join(', ')}</span>
              </div>
            )}
            {appointment.notes && (
              <div className="flex">
                <span className="w-32 font-medium text-gray-700">要望:</span>
                <span className="text-gray-900">{appointment.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* レポート記入フォーム（クライアントコンポーネント） */}
        <TreatmentReportForm
          appointmentId={appointmentId}
          therapistId={therapistId}
          defaultDuration={serviceMenu?.duration_minutes || 60}
          symptoms={symptoms || []}
        />
      </div>
    </div>
  )
}
