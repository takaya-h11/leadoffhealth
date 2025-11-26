import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{
    role?: string
    status?: string
    company?: string
    search?: string
  }>
}

export default async function UsersPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

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

  // クエリビルダー
  let query = supabase
    .from('users')
    .select(`
      *,
      companies (
        id,
        name
      ),
      therapists (
        id,
        license_number,
        is_available
      )
    `)

  // ロールでフィルター
  if (params.role) {
    query = query.eq('role', params.role)
  }

  // ステータスでフィルター
  if (params.status === 'active') {
    query = query.eq('is_active', true)
  } else if (params.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  // 法人でフィルター
  if (params.company) {
    query = query.eq('company_id', params.company)
  }

  // 検索（氏名・メールアドレス）
  if (params.search) {
    query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
  }

  const { data: users } = await query.order('created_at', { ascending: false })

  // 法人一覧を取得（フィルター用）
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
          <div className="flex space-x-4">
            <Link
              href="/admin/therapists/new"
              className="rounded-md border border-blue-600 bg-white px-4 py-2 text-blue-600 hover:bg-blue-50"
            >
              整体師登録
            </Link>
            <Link
              href="/admin/company-users/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              法人担当者登録
            </Link>
          </div>
        </div>

        {/* 検索・フィルターフォーム */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow">
          <form method="get" className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                検索
              </label>
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={params.search}
                placeholder="氏名・メールアドレス"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                ロール
              </label>
              <select
                id="role"
                name="role"
                defaultValue={params.role}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">すべて</option>
                <option value="admin">管理者</option>
                <option value="therapist">整体師</option>
                <option value="company_user">法人担当者</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                ステータス
              </label>
              <select
                id="status"
                name="status"
                defaultValue={params.status}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">すべて</option>
                <option value="active">有効</option>
                <option value="inactive">無効</option>
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">すべて</option>
                {companies?.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end md:col-span-4">
              <button
                type="submit"
                className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                検索
              </button>
              <Link
                href="/admin/users"
                className="ml-4 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                リセット
              </Link>
            </div>
          </form>
        </div>

        {/* ユーザー一覧テーブル */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  氏名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  メールアドレス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ロール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  所属
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
              {users?.map((u) => {
                // companies と therapists が配列で返ってくる可能性があるので処理
                const companyData = Array.isArray(u.companies) ? u.companies[0] : u.companies
                const therapistData = Array.isArray(u.therapists) ? u.therapists[0] : u.therapists

                // 整体師の場合はtherapists.idを使用、それ以外はusers.idを使用
                const editId = u.role === 'therapist' && therapistData?.id ? therapistData.id : u.id

                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{u.full_name}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">{u.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'therapist'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role === 'admin' ? '管理者' : u.role === 'therapist' ? '整体師' : '法人担当者'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {companyData?.name || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        u.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {u.is_active ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      {u.role === 'therapist' && (
                        <Link
                          href={`/admin/therapists/${editId}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          編集
                        </Link>
                      )}
                      {u.role === 'company_user' && (
                        <Link
                          href={`/admin/company-users/${u.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          編集
                        </Link>
                      )}
                      {u.role === 'admin' && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {users?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            該当するユーザーが見つかりませんでした
          </div>
        )}

        {/* 件数表示 */}
        <div className="mt-4 text-sm text-gray-500">
          {users?.length || 0}件のユーザーが見つかりました
        </div>
      </div>
    </div>
  )
}
