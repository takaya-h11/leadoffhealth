import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CompanyScheduleCalendar } from './company-schedule-calendar'

export default async function CompanySchedulePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 法人担当者権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'company_user') {
    redirect('/dashboard')
  }

  // カレンダー用ビューから空き枠と予約を取得（今後3ヶ月分）
  const threeMonthsLater = new Date()
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

  // calendar_slots_for_users ビューを使用
  // このビューは自動的にプライバシーフィルタリングを行う:
  //   - 空き枠: company_id が NULL（全法人公開）または自社ID（自社専用）のみ表示
  //   - 予約: 自社の予約のみ詳細表示、他社の予約は「予約済み」とだけ表示
  const { data: calendarSlots } = await supabase
    .from('calendar_slots_for_users')
    .select('*')
    .gte('start_time', new Date().toISOString())
    .lte('start_time', threeMonthsLater.toISOString())
    .order('start_time')

  // カレンダーイベント形式に変換
  const events = calendarSlots?.map((slot) => {
    // ビューから取得したデータを使用
    const therapistName = slot.therapist_name || '不明'
    const serviceMenuName = slot.service_menu_name || '不明'
    const companyName = slot.company_name // 自社の予約なら法人名、他社の予約なら「予約済み」、空き枠なら null
    const userName = slot.user_name // 自社の予約のみ利用者名が入る、それ以外は null

    // ステータスの判定
    // slot.status は available_slots のステータス（available, booked, cancelled）
    let status: 'available' | 'pending' | 'booked' | 'cancelled' = 'available'

    if (companyName && userName) {
      // 自社の予約（詳細あり）→ booked
      status = 'booked'
    } else if (companyName === '予約済み') {
      // 他社の予約（「予約済み」としか表示されない）→ booked
      status = 'booked'
    } else if (slot.status === 'cancelled') {
      // キャンセル済み
      status = 'cancelled'
    } else {
      // 予約可能
      status = 'available'
    }

    // タイトルの生成
    let title = `${therapistName} - ${serviceMenuName}`
    if (companyName && userName) {
      // 自社の予約: 利用者名も表示
      title = `${therapistName} - ${serviceMenuName} (${userName})`
    } else if (companyName === '予約済み') {
      // 他社の予約: 「予約済み」とだけ表示
      title = `${therapistName} - ${serviceMenuName} (予約済み)`
    }

    return {
      id: `slot-${slot.slot_id}`,
      slotId: slot.slot_id,
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
