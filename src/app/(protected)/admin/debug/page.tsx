import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminDebugPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 管理者権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // デバッグ: 生データを取得
  const { data: slots, error: slotsError } = await supabase
    .from('available_slots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: therapists, error: therapistsError } = await supabase
    .from('therapists')
    .select(`
      *,
      users:user_id (
        full_name,
        email
      )
    `)

  const { data: slotsWithJoin, error: joinError } = await supabase
    .from('available_slots')
    .select(`
      *,
      therapists:therapist_id!inner (
        id,
        user_id,
        users:user_id (
          full_name
        )
      )
    `)
    .limit(10)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">デバッグ情報</h1>

        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">現在のユーザー</h2>
          <pre className="overflow-x-auto rounded bg-gray-100 p-4">
            {JSON.stringify({ user: userProfile }, null, 2)}
          </pre>
        </div>

        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">整体師一覧</h2>
          {therapistsError && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
              エラー: {therapistsError.message}
            </div>
          )}
          <pre className="overflow-x-auto rounded bg-gray-100 p-4">
            {JSON.stringify(therapists, null, 2)}
          </pre>
        </div>

        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">空き枠（生データ）</h2>
          {slotsError && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
              エラー: {slotsError.message}
            </div>
          )}
          <pre className="overflow-x-auto rounded bg-gray-100 p-4">
            {JSON.stringify(slots, null, 2)}
          </pre>
        </div>

        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">空き枠（JOIN付き）</h2>
          {joinError && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
              エラー: {joinError.message}
            </div>
          )}
          <pre className="overflow-x-auto rounded bg-gray-100 p-4">
            {JSON.stringify(slotsWithJoin, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
