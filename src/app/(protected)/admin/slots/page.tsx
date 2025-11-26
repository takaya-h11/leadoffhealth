import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DeleteSlotButton } from './delete-button'

export default async function AdminSlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const supabase = await createClient()

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

  // 未来の空き枠を取得（予約可能な枠のみ）
  const { data: slots } = await supabase
    .from('available_slots')
    .select(`
      *,
      therapists:therapist_id (
        id,
        user_id,
        users:user_id (
          full_name
        )
      ),
      service_menus:service_menu_id (
        name,
        duration_minutes
      )
    `)
    .gte('start_time', new Date().toISOString())
    .eq('status', 'available')
    .order('start_time')

  const params = await searchParams
  const message = params.message

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">空き枠管理</h1>
          <Link
            href="/admin/slots/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + 空き枠を登録
          </Link>
        </div>

        {message && (
          <div className={`mb-4 rounded-md p-4 ${
            message.includes('success') || message.includes('登録しました') || message.includes('削除しました')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="overflow-x-auto">
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
                    施術メニュー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {!slots || slots.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      登録されている空き枠はありません
                    </td>
                  </tr>
                ) : (
                  slots.map((slot) => {
                    const therapist = Array.isArray(slot.therapists) ? slot.therapists[0] : slot.therapists
                    const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users
                    const serviceMenu = Array.isArray(slot.service_menus) ? slot.service_menus[0] : slot.service_menus
                    const startTime = new Date(slot.start_time)
                    const endTime = new Date(slot.end_time)

                    return (
                      <tr key={slot.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {startTime.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}
                          <br />
                          {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {therapistUser?.full_name || '不明'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {serviceMenu?.name || '不明'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {serviceMenu?.duration_minutes || 0}分
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <DeleteSlotButton slotId={slot.id} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
