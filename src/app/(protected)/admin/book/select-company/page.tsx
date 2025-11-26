import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminSelectCompanyPage() {
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

  // アクティブな法人一覧を取得
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            ← ダッシュボードに戻る
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">予約申込（法人代行）</h1>
          <p className="mt-2 text-sm text-gray-600">
            予約を申し込む法人を選択してください
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    法人名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    連絡先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    契約状況
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {!companies || companies.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      アクティブな法人がありません
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => {
                    const isActive = company.contract_start_date && company.contract_end_date
                      ? new Date() >= new Date(company.contract_start_date) && new Date() <= new Date(company.contract_end_date)
                      : true

                    return (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {company.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {company.email && <div>{company.email}</div>}
                          {company.phone && <div>{company.phone}</div>}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {isActive ? '契約中' : '契約外'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <Link
                            href={`/admin/book/${company.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            予約申込
                          </Link>
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
