import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CompanyUserForm from './CompanyUserForm'

export default async function NewCompanyUserPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
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

  // 有効な法人一覧を取得
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const params = await searchParams
  const message = params.message

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/admin/company-users"
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            ← 法人ユーザー一覧に戻る
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">新規法人ユーザー登録</h1>
          <p className="mt-2 text-sm text-gray-600">
            法人担当者（予約を申し込む人）または整体利用者（実際に施術を受ける人）を登録します。
          </p>
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

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <CompanyUserForm companies={companies || []} />
        </div>
      </div>
    </div>
  )
}
