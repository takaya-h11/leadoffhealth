import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SlotForm from './slot-form'

export default async function NewSlotPage({
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
    .select(`
      role,
      therapists (
        id
      )
    `)
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'therapist' && userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // therapistsが配列で返ってくる可能性があるので処理
  const therapistData = Array.isArray(userProfile.therapists)
    ? userProfile.therapists[0]
    : userProfile.therapists

  if (!therapistData) {
    redirect('/dashboard?message=' + encodeURIComponent('整体師情報が見つかりません'))
  }

  // 有効な施術メニュー一覧を取得
  const { data: serviceMenus } = await supabase
    .from('service_menus')
    .select('*')
    .eq('is_active', true)
    .order('duration_minutes')

  const params = await searchParams
  const message = params.message

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/therapist/slots"
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            ← 空き枠一覧に戻る
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">空き枠登録</h1>
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

        <SlotForm
          therapistId={therapistData.id}
          serviceMenus={serviceMenus || []}
        />
      </div>
    </div>
  )
}
