import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { updateServiceMenu } from '../actions'
import { ActionButtons } from './action-buttons'
import { translateMessage } from '@/utils/messages'

export default async function EditServiceMenuPage({
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
  const menuId = resolvedParams.id

  // 施術メニュー情報を取得
  const { data: serviceMenu } = await supabase
    .from('service_menus')
    .select('*')
    .eq('id', menuId)
    .single()

  if (!serviceMenu) {
    notFound()
  }

  const resolvedSearchParams = await searchParams
  const message = resolvedSearchParams.message

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/admin/service-menus"
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            ← 施術メニュー一覧に戻る
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">施術メニュー編集</h1>
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

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <form action={updateServiceMenu} className="space-y-6">
            <input type="hidden" name="menu_id" value={menuId} />

            {/* 基本情報 */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">基本情報</h2>

              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  メニュー名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={serviceMenu.name}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700">
                  施術時間（分） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="duration_minutes"
                  name="duration_minutes"
                  required
                  min="1"
                  step="1"
                  defaultValue={serviceMenu.duration_minutes}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  料金（円） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  required
                  min="0"
                  step="100"
                  defaultValue={serviceMenu.price}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  説明
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={serviceMenu.description || ''}
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
                    defaultChecked={serviceMenu.is_active}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">有効</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  ※無効にすると新規予約で選択できなくなります
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <ActionButtons menuId={menuId} />

              <div className="flex space-x-4">
                <Link
                  href="/admin/service-menus"
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </Link>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  更新
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
