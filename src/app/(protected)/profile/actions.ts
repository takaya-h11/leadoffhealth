'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  // バリデーション
  if (!full_name || full_name.trim().length === 0) {
    redirect('/profile?message=Full name is required')
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: full_name.trim(),
      phone: phone?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Profile update error:', error)
    redirect('/profile?message=Failed to update profile')
  }

  revalidatePath('/profile')
  redirect('/profile?message=Profile updated successfully')
}
