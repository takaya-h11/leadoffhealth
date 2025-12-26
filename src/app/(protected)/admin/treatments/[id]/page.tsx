import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BodyDiagramView } from './BodyDiagramView'
import { AdminCommentForm } from './AdminCommentForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TreatmentDetailPage({ params }: PageProps) {
  const supabase = await createClient()
  const { id: treatmentId } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ユーザー権限チェック（管理者・整体師・法人担当者）
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!userProfile) {
    redirect('/dashboard')
  }

  // 施術履歴詳細を取得
  const { data: treatment, error } = await supabase
    .from('treatment_records')
    .select(`
      *,
      appointments (
        *,
        companies (
          id,
          name
        ),
        available_slots (
          start_time,
          end_time,
          service_menus (
            name,
            duration_minutes,
            price
          ),
          therapists (
            id,
            users (
              full_name
            )
          )
        )
      ),
      treatment_symptoms (
        symptoms (
          name
        )
      ),
      therapists (
        users (
          full_name
        )
      )
    `)
    .eq('id', treatmentId)
    .single()

  if (error || !treatment) {
    redirect('/dashboard?message=' + encodeURIComponent('施術履歴が見つかりません'))
  }

  // 法人担当者の場合、自社の履歴のみ閲覧可能
  const appointment = Array.isArray(treatment.appointments)
    ? treatment.appointments[0]
    : treatment.appointments

  if (userProfile.role === 'company_user' || userProfile.role === 'employee') {
    if (appointment?.company_id !== userProfile.company_id) {
      redirect('/dashboard?message=' + encodeURIComponent('この施術履歴を閲覧する権限がありません'))
    }
  }

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
  const serviceMenu = Array.isArray(slot?.service_menus)
    ? slot.service_menus[0]
    : slot?.service_menus
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

  // 戻るリンクの決定
  const backLink =
    userProfile.role === 'admin'
      ? '/admin/treatments'
      : userProfile.role === 'therapist'
      ? '/therapist/treatments'
      : '/company/treatments'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href={backLink} className="text-sm text-blue-600 hover:text-blue-800">
            ← 施術履歴一覧に戻る
          </Link>
        </div>

        <h1 className="mb-8 text-3xl font-bold text-gray-900">施術履歴詳細</h1>

        {/* 基本情報 */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">基本情報</h2>
          <dl className="grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">法人</dt>
              <dd className="mt-1 text-base text-gray-900">{company?.name || '不明'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">社員名</dt>
              <dd className="mt-1 text-base text-gray-900">{appointment?.employee_name || '不明'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">整体師</dt>
              <dd className="mt-1 text-base text-gray-900">{therapistUser?.full_name || '不明'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">施術日時</dt>
              <dd className="mt-1 text-base text-gray-900">
                {startTime
                  ? startTime.toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    }) +
                    ' ' +
                    startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                  : '不明'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">メニュー</dt>
              <dd className="mt-1 text-base text-gray-900">{serviceMenu?.name || '不明'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">予定時間</dt>
              <dd className="mt-1 text-base text-gray-900">{serviceMenu?.duration_minutes || '-'}分</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">実際の施術時間</dt>
              <dd className="mt-1 text-base text-gray-900">{treatment.actual_duration_minutes}分</dd>
            </div>
          </dl>
        </div>

        {/* 人体図記録 */}
        <BodyDiagramView data={treatment.body_diagram_data} />

        {/* 施術内容 */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">施術内容</h2>
          <p className="whitespace-pre-wrap text-gray-700">{treatment.treatment_content}</p>
        </div>

        {/* 顧客の状態 */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">顧客の状態</h2>
          <p className="whitespace-pre-wrap text-gray-700">{treatment.patient_condition}</p>
        </div>

        {/* 症状と評価 */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">症状と評価</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">施術した症状</dt>
              <dd className="mt-1">
                <div className="flex flex-wrap gap-2">
                  {symptomNames.length > 0 ? (
                    symptomNames.map((name: string) => (
                      <span
                        key={name}
                        className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </div>
              </dd>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">改善度</dt>
                <dd className="mt-1">
                  <span className="text-2xl font-bold text-blue-600">{treatment.improvement_level}</span>
                  <span className="text-gray-500"> / 5</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">満足度</dt>
                <dd className="mt-1">
                  <span className="text-2xl font-bold text-green-600">{treatment.satisfaction_level}</span>
                  <span className="text-gray-500"> / 5</span>
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* 次回の提案 */}
        {treatment.next_recommendation && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">次回の提案</h2>
            <p className="whitespace-pre-wrap text-gray-700">{treatment.next_recommendation}</p>
          </div>
        )}

        {/* 管理者コメント（管理者のみ表示） */}
        {userProfile.role === 'admin' && (
          <AdminCommentForm
            treatmentId={treatmentId}
            initialComments={treatment.admin_comments}
          />
        )}

        {/* 記録日時 */}
        <div className="text-sm text-gray-500">
          記録日時: {new Date(treatment.created_at).toLocaleString('ja-JP')}
        </div>
      </div>
    </div>
  )
}
