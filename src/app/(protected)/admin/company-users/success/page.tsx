import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import CopyPasswordButton from './CopyPasswordButton'

export default async function CompanyUserSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string
    password?: string
    fullName?: string
    companyName?: string
  }>
}) {
  const supabase = await createClient()

  // 認証確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 管理者権限確認
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const params = await searchParams
  const { email, password, fullName, companyName } = params

  // パラメータがない場合は一覧にリダイレクト
  if (!email || !password || !fullName) {
    redirect('/admin/company-users')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        {/* 成功メッセージ */}
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-center">
            <svg
              className="h-6 w-6 text-green-600 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-xl font-bold text-green-900">
              法人ユーザーを登録しました
            </h1>
          </div>
        </div>

        {/* 重要な警告 */}
        <div className="mb-6 rounded-lg bg-yellow-50 border-2 border-yellow-300 p-6">
          <div className="flex items-start">
            <svg
              className="h-6 w-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">
                以下の情報を登録したユーザーにお伝えください
              </h2>
              <p className="text-sm text-yellow-800">
                初期パスワードは一度しか表示されません。必ずユーザーに連絡してください。
              </p>
            </div>
          </div>
        </div>

        {/* 登録情報カード */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
            登録情報
          </h2>

          <dl className="space-y-4">
            {/* 氏名 */}
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">氏名</dt>
              <dd className="text-base text-gray-900">{fullName}</dd>
            </div>

            {/* 所属法人 */}
            {companyName && (
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">所属法人</dt>
                <dd className="text-base text-gray-900">{companyName}</dd>
              </div>
            )}

            {/* メールアドレス */}
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">
                メールアドレス（ログインID）
              </dt>
              <dd className="text-base text-gray-900 font-mono bg-gray-50 p-2 rounded">
                {email}
              </dd>
            </div>

            {/* 初期パスワード */}
            <div className="border-t pt-4">
              <dt className="text-sm font-medium text-gray-500 mb-1">
                初期パスワード
              </dt>
              <dd className="flex items-center gap-3">
                <code className="text-lg font-mono bg-red-50 text-red-900 px-4 py-3 rounded border-2 border-red-300 flex-1 select-all">
                  {password}
                </code>
                <CopyPasswordButton password={password} />
              </dd>
            </div>
          </dl>
        </div>

        {/* 連絡事項カード */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            ユーザーへ伝える内容
          </h2>
          <div className="text-sm text-blue-800 space-y-2">
            <p>1. ログインURL: <span className="font-mono bg-white px-2 py-1 rounded">{typeof window !== 'undefined' ? window.location.origin : 'https://your-app-url.com'}/login</span></p>
            <p>2. メールアドレス: <span className="font-mono bg-white px-2 py-1 rounded">{email}</span></p>
            <p>3. 初期パスワード: <span className="font-mono bg-white px-2 py-1 rounded">{password}</span></p>
            <p className="font-semibold mt-4">⚠️ 初回ログイン後、必ずパスワードを変更していただくようお伝えください。</p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-4">
          <Link
            href="/admin/company-users"
            className="flex-1 rounded-md bg-gray-600 px-6 py-3 text-center text-white hover:bg-gray-700 font-medium"
          >
            法人ユーザー一覧に戻る
          </Link>
          <Link
            href="/admin/company-users/new"
            className="flex-1 rounded-md bg-blue-600 px-6 py-3 text-center text-white hover:bg-blue-700 font-medium"
          >
            続けて登録する
          </Link>
        </div>

        {/* セキュリティ注意事項 */}
        <div className="mt-8 text-xs text-gray-500 border-t pt-4 space-y-2">
          <p>
            <strong>セキュリティ上の注意:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>このページを離れると初期パスワードは二度と表示されません</li>
            <li>パスワードは安全な方法（電話、対面など）で伝えてください</li>
            <li>メールやチャットでの送信は避けてください</li>
            <li>ユーザーに連絡が完了したことを確認してからページを閉じてください</li>
            <li>万が一パスワードを忘れた場合は、管理者が「パスワード再発行」を実行できます</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
