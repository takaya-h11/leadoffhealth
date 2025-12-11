import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeleteSlotButton from './delete-slot-button'
import { translateMessage } from '@/utils/messages'

export default async function SlotsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; start_date?: string; end_date?: string; message?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ユーザーのロールを確認
  const { data: userProfile } = await supabase
    .from('users')
    .select(`
      role,
      therapists (
        id
      )
    `)
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'therapist' && userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // therapistsが配列で返ってくる可能性があるので処理
  const therapistData = Array.isArray(userProfile.therapists)
    ? userProfile.therapists[0]
    : userProfile.therapists

  if (!therapistData) {
    redirect('/dashboard?message=' + encodeURIComponent('整体師情報が見つかりません'))
  }

  const params = await searchParams
  const statusFilter = params.status || ''
  const startDate = params.start_date || ''
  const endDate = params.end_date || ''
  const message = params.message

  // 空き枠を取得
  let query = supabase
    .from('available_slots')
    .select(`
      *,
      service_menus (
        name,
        duration_minutes,
        price
      ),
      companies (
        name
      ),
      appointments (
        id,
        employee_name,
        employee_id,
        status,
        company_id,
        companies (
          name
        )
      )
    `)
    .eq('therapist_id', therapistData.id)
    .order('start_time', { ascending: true })

  // フィルター適用
  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }
  if (startDate) {
    query = query.gte('start_time', new Date(startDate).toISOString())
  }
  if (endDate) {
    const endDateTime = new Date(endDate)
    endDateTime.setHours(23, 59, 59, 999)
    query = query.lte('start_time', endDateTime.toISOString())
  }

  const { data: slots } = await query

  // 今日の日付を取得
  const _today = new Date().toISOString().split('T')[0]
  const now = new Date()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">空き枠管理</h1>
            <p className="mt-2 text-sm text-gray-600">
              自分の空き枠の一覧・削除
            </p>
          </div>
          <Link
            href="/therapist/slots/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + 空き枠を登録
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

        {/* フィルターフォーム */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow">
          <form method="GET" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  ステータス
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={statusFilter}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">すべて</option>
                  <option value="available">空き</option>
                  <option value="pending">承認待ち</option>
                  <option value="booked">予約済み</option>
                  <option value="cancelled">キャンセル</option>
                </select>
              </div>

              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  開始日
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  defaultValue={startDate}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                  終了日
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  defaultValue={endDate}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Link
                href="/therapist/slots"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                クリア
              </Link>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                絞り込み
              </button>
            </div>
          </form>
        </div>

        {/* 空き枠一覧 */}
        {!slots || slots.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow">
            <p className="text-gray-500">空き枠がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {slots.map((slot) => {
              const startTime = new Date(slot.start_time)
              const endTime = new Date(slot.end_time)
              const isPast = startTime < now
              const canDelete = slot.status === 'available' && !isPast

              // ステータスによる色分け
              let statusColor = 'bg-gray-100 text-gray-800 border-gray-300'
              if (slot.status === 'available') {
                statusColor = 'bg-green-50 text-green-800 border-green-200'
              } else if (slot.status === 'pending') {
                statusColor = 'bg-yellow-50 text-yellow-800 border-yellow-200'
              } else if (slot.status === 'booked') {
                statusColor = 'bg-blue-50 text-blue-800 border-blue-200'
              } else if (slot.status === 'cancelled') {
                statusColor = 'bg-gray-50 text-gray-600 border-gray-200'
              }

              const statusLabel: { [key: string]: string } = {
                available: '空き',
                pending: '承認待ち',
                booked: '予約済み',
                cancelled: 'キャンセル',
              }

              // appointmentsが配列の場合は最初の要素を取得
              const appointment = Array.isArray(slot.appointments)
                ? slot.appointments[0]
                : slot.appointments

              const serviceMenu = Array.isArray(slot.service_menus)
                ? slot.service_menus[0]
                : slot.service_menus

              const slotCompany = Array.isArray(slot.companies)
                ? slot.companies[0]
                : slot.companies

              return (
                <div
                  key={slot.id}
                  className={`rounded-lg border p-6 shadow ${statusColor}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 日時 */}
                      <div className="mb-2 flex items-center gap-2">
                        <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-lg font-semibold text-gray-900">
                          {startTime.toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                          {' '}
                          {startTime.toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' 〜 '}
                          {endTime.toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* 法人情報（専用枠の場合） */}
                      {slotCompany && (
                        <div className="mb-2 text-sm text-gray-700">
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            {slotCompany.name} 専用
                          </span>
                        </div>
                      )}

                      {/* 施術メニュー */}
                      {serviceMenu && (
                        <div className="mb-2 text-sm text-gray-700">
                          <span className="font-medium">メニュー:</span> {serviceMenu.name}
                          {' '}（{serviceMenu.duration_minutes}分 / ¥{serviceMenu.price.toLocaleString()}）
                        </div>
                      )}

                      {/* ステータスバッジ */}
                      <div className="mb-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          slot.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : slot.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : slot.status === 'booked'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {statusLabel[slot.status] || slot.status}
                        </span>
                        {isPast && (
                          <span className="ml-2 text-xs text-gray-500">
                            （過去）
                          </span>
                        )}
                      </div>

                      {/* 予約情報（pending, booked, cancelledの場合） */}
                      {appointment && (
                        <div className="mt-3 rounded-md bg-white bg-opacity-50 p-3">
                          <h4 className="mb-2 text-sm font-semibold text-gray-900">予約情報</h4>
                          <dl className="space-y-1 text-sm text-gray-700">
                            {appointment.companies && (
                              <div>
                                <dt className="inline font-medium">法人: </dt>
                                <dd className="inline">
                                  {Array.isArray(appointment.companies)
                                    ? appointment.companies[0]?.name
                                    : appointment.companies.name}
                                </dd>
                              </div>
                            )}
                            <div>
                              <dt className="inline font-medium">社員名: </dt>
                              <dd className="inline">{appointment.employee_name}</dd>
                            </div>
                            <div>
                              <dt className="inline font-medium">社員ID: </dt>
                              <dd className="inline">{appointment.employee_id}</dd>
                            </div>
                          </dl>
                        </div>
                      )}
                    </div>

                    {/* 削除ボタン */}
                    <div>
                      {canDelete ? (
                        <DeleteSlotButton slotId={slot.id} />
                      ) : (
                        <div className="text-xs text-gray-500">
                          {isPast && '（過去の枠）'}
                          {slot.status !== 'available' && '（削除不可）'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
