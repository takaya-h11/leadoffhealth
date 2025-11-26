import { createClient } from '@/utils/supabase/server'
import { NotificationsDropdown } from './notifications-dropdown'
import Link from 'next/link'

export async function ProtectedHeader() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // ユーザー情報を取得
  const { data: userProfile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // ロール別のダッシュボードリンク
  const _getDashboardLink = (role: string | null | undefined) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard'
      case 'therapist':
        return '/therapist/dashboard'
      case 'company_user':
        return '/company/dashboard'
      default:
        return '/dashboard'
    }
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-end">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{userProfile?.full_name || user.email}</span>
            <NotificationsDropdown />
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
