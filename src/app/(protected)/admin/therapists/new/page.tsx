import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TherapistForm from './therapist-form'

export default async function NewTherapistPage({
  searchParams,
}: {
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

  // まだ整体師として登録されていない管理者ユーザーを取得
  const { data: adminUsers } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      role
    `)
    .eq('role', 'admin')
    .eq('is_active', true)

  // therapistsテーブルに既に登録されているuser_idを取得
  const { data: existingTherapists } = await supabase
    .from('therapists')
    .select('user_id')

  const existingTherapistUserIds = new Set(
    existingTherapists?.map(t => t.user_id) || []
  )

  // まだ整体師として登録されていない管理者のみをフィルター
  const availableAdminUsers = adminUsers?.filter(
    user => !existingTherapistUserIds.has(user.id)
  ) || []

  const params = await searchParams
  const message = params.message

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/admin/therapists"
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            ← 整体師一覧に戻る
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">新規整体師登録</h1>
        </div>

        {message && (
          <div className={`mb-4 rounded-md p-4 ${
            message.includes('success') || message.includes('password')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        <TherapistForm existingAdminUsers={availableAdminUsers} />
      </div>
    </div>
  )
}
