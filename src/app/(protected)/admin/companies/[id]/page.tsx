import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { updateCompany, deleteCompany } from '../actions'

export default async function EditCompanyPage({
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

  const { id } = await params
  const searchParamsData = await searchParams
  const message = searchParamsData.message

  // 法人情報を取得
  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !company) {
    redirect('/admin/companies?message=' + encodeURIComponent('法人が見つかりません'))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/admin/companies"
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            ← 法人一覧に戻る
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">法人情報編集</h1>
        </div>

        {message && (
          <div className={`mb-4 rounded-md p-4 ${
            message.includes('success')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow">
          <form action={updateCompany} className="space-y-6">
            <input type="hidden" name="company_id" value={id} />

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                法人名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                defaultValue={company.name}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                住所
              </label>
              <input
                type="text"
                name="address"
                id="address"
                defaultValue={company.address || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  電話番号
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  defaultValue={company.phone || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  defaultValue={company.email || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="contract_start_date" className="block text-sm font-medium text-gray-700">
                  契約開始日
                </label>
                <input
                  type="date"
                  name="contract_start_date"
                  id="contract_start_date"
                  defaultValue={company.contract_start_date || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="contract_end_date" className="block text-sm font-medium text-gray-700">
                  契約終了日
                </label>
                <input
                  type="date"
                  name="contract_end_date"
                  id="contract_end_date"
                  defaultValue={company.contract_end_date || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                備考
              </label>
              <textarea
                name="notes"
                id="notes"
                rows={4}
                defaultValue={company.notes || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">
                ステータス
              </label>
              <select
                name="is_active"
                id="is_active"
                defaultValue={company.is_active ? 'true' : 'false'}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="true">有効</option>
                <option value="false">無効</option>
              </select>
            </div>

            <div className="flex justify-between border-t border-gray-200 pt-6">
              <button
                formAction={deleteCompany}
                className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                無効化する
              </button>

              <div className="flex gap-4">
                <Link
                  href="/admin/companies"
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </Link>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  更新する
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
