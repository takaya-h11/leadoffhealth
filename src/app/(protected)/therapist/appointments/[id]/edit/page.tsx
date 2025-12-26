import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TreatmentReportForm } from '../report/TreatmentReportForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditTreatmentReportPage({ params }: PageProps) {
  const supabase = await createClient()
  const { id: appointmentId } = await params

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
    redirect('/dashboard?message=' + encodeURIComponent('整体師情報が見つかりません'))
  }

  // 施術記録を取得
  const { data: record, error: recordError } = await supabase
    .from('treatment_records')
    .select(`
      *,
      appointments (
        id,
        employee_name,
        employee_id,
        symptoms,
        notes,
        status,
        companies (
          name
        ),
        users!appointments_user_id_fkey (
          full_name,
          id
        ),
        available_slots (
          start_time,
          end_time,
          service_menus (
            name,
            duration_minutes,
            price
          ),
          therapists (
            users (
              full_name
            )
          )
        )
      ),
      treatment_symptoms (
        symptoms (
          id,
          name
        )
      )
    `)
    .eq('appointment_id', appointmentId)
    .single()

  if (recordError || !record) {
    redirect('/therapist/appointments/all?message=Treatment+record+not+found')
  }

  // 権限チェック: 整体師本人または管理者のみ編集可能
  if (
    userProfile.role !== 'admin' &&
    record.therapist_id !== therapistId
  ) {
    redirect('/therapist/appointments/all?message=Permission+denied')
  }

  const appointment = Array.isArray(record.appointments)
    ? record.appointments[0]
    : record.appointments

  if (!appointment) {
    redirect('/therapist/appointments/all?message=Appointment+not+found')
  }

  const company = Array.isArray(appointment.companies)
    ? appointment.companies[0]
    : appointment.companies

  const slot = Array.isArray(appointment.available_slots)
    ? appointment.available_slots[0]
    : appointment.available_slots

  const serviceMenu = Array.isArray(slot?.service_menus)
    ? slot.service_menus[0]
    : slot?.service_menus

  const therapist = Array.isArray(slot?.therapists)
    ? slot.therapists[0]
    : slot?.therapists

  const therapistUser = Array.isArray(therapist?.users)
    ? therapist.users[0]
    : therapist?.users

  // 症状マスター取得
  const { data: symptoms } = await supabase
    .from('symptoms')
    .select('id, name')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // 既存の施術症状
  const existingSymptomIds = record.treatment_symptoms?.map((ts: { symptoms: { id: string } | { id: string }[] }) => {
    const symptom = Array.isArray(ts.symptoms) ? ts.symptoms[0] : ts.symptoms
    return symptom?.id
  }).filter(Boolean) || []

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">施術レポート編集</h1>
          <a
            href={`/therapist/appointments/${appointmentId}/view`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </a>
        </div>

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
                {new Date(slot.start_time).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
                {' '}
                {new Date(slot.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium text-gray-700">メニュー:</span>
              <span className="text-gray-900">{serviceMenu?.name || '不明'}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium text-gray-700">担当整体師:</span>
              <span className="text-gray-900">{therapistUser?.full_name || '不明'}</span>
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

        {/* 編集フォーム */}
        <TreatmentReportForm
          appointmentId={appointmentId}
          therapistId={therapistId}
          defaultDuration={serviceMenu?.duration_minutes || 60}
          symptoms={symptoms || []}
          editMode={true}
          existingRecord={{
            id: record.id,
            treatment_content: record.treatment_content,
            patient_condition: record.patient_condition,
            improvement_level: record.improvement_level,
            satisfaction_level: record.satisfaction_level,
            actual_duration_minutes: record.actual_duration_minutes,
            next_recommendation: record.next_recommendation || '',
            symptom_ids: existingSymptomIds,
            body_diagram_data: record.body_diagram_data,
          }}
        />
      </div>
    </div>
  )
}
