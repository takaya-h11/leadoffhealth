import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CompanyScheduleCalendar } from '@/app/(protected)/company/schedule/company-schedule-calendar'

interface PageProps {
  params: Promise<{
    companyId: string
  }>
}

export default async function AdminBookCompanyPage({ params }: PageProps) {
  const supabase = await createClient()
  const { companyId } = await params

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

  // 法人情報を取得
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (!company) {
    redirect('/admin/book/select-company?message=' + encodeURIComponent('法人が見つかりません'))
  }

  // 未来の空き枠を取得（available状態のもののみ）
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
        name
      )
    `)
    .gte('start_time', new Date().toISOString())
    .eq('status', 'available')
    .order('start_time')
    .limit(100)

  // カレンダーイベント形式に変換
  const events = slots?.map((slot) => {
    const therapist = Array.isArray(slot.therapists) ? slot.therapists[0] : slot.therapists
    const serviceMenu = Array.isArray(slot.service_menus) ? slot.service_menus[0] : slot.service_menus
    const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users
    const therapistName = therapistUser?.full_name || '不明'

    const title = `${therapistName} - ${serviceMenu?.name || '不明'}`

    return {
      id: slot.id,
      slotId: slot.id,
      title,
      start: new Date(slot.start_time),
      end: new Date(slot.end_time),
      resource: {
        therapistName,
        serviceMenuName: serviceMenu?.name || '不明',
        status: slot.status,
      },
    }
  }) || []

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">予約申込（{company.name}）</h1>
              <p className="mt-2 text-sm text-gray-600">
                予約可能な枠をクリックして申込フォームに進みます
              </p>
            </div>
            <Link
              href="/admin/book/select-company"
              className="text-sm text-blue-600 hover:text-blue-900"
            >
              ← 法人選択に戻る
            </Link>
          </div>
        </div>

        <CompanyScheduleCalendar
          events={events}
          bookingPath={`/admin/book/${companyId}/new`}
        />
      </div>
    </div>
  )
}
