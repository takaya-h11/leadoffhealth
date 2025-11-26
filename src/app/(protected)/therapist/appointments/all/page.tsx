import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/appointments/status-badge'

interface PageProps {
  searchParams: Promise<{
    status?: string
    message?: string
  }>
}

export default async function TherapistAllAppointmentsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

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

  // 自分宛の予約を取得
  let query = supabase
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
        employee_name,
        employee_id,
        symptoms,
        notes,
        status,
        created_at,
        companies (
          name
        )
      )
    `)
    .eq('therapist_id', therapistId)
    .not('appointments', 'is', null)

  // ステータスでフィルター
  if (params.status) {
    query = query.eq('appointments.status', params.status)
  }

  const { data: slots } = await query.order('start_time', { ascending: false }).limit(100)

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

  const message = params.message

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">予約管理</h1>
          <Link
            href="/therapist/appointments"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            承認待ち予約のみ表示
          </Link>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-md p-4 ${
              message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            <p className="text-sm">{message.replace('success: ', '')}</p>
          </div>
        )}

        {/* フィルターフォーム */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow">
          <form method="get" className="space-y-4">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  ステータス
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={params.status}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">すべて</option>
                  <option value="pending">承認待ち</option>
                  <option value="approved">承認済み</option>
                  <option value="rejected">拒否</option>
                  <option value="cancelled">キャンセル</option>
                  <option value="completed">完了</option>
                </select>
              </div>
              <button
                type="submit"
                className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                検索
              </button>
              <Link
                href="/therapist/appointments/all"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                リセット
              </Link>
            </div>
          </form>
        </div>

        {/* 予約一覧 */}
        {appointments && appointments.length > 0 ? (
          <>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      法人・社員
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      メニュー
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      症状
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {appointments.map((appointment) => {
                    const slot = appointment.available_slots
                    const startTime = new Date(slot.start_time)
                    const company = Array.isArray(appointment.companies)
                      ? appointment.companies[0]
                      : appointment.companies
                    const serviceMenu = Array.isArray(slot.service_menus)
                      ? slot.service_menus[0]
                      : slot.service_menus

                    return (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {startTime.toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                          <br />
                          {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>{company?.name || '不明'}</div>
                          <div className="text-gray-500">
                            {appointment.employee_name} ({appointment.employee_id})
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {serviceMenu?.name || '不明'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {appointment.symptoms && appointment.symptoms.length > 0
                            ? appointment.symptoms.join(', ')
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <StatusBadge status={appointment.status} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {appointment.status === 'approved' && (
                            <Link
                              href={`/therapist/appointments/${appointment.id}/report`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              施術レポート記入
                            </Link>
                          )}
                          {appointment.status === 'pending' && (
                            <Link
                              href="/therapist/appointments"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              承認/拒否
                            </Link>
                          )}
                          {appointment.status === 'completed' && (
                            <Link
                              href={`/therapist/appointments/${appointment.id}/view`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              詳細を見る
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-500">{appointments.length}件の予約が見つかりました</div>
          </>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            該当する予約が見つかりませんでした
          </div>
        )}
      </div>
    </div>
  )
}
