import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CompanyScheduleCalendar } from './company-schedule-calendar'

// ページキャッシュを無効化（常に最新データを取得）
export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function CompanySchedulePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 法人担当者または整体利用者の権限チェック
  const { data: userProfile} = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'company_user' && userProfile?.role !== 'employee') {
    redirect('/dashboard')
  }

  // カレンダー用ビューから空き枠と予約を取得（今後3ヶ月分）
  const threeMonthsLater = new Date()
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

  // calendar_slots_for_users ビューを使用
  const { data: calendarSlots, error: slotsError } = await supabase
    .from('calendar_slots_for_users')
    .select('*')
    .gte('start_time', new Date().toISOString())
    .lte('start_time', threeMonthsLater.toISOString())
    .order('start_time')


  // カレンダーイベント形式に変換
  const events = calendarSlots?.map((slot) => {
    const therapistName = slot.therapist_name || '不明'
    const serviceMenuName = slot.service_menu_name || '不明'
    const companyName = slot.company_name
    const userName = slot.user_name
    const requestedBy = slot.requested_by

    // ステータスの判定（承認フローなし: 申込み = 即確定）
    let status: 'available' | 'my_booking' | 'company_booking' | 'other_booking' = 'available'

    if (slot.appointment_id) {
      const appointmentStatus = slot.appointment_status

      // cancelled（キャンセル済み）は空き枠として扱う
      if (appointmentStatus === 'cancelled') {
        status = 'available'
      } else if (requestedBy === user.id) {
        // 自分が申し込んだ予約 → 濃い青
        status = 'my_booking'
      } else if (companyName && userName) {
        // 自社の他人の予約 → 薄い青
        status = 'company_booking'
      } else if (companyName === '予約済み') {
        // 他社の予約 → グレー
        status = 'other_booking'
      }
    } else {
      // 予約なし → 予約可能（緑）
      status = 'available'
    }

    // タイトルの生成
    let title = `${therapistName} - ${serviceMenuName}`
    if (status === 'my_booking') {
      title = `${therapistName} - ${serviceMenuName} (${companyName})`
    } else if (status === 'company_booking') {
      title = `${therapistName} - ${serviceMenuName} (${companyName})`
    } else if (status === 'other_booking') {
      title = `${therapistName} - ${serviceMenuName} (予約済み)`
    }

    // 重複キーを避けるため、appointment_idがあればそれを使う
    const uniqueId = slot.appointment_id 
      ? `appointment-${slot.appointment_id}` 
      : `slot-${slot.slot_id}`

    const event = {
      id: uniqueId,
      slotId: slot.slot_id,
      appointmentId: slot.appointment_id || undefined,
      title,
      start: new Date(slot.start_time),
      end: new Date(slot.end_time),
      resource: {
        therapistName,
        status,
        serviceMenuName,
        companyName: companyName || undefined,
        userName: userName || undefined,
        durationMinutes: slot.duration_minutes,
      },
    }

    return event
  }) || []

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">予約可能な空き枠</h1>
          <p className="mt-2 text-sm text-gray-600">
            空き枠をクリックして予約を申し込めます
          </p>
        </div>
        <CompanyScheduleCalendar events={events} />
      </div>
    </div>
  )
}
