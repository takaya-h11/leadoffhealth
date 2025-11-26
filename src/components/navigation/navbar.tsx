import { createClient } from '@/utils/supabase/server'
import { NavbarClient } from './navbar-client'

export async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ユーザー情報を取得（ロール表示用）
  let userProfile = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single()
    userProfile = data
  }

  return <NavbarClient user={user} userProfile={userProfile} />
}
