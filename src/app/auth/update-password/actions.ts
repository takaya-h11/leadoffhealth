'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    redirect('/auth/update-password?message=Passwords do not match')
  }

  if (password.length < 6) {
    redirect('/auth/update-password?message=Password must be at least 6 characters')
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    console.error('Password update error:', error)
    redirect('/auth/update-password?message=Failed to update password')
  }

  // must_change_password を false に更新
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from('users')
      .update({ must_change_password: false })
      .eq('id', user.id)
  }

  redirect('/login?message=Password updated successfully')
}
