import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
// import { ApprovalButtons } from './approval-buttons' // 承認機能廃止のためコメントアウト
import { translateMessage } from '@/utils/messages'
import { ScrollToTop } from '@/components/ScrollToTop'

export default async function TherapistAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const supabase = await createClient()

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

  // 自分宛のapproved予約を取得（pendingは廃止）
  const { data: slots } = await supabase
    .from('available_slots')
    .select(`
      id,
      start_time,
      end_time,
      service_menus (
        name,
        duration_minutes,
        price
      ),
      appointments (
        id,
        user_id,
        symptoms,
        notes,
        status,
        created_at,
        companies (
          name
        ),
        users!appointments_user_id_fkey (
          full_name,
          email
        )
      )
    `)
    .eq('therapist_id', therapistId)
    .eq('appointments.status', 'approved')
    .order('start_time', { ascending: true })

  // appointmentsがあるスロットのみフィルター
  const appointments = slots
    ?.map((slot) => {
      const appointment = Array.isArray(slot.appointments) ? slot.appointments[0] : slot.appointments
      if (!appointment) return null

      return {
        ...appointment,
        slot_id: slot.id,
        available_slots: {
          start_time: slot.start_time,
          end_time: slot.end_time,
          service_menus: Array.isArray(slot.service_menus) ? slot.service_menus[0] : slot.service_menus,
        },
      }
    })
    .filter((item) => item !== null) || []

  const params = await searchParams
  const message = params.message

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <ScrollToTop />
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">予約管理</h1>
            <p className="mt-2 text-sm text-gray-600">
              {appointments.filter(a => a.status === 'approved').length}件の予約が確定しています
            </p>
          </div>
          <Link
            href="/therapist/appointments/all"
            className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            全予約を表示
          </Link>
        </div>

        {message && (
          <div className={`mb-4 rounded-md p-4 ${
            message.includes('successfully') || message.includes('成功')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            <p className="text-sm">{translateMessage(message)}</p>
          </div>
        )}

        <div className="space-y-4">
          {appointments.map((appointment) => {
            const slot = appointment.available_slots
            const startTime = new Date(slot.start_time)
            const endTime = new Date(slot.end_time)
            const company = Array.isArray(appointment.companies) ? appointment.companies[0] : appointment.companies
            const _requestedByUser = Array.isArray(appointment.users) ? appointment.users[0] : appointment.users

            // ステータスに応じた色設定（承認済みのみ）
            const borderColor = 'border-blue-200'
            const bgColor = 'bg-blue-50'
            const badgeBgColor = 'bg-blue-100'
            const badgeTextColor = 'text-blue-800'
            const statusText = '予約済み'

            return (
              <div
                key={appointment.id}
                className={`rounded-lg border ${borderColor} ${bgColor} p-6 shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {company?.name || '不明'}
                      </h3>
                      <span className={`rounded-full ${badgeBgColor} px-3 py-1 text-sm font-semibold ${badgeTextColor}`}>
                        {statusText}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {startTime.toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          {' 〜 '}
                          {endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>
                          {_requestedByUser?.full_name || '利用者'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>{slot.service_menus?.name || '不明'}</span>
                      </div>

                      {appointment.symptoms && appointment.symptoms.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">症状:</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {appointment.symptoms.map((symptom: string) => (
                              <span
                                key={symptom}
                                className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700"
                              >
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {appointment.notes && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">要望・特記事項:</p>
                          <p className="mt-1 text-sm text-gray-600">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 承認ボタンは削除（即時確定のため不要） */}
                </div>
              </div>
            )
          })}
        </div>

        {appointments.length === 0 && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            予約はありません
          </div>
        )}
      </div>
    </div>
  )
}
