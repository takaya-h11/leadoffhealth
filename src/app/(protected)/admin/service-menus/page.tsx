import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { translateMessage } from '@/utils/messages'

export default async function ServiceMenusPage({
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

  // 施術メニュー一覧を取得
  const { data: serviceMenus } = await supabase
    .from('service_menus')
    .select('*')
    .order('duration_minutes')

  const params = await searchParams
  const message = params.message

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">施術メニュー管理</h1>
          <Link
            href="/admin/service-menus/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            新規メニュー追加
          </Link>
        </div>

        {message && (
          <div className={`mb-4 rounded-md p-4 ${
            message.includes('success')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            <p className="text-sm">{translateMessage(message)}</p>
          </div>
        )}

        {/* 施術メニュー一覧 */}
        <div className="space-y-4">
          {serviceMenus?.map((menu) => (
            <div
              key={menu.id}
              className={`rounded-lg border p-6 shadow ${
                menu.is_active
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-300 bg-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {menu.name}
                    </h3>
                    {!menu.is_active && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                        無効
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {menu.description || '説明なし'}
                  </p>
                  <div className="mt-4 flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-700">
                        {menu.duration_minutes}分
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">
                        ¥{menu.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/admin/service-menus/${menu.id}`}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  編集
                </Link>
              </div>
            </div>
          ))}
        </div>

        {serviceMenus?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            登録されている施術メニューがありません
          </div>
        )}
      </div>
    </div>
  )
}
