import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminSlotForm from './admin-slot-form'

export default async function AdminNewSlotPage({
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

  // 全整体師を取得
  const { data: therapists } = await supabase
    .from('therapists')
    .select(`
      id,
      user_id,
      users:user_id (
        id,
        full_name,
        is_active
      )
    `)
    .eq('users.is_active', true)

  // 有効な施術メニュー一覧を取得
  const { data: serviceMenus } = await supabase
    .from('service_menus')
    .select('*')
    .eq('is_active', true)
    .order('duration_minutes')

  const params = await searchParams
  const message = params.message

  const therapistList = therapists?.map(t => {
    const user = Array.isArray(t.users) ? t.users[0] : t.users
    return {
      id: t.id,
      name: user?.full_name || '不明'
    }
  }) || []

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/admin/slots"
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            ← 空き枠一覧に戻る
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">空き枠登録（管理者）</h1>
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

        <AdminSlotForm
          therapists={therapistList}
          serviceMenus={serviceMenus || []}
        />
      </div>
    </div>
  )
}
