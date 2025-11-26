import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAppointment } from '@/app/(protected)/company/appointments/actions'

interface PageProps {
  params: Promise<{
    companyId: string
  }>
  searchParams: Promise<{
    slot?: string
    message?: string
  }>
}

export default async function AdminNewAppointmentPage({ params, searchParams }: PageProps) {
  const supabase = await createClient()
  const { companyId } = await params
  const queryParams = await searchParams

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

  const slotId = queryParams.slot
  const message = queryParams.message

  if (!slotId) {
    redirect(`/admin/book/${companyId}?message=` + encodeURIComponent(`時間枠を選択してください`))
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

  // 空き枠情報を取得
  const { data: slot } = await supabase
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
    .eq('status', 'available')
    .single()

  if (!slot) {
    redirect(`/admin/book/${companyId}?message=` + encodeURIComponent(`この時間枠は予約できません`))
  }

  // 症状マスター一覧を取得
  const { data: symptoms } = await supabase
    .from('symptoms')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  const therapist = Array.isArray(slot.therapists) ? slot.therapists[0] : slot.therapists
  const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users
  const serviceMenu = Array.isArray(slot.service_menus) ? slot.service_menus[0] : slot.service_menus

  const startTime = new Date(slot.start_time)
  const endTime = new Date(slot.end_time)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">予約申込（{company.name}）</h1>

        {message && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
            <p className="text-sm">{message}</p>
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
              <span className="font-medium">担当整体師:</span> {therapistUser?.full_name || '不明'}
            </p>
            <p>
              <span className="font-medium">施術メニュー:</span> {serviceMenu?.name || '不明'} （{serviceMenu?.duration_minutes || 0}分）
            </p>
            <p>
              <span className="font-medium">料金:</span> ¥{serviceMenu?.price?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* 予約申込フォーム */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">社員情報入力</h2>

          <form action={createAppointment} method="POST" className="space-y-6">
            <input type="hidden" name="slot_id" value={slotId} />
            <input type="hidden" name="company_id" value={companyId} />
            <input type="hidden" name="admin_booking" value="true" />

            <div>
              <label htmlFor="employee_name" className="block text-sm font-medium text-gray-700">
                社員名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="employee_name"
                name="employee_name"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="山田 太郎"
              />
            </div>

            <div>
              <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
                社員ID（社員番号） <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="employee_id"
                name="employee_id"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="EMP001"
              />
              <p className="mt-1 text-xs text-gray-500">
                ※ 同姓同名の方がいる場合の識別のため、必ず入力してください
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                症状 <span className="text-gray-400">（複数選択可）</span>
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

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                要望・特記事項
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="痛みの詳細や特に気になる箇所などをご記入ください"
              />
            </div>

            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">キャンセルポリシー</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc space-y-1 pl-5">
                      <li>予約のキャンセルは前日20時まで可能です</li>
                      <li>申込後、整体師が承認するまでお待ちください</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href={`/admin/book/${companyId}`}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                予約を申し込む
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
