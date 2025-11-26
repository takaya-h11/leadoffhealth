import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { updateSymptom } from '../actions'
import { ActionButtons } from './action-buttons'

export default async function EditSymptomPage({
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
  const symptomId = resolvedParams.id

  // 症状情報を取得
  const { data: symptom } = await supabase
    .from('symptoms')
    .select('*')
    .eq('id', symptomId)
    .single()

  if (!symptom) {
    notFound()
  }

  const resolvedSearchParams = await searchParams
  const message = resolvedSearchParams.message

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/admin/symptoms"
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            ← 症状マスター一覧に戻る
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">症状編集</h1>
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
          <form action={updateSymptom} className="space-y-6">
            <input type="hidden" name="symptom_id" value={symptomId} />

            {/* 基本情報 */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">基本情報</h2>

              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  症状名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={symptom.name}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  ※ 同じ名前の症状は登録できません
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="display_order" className="block text-sm font-medium text-gray-700">
                  表示順
                </label>
                <input
                  type="number"
                  id="display_order"
                  name="display_order"
                  min="0"
                  step="1"
                  required
                  defaultValue={symptom.display_order}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  ※ 小さい数字ほど上に表示されます
                </p>
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
                    defaultChecked={symptom.is_active}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">有効</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  ※無効にすると新規選択できなくなります
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <ActionButtons symptomId={symptomId} />

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  更新
                </button>
                <Link
                  href="/admin/symptoms"
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
