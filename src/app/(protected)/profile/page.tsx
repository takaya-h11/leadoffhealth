import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { updateProfile } from './actions'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // usersテーブルからユーザー情報を取得
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const params = await searchParams
  const message = params.message

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>

        <h1 className="mb-8 text-3xl font-bold text-gray-900">プロフィール設定</h1>

        {message && (
          <div
            className={`mb-6 rounded-md p-4 text-sm ${
              message.includes('success')
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message === 'Profile updated successfully' && 'プロフィールを更新しました'}
            {message === 'Failed to update profile' && 'プロフィールの更新に失敗しました'}
            {message === 'Full name is required' && '氏名は必須項目です'}
          </div>
        )}

        <form action={updateProfile} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              defaultValue={user.email}
              disabled
              className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              メールアドレスは変更できません
            </p>
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              氏名 <span className="text-red-600">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={userProfile?.full_name || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="山田 太郎"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              電話番号
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={userProfile?.phone || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="090-1234-5678"
            />
          </div>

          <div className="rounded-md bg-blue-50 p-4">
            <h3 className="mb-2 text-sm font-medium text-blue-900">アカウント情報</h3>
            <dl className="space-y-1 text-sm text-blue-800">
              <div className="flex justify-between">
                <dt>ロール:</dt>
                <dd className="font-medium">
                  {userProfile?.role === 'admin' && '管理者'}
                  {userProfile?.role === 'therapist' && '整体師'}
                  {userProfile?.role === 'company_user' && '法人担当者'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>アカウント状態:</dt>
                <dd className="font-medium">
                  {userProfile?.is_active ? '有効' : '無効'}
                </dd>
              </div>
              {userProfile?.company_id && (
                <div className="flex justify-between">
                  <dt>法人ID:</dt>
                  <dd className="font-mono text-xs">{userProfile.company_id}</dd>
                </div>
              )}
            </dl>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            保存
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-medium text-gray-900">アカウント作成日時</h3>
          <p className="text-sm text-gray-600">
            {new Date(user.created_at).toLocaleString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
