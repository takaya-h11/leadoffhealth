import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CancelButton } from './cancel-button'
import { StatusBadge } from '@/components/appointments/status-badge'
import { translateMessage } from '@/utils/messages'

interface PageProps {
  searchParams: Promise<{
    status?: string
    from?: string
    to?: string
    search?: string
    message?: string
  }>
}

export default async function CompanyAppointmentsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 法人担当者権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'company_user' || !userProfile.company_id) {
    redirect('/dashboard')
  }

  // クエリビルダー
  let query = supabase
    .from('appointments')
    .select(`
      *,
      available_slots!inner (
        id,
        start_time,
        end_time,
        therapists!inner (
          users (
            full_name
          )
        ),
        service_menus (
          name,
          duration_minutes,
          price
        )
      ),
      users!appointments_user_id_fkey (
        id,
        full_name
      )
    `)
    .eq('company_id', userProfile.company_id)

  // ステータスでフィルター
  if (params.status) {
    query = query.eq('status', params.status)
  }

  // 日付範囲でフィルター
  if (params.from) {
    const fromDate = new Date(params.from)
    query = query.gte('available_slots.start_time', fromDate.toISOString())
  }
  if (params.to) {
    const toDate = new Date(params.to)
    toDate.setHours(23, 59, 59, 999)
    query = query.lte('available_slots.start_time', toDate.toISOString())
  }

  // 検索（社員名・社員ID）
  if (params.search) {
    // 新しい予約フロー（user_id使用）と旧フロー（employee_name使用）の両方に対応
    query = query.or(`employee_name.ilike.%${params.search}%,employee_id.ilike.%${params.search}%,users.full_name.ilike.%${params.search}%`)
  }

  const { data: appointments } = await query.order('created_at', { ascending: false }).limit(100)

  const message = params.message

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">予約一覧</h1>
          <Link
            href="/company/schedule"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + 新規予約
          </Link>
        </div>

        {message && (
          <div className={`mb-4 rounded-md p-4 ${
            message.includes('success')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            <p className="text-sm">{translateMessage(message.replace('success: ', ''))}</p>
          </div>
        )}

        {/* 検索・フィルターフォーム */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow">
          <form method="get" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  検索
                </label>
                <input
                  type="text"
                  id="search"
                  name="search"
                  defaultValue={params.search}
                  placeholder="社員名・ID"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
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

              <div>
                <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                  開始日
                </label>
                <input
                  type="date"
                  id="from"
                  name="from"
                  defaultValue={params.from}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                  終了日
                </label>
                <input
                  type="date"
                  id="to"
                  name="to"
                  defaultValue={params.to}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                検索
              </button>
              <Link
                href="/company/appointments"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                リセット
              </Link>
            </div>
          </form>
        </div>

        {/* 予約一覧テーブル */}
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
                      整体師
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      社員
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
                    const slot = Array.isArray(appointment.available_slots)
                      ? appointment.available_slots[0]
                      : appointment.available_slots
                    const therapist = Array.isArray(slot.therapists) ? slot.therapists[0] : slot.therapists
                    const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users
                    const appointmentUser = Array.isArray(appointment.users)
                      ? appointment.users[0]
                      : appointment.users
                    const startTime = new Date(slot.start_time)

                    // 新旧フロー対応: user_id があればそちらを優先、なければ employee_name を使用
                    const userName = appointmentUser?.full_name || appointment.employee_name || '不明'
                    const userId = appointmentUser?.id || appointment.employee_id || '-'

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
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {therapistUser?.full_name || '不明'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>{userName}</div>
                          {appointmentUser?.id && <div className="text-xs text-gray-500">ID: {userId.slice(0, 8)}...</div>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {appointment.symptoms && appointment.symptoms.length > 0
                            ? appointment.symptoms.join(', ')
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <StatusBadge status={appointment.status} />
                          {appointment.status === 'rejected' && appointment.rejected_reason && (
                            <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-800">
                              <span className="font-semibold">拒否理由:</span> {appointment.rejected_reason}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <CancelButton
                            appointmentId={appointment.id}
                            slotId={slot.id}
                            startTime={slot.start_time}
                            status={appointment.status}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {appointments.length}件の予約が見つかりました
            </div>
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
