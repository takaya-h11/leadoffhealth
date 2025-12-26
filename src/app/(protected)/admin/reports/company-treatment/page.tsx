import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ReportGenerationForm } from './ReportGenerationForm'

export default async function CompanyTreatmentReportPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  // アクティブ法人一覧取得
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">法人別施術レポート</h1>
          <p className="mt-2 text-sm text-gray-600">
            法人ごとの施術統計と詳細記録をPDF形式で出力します
          </p>
        </div>

        <ReportGenerationForm companies={companies || []} />

        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">使い方</h2>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex">
              <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-semibold">
                1
              </span>
              <span>レポートを作成したい法人を選択します</span>
            </li>
            <li className="flex">
              <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-semibold">
                2
              </span>
              <span>対象期間の開始日と終了日を入力します</span>
            </li>
            <li className="flex">
              <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-semibold">
                3
              </span>
              <span>「レポート生成・ダウンロード」ボタンをクリックします</span>
            </li>
            <li className="flex">
              <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-semibold">
                4
              </span>
              <span>
                PDFファイルが自動的にダウンロードされます（指定期間に施術データがない場合はエラーが表示されます）
              </span>
            </li>
          </ol>
        </div>

        <div className="mt-6 rounded-md bg-yellow-50 p-4 border border-yellow-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">注意事項</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>施術記録が多い場合、生成に時間がかかることがあります</li>
                  <li>指定期間に施術データがない場合、レポートは生成されません</li>
                  <li>身体図画像が保存されていない施術は、身体図が表示されません</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
