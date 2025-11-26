import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { updateCompanyUser } from '../actions'
import { ActionButtons } from './action-buttons'

export default async function EditCompanyUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
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

  const resolvedParams = await params
  const userId = resolvedParams.id

  // 法人担当者情報を取得
  const { data: companyUser } = await supabase
    .from('users')
    .select(`
      *,
      companies (
        id,
        name
      )
    `)
    .eq('id', userId)
    .eq('role', 'company_user')
    .single()

  if (!companyUser) {
    notFound()
  }

  // 有効な法人一覧を取得
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const resolvedSearchParams = await searchParams
  const message = resolvedSearchParams.message

  // companies が配列で返ってくるので、最初の要素を取得
  const _companyData = Array.isArray(companyUser.companies)
    ? companyUser.companies[0]
    : companyUser.companies

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/admin/company-users"
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            ← 法人担当者一覧に戻る
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">法人担当者情報編集</h1>
        </div>

        {message && (
          <div className={`mb-4 rounded-md p-4 ${
            message.includes('success') || message.includes('password')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <form action={updateCompanyUser} className="space-y-6">
            <input type="hidden" name="user_id" value={userId} />

            {/* 基本情報 */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">基本情報</h2>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  type="email"
                  id="email"
                  value={companyUser.email || ''}
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">※メールアドレスは変更できません</p>
              </div>

              <div className="mb-4">
                <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
                  所属法人 <span className="text-red-500">*</span>
                </label>
                <select
                  id="company_id"
                  name="company_id"
                  required
                  defaultValue={companyUser.company_id || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {companies?.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  氏名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  required
                  defaultValue={companyUser.full_name || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  電話番号
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  defaultValue={companyUser.phone || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            {/* ステータス */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">ステータス</h2>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    value="true"
                    defaultChecked={companyUser.is_active}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">アカウント有効</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  ※無効にするとログインできなくなります
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  更新
                </button>
                <Link
                  href="/admin/company-users"
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </Link>
              </div>
            </div>
          </form>

          {/* Action buttons (client component) */}
          <div className="mt-6">
            <ActionButtons userId={userId} />
          </div>
        </div>
      </div>
    </div>
  )
}
