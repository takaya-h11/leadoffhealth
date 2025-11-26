import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CopyPasswordButton from '../../success/CopyPasswordButton'

export default async function PasswordResetSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ password?: string; email?: string; userName?: string }>
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

  const resolvedSearchParams = await searchParams
  const password = resolvedSearchParams.password
  const email = resolvedSearchParams.email
  const userName = resolvedSearchParams.userName

  if (!password || !email || !userName) {
    redirect(`/admin/company-users/${userId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href={`/admin/company-users/${userId}`}
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            ← ユーザー詳細に戻る
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            初期パスワード再発行完了
          </h1>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-6 shadow">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <svg
                className="h-6 w-6 text-green-600 mr-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
              <h2 className="text-xl font-semibold text-green-900">
                パスワードを再発行しました
              </h2>
            </div>
            <p className="text-sm text-green-800">
              以下の情報を法人担当者に伝えてください。
            </p>
          </div>

          {/* ユーザー情報 */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ユーザー名
              </label>
              <div className="bg-white rounded-md border border-gray-300 px-4 py-3 text-gray-900">
                {userName}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <div className="bg-white rounded-md border border-gray-300 px-4 py-3 text-gray-900">
                {email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                初期パスワード
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white rounded-md border border-gray-300 px-4 py-3 font-mono text-lg text-gray-900 select-all">
                  {password}
                </div>
                <CopyPasswordButton password={password} />
              </div>
            </div>
          </div>

          {/* 注意事項 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              重要な注意事項
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1 ml-7">
              <li>• このパスワードは厳重に管理してください</li>
              <li>• 法人担当者には安全な方法で伝えてください（電話、対面など）</li>
              <li>• メールやチャットでの送信は避けてください</li>
              <li>• ユーザーは初回ログイン時に必ずパスワード変更が必要です</li>
            </ul>
          </div>
        </div>

        {/* アクション */}
        <div className="mt-6 flex justify-end space-x-4">
          <Link
            href="/admin/company-users"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            法人担当者一覧に戻る
          </Link>
          <Link
            href={`/admin/company-users/${userId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ユーザー詳細に戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
