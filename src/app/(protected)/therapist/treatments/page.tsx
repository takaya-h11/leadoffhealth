import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{
    search?: string
    from?: string
    to?: string
    therapist?: string
    company?: string
    symptom?: string
  }>
}

export default async function TherapistTreatmentHistoryPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 整体師権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'therapist' && userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // クエリビルダー
  let query = supabase
    .from('treatment_records')
    .select(`
      *,
      appointments!inner (
        employee_name,
        employee_id,
        company_id,
        companies (
          id,
          name
        ),
        available_slots!inner (
          start_time,
          therapist_id,
          therapists (
            id,
            users (
              full_name
            )
          )
        )
      ),
      treatment_symptoms (
        symptom_id,
        symptoms (
          name
        )
      )
    `)

  // 検索（社員名・社員ID）
  if (params.search) {
    query = query.or(
      `appointments.employee_name.ilike.%${params.search}%,appointments.employee_id.ilike.%${params.search}%`
    )
  }

  // 整体師でフィルター
  if (params.therapist) {
    query = query.eq('appointments.available_slots.therapist_id', params.therapist)
  }

  // 法人でフィルター
  if (params.company) {
    query = query.eq('appointments.company_id', params.company)
  }

  // 日付範囲でフィルター
  if (params.from) {
    const fromDate = new Date(params.from)
    query = query.gte('appointments.available_slots.start_time', fromDate.toISOString())
  }
  if (params.to) {
    const toDate = new Date(params.to)
    toDate.setHours(23, 59, 59, 999)
    query = query.lte('appointments.available_slots.start_time', toDate.toISOString())
  }

  const { data: treatments } = await query.order('created_at', { ascending: false }).limit(100)

  // フィルター用データ取得
  const { data: therapists } = await supabase
    .from('therapists')
    .select('id, users(full_name)')
    .eq('is_available', true)

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true)

  const { data: symptoms } = await supabase
    .from('symptoms')
    .select('id, name')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // 症状でフィルター（クライアントサイドで処理）
  let filteredTreatments = treatments || []
  if (params.symptom) {
    filteredTreatments = filteredTreatments.filter((treatment) => {
      const treatmentSymptoms = Array.isArray(treatment.treatment_symptoms)
        ? treatment.treatment_symptoms
        : []
      return treatmentSymptoms.some((ts: { symptom_id: string }) => ts.symptom_id === params.symptom)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">施術履歴</h1>

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
                  placeholder="社員名・社員ID"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
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
                <label htmlFor="symptom" className="block text-sm font-medium text-gray-700">
                  症状
                </label>
                <select
                  id="symptom"
                  name="symptom"
                  defaultValue={params.symptom}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">すべて</option>
                  {symptoms?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
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
                href="/therapist/treatments"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                リセット
              </Link>
            </div>
          </form>
        </div>

        {filteredTreatments && filteredTreatments.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTreatments.map((treatment) => {
                const appointment = Array.isArray(treatment.appointments)
                  ? treatment.appointments[0]
                  : treatment.appointments
                const company = Array.isArray(appointment?.companies)
                  ? appointment.companies[0]
                  : appointment?.companies
                const slot = Array.isArray(appointment?.available_slots)
                  ? appointment.available_slots[0]
                  : appointment?.available_slots
                const therapist = Array.isArray(slot?.therapists)
                  ? slot.therapists[0]
                  : slot?.therapists
                const therapistUser = Array.isArray(therapist?.users)
                  ? therapist.users[0]
                  : therapist?.users
                const startTime = slot?.start_time ? new Date(slot.start_time) : null

                const treatmentSymptoms = Array.isArray(treatment.treatment_symptoms)
                  ? treatment.treatment_symptoms
                  : []
                const symptomNames = treatmentSymptoms
                  .map((ts: { symptoms: { name: string } | { name: string }[] }) => {
                    const symptom = Array.isArray(ts.symptoms) ? ts.symptoms[0] : ts.symptoms
                    return symptom?.name
                  })
                  .filter(Boolean) as string[]

                return (
                  <div key={treatment.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      {company?.name || '不明'} - {appointment?.employee_name || '不明'}
                    </h3>
                    <div className="mb-4 space-y-1 text-sm text-gray-600">
                      <div>整体師: {therapistUser?.full_name || '不明'}</div>
                      <div>社員ID: {appointment?.employee_id || '不明'}</div>
                      <div>
                        日時:{' '}
                        {startTime
                          ? startTime.toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : '不明'}
                      </div>
                      <div>施術時間: {treatment.actual_duration_minutes}分</div>
                    </div>

                    <div className="mb-4 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">症状: </span>
                        <span className="text-gray-900">
                          {symptomNames.length > 0 ? symptomNames.join(', ') : '-'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">改善度: </span>
                          <span className="font-semibold text-blue-600">{treatment.improvement_level}/5</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">満足度: </span>
                          <span className="font-semibold text-green-600">{treatment.satisfaction_level}/5</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/therapist/treatments/${treatment.id}`}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      詳細を見る
                      <svg
                        className="ml-1 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 text-sm text-gray-500">{filteredTreatments.length}件の施術履歴が見つかりました</div>
          </>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            該当する施術履歴が見つかりませんでした
          </div>
        )}
      </div>
    </div>
  )
}
