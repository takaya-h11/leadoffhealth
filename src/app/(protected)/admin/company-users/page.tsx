import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CompanyUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ユーザーのロールを確認
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // 法人担当者一覧を取得（usersとcompaniesをJOIN）
  const { data: companyUsers } = await supabase
    .from('users')
    .select(`
      *,
      companies (
        id,
        name,
        is_active
      )
    `)
    .eq('role', 'company_user')
    .order('created_at', { ascending: false })

  const params = await searchParams
  const message = params.message

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">法人担当者・整体利用者管理</h1>
          <Link
            href="/admin/company-users/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            新規担当者登録
          </Link>
        </div>

        {message && (
          <div className={`mb-4 rounded-md p-4 ${
            message.includes('success') || message.includes('password') || message.includes('created')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* 法人担当者一覧テーブル */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  氏名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  所属法人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  連絡先
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ステータス
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {companyUsers?.map((companyUser) => {
                // companies が配列で返ってくるので、最初の要素を取得
                const companyData = Array.isArray(companyUser.companies)
                  ? companyUser.companies[0]
                  : companyUser.companies

                return (
                  <tr key={companyUser.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{companyUser.full_name}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {companyData?.name || '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">{companyUser.email}</div>
                      <div className="text-sm text-gray-500">{companyUser.phone || '-'}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        companyUser.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {companyUser.is_active ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/admin/company-users/${companyUser.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        編集
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {companyUsers?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            登録されている法人担当者がいません
          </div>
        )}
      </div>
    </div>
  )
}
