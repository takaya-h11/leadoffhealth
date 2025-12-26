import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/appointments/status-badge'
import { AppointmentActions } from './appointment-actions'
import { translateMessage } from '@/utils/messages'

interface PageProps {
  searchParams: Promise<{
    status?: string
    therapist?: string
    company?: string
    from?: string
    to?: string
    search?: string
    message?: string
  }>
}

export default async function AdminAppointmentsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 管理者権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // クエリビルダー
  let query = supabase
    .from('appointments')
    .select(`
      *,
      available_slots!inner (
        start_time,
        end_time,
        therapists!inner (
          id,
          users (
            full_name
          )
        ),
        service_menus (
          name
        )
      ),
      companies (
        id,
        name
      ),
      users!appointments_user_id_fkey (
        id,
        full_name
      )
    `)

  // ステータスでフィルター
  if (params.status) {
    query = query.eq('status', params.status)
  }

  // 整体師でフィルター
  if (params.therapist) {
    query = query.eq('available_slots.therapists.id', params.therapist)
  }

  // 法人でフィルター
  if (params.company) {
    query = query.eq('company_id', params.company)
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

  // 整体師一覧を取得（フィルター用）
  const { data: therapists } = await supabase
    .from('therapists')
    .select('id, users(full_name)')
    .eq('is_available', true)

  // 法人一覧を取得（フィルター用）
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">予約管理</h1>

        {/* メッセージ表示 */}
        {params.message && (
          <div
            className={`mb-4 rounded-md p-4 ${
              params.message.includes('success')
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            <p className="text-sm">{translateMessage(params.message)}</p>
          </div>
        )}

        {/* 検索・フィルターフォーム */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow">
          <form method="get" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <label htmlFor="therapist" className="block text-sm font-medium text-gray-700">
                  整体師
                </label>
                <select
                  id="therapist"
                  name="therapist"
                  defaultValue={params.therapist}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">すべて</option>
                  {therapists?.map((t) => {
                    const tUser = Array.isArray(t.users) ? t.users[0] : t.users
                    return (
                      <option key={t.id} value={t.id}>
                        {tUser?.full_name || '不明'}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  法人
                </label>
                <select
                  id="company"
                  name="company"
                  defaultValue={params.company}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">すべて</option>
                  {companies?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
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
                href="/admin/appointments"
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
                      法人・社員
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
                    const company = Array.isArray(appointment.companies)
                      ? appointment.companies[0]
                      : appointment.companies
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
                          <div>{company?.name || '不明'}</div>
                          <div className="text-gray-500">
                            {userName} {appointmentUser?.id && <span className="text-xs">(ID: {userId.slice(0, 8)}...)</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {appointment.symptoms && appointment.symptoms.length > 0
                            ? appointment.symptoms.join(', ')
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <StatusBadge status={appointment.status} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <AppointmentActions
                            appointmentId={appointment.id}
                            slotId={appointment.slot_id}
                            status={appointment.status}
                            startTime={slot.start_time}
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
