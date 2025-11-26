import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SymptomsPage({
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

  // 症状一覧を取得（表示順でソート）
  const { data: symptoms } = await supabase
    .from('symptoms')
    .select('*')
    .order('display_order')

  const params = await searchParams
  const message = params.message

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">症状マスター管理</h1>
            <p className="mt-2 text-sm text-gray-600">
              予約申込時と施術記録時に選択できる症状を管理します
            </p>
          </div>
          <Link
            href="/admin/symptoms/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            新規症状追加
          </Link>
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

        {/* 症状一覧 */}
        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="divide-y divide-gray-200">
            {symptoms?.map((symptom, index) => (
              <div
                key={symptom.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900">
                      {symptom.name}
                    </h3>
                    {!symptom.is_active && (
                      <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                        無効
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* 将来実装: 上下移動ボタン */}
                  <Link
                    href={`/admin/symptoms/${symptom.id}`}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    編集
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {symptoms?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            登録されている症状がありません
          </div>
        )}

        {/* 使用方法の説明 */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-900">症状マスターについて</h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-800">
            <li>• 法人担当者が予約申込時に選択できる症状の一覧です</li>
            <li>• 整体師が施術記録を記入する際にも使用されます</li>
            <li>• 表示順は上から順番に表示されます</li>
            <li>• 無効化した症状は新規選択できませんが、過去のデータは保持されます</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
