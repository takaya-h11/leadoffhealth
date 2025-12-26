import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAppointment } from '../actions'
import { translateMessage } from '@/utils/messages'

interface PageProps {
  searchParams: Promise<{
    slot?: string
    message?: string
  }>
}

export default async function NewAppointmentPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 法人担当者または整体利用者の権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, company_id, full_name')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'company_user' && userProfile?.role !== 'employee') {
    redirect('/dashboard')
  }

  const slotId = params.slot
  const message = params.message

  if (!slotId) {
    redirect('/company/schedule?message=' + encodeURIComponent('時間枠を選択してください'))
  }

  // 空き枠情報を取得（カレンダービューを使用して予約可能かチェック）
  const { data: slot } = await supabase
    .from('calendar_slots_for_users')
    .select('*')
    .eq('slot_id', slotId)
    .single()

  // カレンダーと同じロジックで予約可能かチェック
  let isBookable = false
  if (slot) {
    if (slot.appointment_id) {
      // 予約がある場合、キャンセル済みなら予約可能
      isBookable = slot.appointment_status === 'cancelled'
    } else {
      // 予約がない場合、スロット自体がcancelledでなければ予約可能
      isBookable = slot.slot_status !== 'cancelled'
    }
  }

  if (!slot || !isBookable) {
    redirect('/company/schedule?message=' + encodeURIComponent('この時間枠は予約できません'))
  }

  // therapists, service_menus の詳細情報を取得（ビューには含まれていないため）
  const { data: slotDetails } = await supabase
    .from('available_slots')
    .select(`
      *,
      therapists (
        users (
          full_name
        )
      ),
      service_menus (
        name,
        duration_minutes,
        price
      )
    `)
    .eq('id', slotId)
    .single()

  // 症状マスター一覧を取得
  const { data: symptoms } = await supabase
    .from('symptoms')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  const therapist = Array.isArray(slotDetails?.therapists) ? slotDetails.therapists[0] : slotDetails?.therapists
  const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users
  const serviceMenu = Array.isArray(slotDetails?.service_menus) ? slotDetails.service_menus[0] : slotDetails?.service_menus

  const startTime = new Date(slot.start_time)
  const endTime = new Date(slot.end_time)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">予約申込</h1>

        {message && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
            <p className="text-sm">{translateMessage(message)}</p>
          </div>
        )}

        {/* 選択した空き枠の情報 */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-blue-900">選択した枠</h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <span className="font-medium">日時:</span>{' '}
              {startTime.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}{' '}
              {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              {' 〜 '}
              {endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p>
              <span className="font-medium">整体師:</span> {therapistUser?.full_name || '不明'}
            </p>
            <p>
              <span className="font-medium">メニュー:</span> {serviceMenu?.name || '不明'}（
              {serviceMenu?.duration_minutes || 0}分）
            </p>
            <p>
              <span className="font-medium">料金:</span> ¥
              {serviceMenu?.price?.toLocaleString() || '0'}
            </p>
          </div>
        </div>

        {/* 予約申込フォーム */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <form action={createAppointment}>
            <input type="hidden" name="slot_id" value={slotId} />

            {/* 予約者情報の表示（編集不可） */}
            <div className="mb-6 rounded-md bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">予約者情報</h3>
              <p className="text-sm text-gray-600">
                お名前: {userProfile?.full_name || '読み込み中...'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ※ 予約は本人のアカウントで行われます
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                症状（複数選択可）
              </label>
              <div className="mt-2 space-y-2">
                {symptoms?.map((symptom) => (
                  <label key={symptom.id} className="flex items-center">
                    <input
                      type="checkbox"
                      name="symptoms"
                      value={symptom.name}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{symptom.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                要望・特記事項
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="例: 長時間のデスクワークによる肩こりがひどいです。"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="mb-6 rounded-md bg-blue-50 p-4">
              <h3 className="text-sm font-semibold text-blue-900">ご確認ください</h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>• 申込と同時に予約が確定します</li>
                <li>• キャンセルはいつでも可能です</li>
                <li>• 予約確定後、整体師に通知が届きます</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-start space-x-4">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                申込
              </button>
              <Link
                href="/company/schedule"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
