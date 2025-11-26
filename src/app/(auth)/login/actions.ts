'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=Could not authenticate user')
  }

  // must_change_password チェック
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('must_change_password')
      .eq('id', user.id)
      .single()

    if (userProfile?.must_change_password) {
      revalidatePath('/', 'layout')
      redirect('/auth/update-password')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/login?message=Could not create user')
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check email to continue sign in process')
}

// デモユーザーでログイン（開発環境専用）
export async function demoLogin(formData: FormData) {
  const supabase = await createClient()

  const role = formData.get('role') as 'admin' | 'therapist' | 'company_user'

  const demoUsers = {
    admin: { email: 'admin@demo.com', password: 'demo123' },
    therapist: { email: 'therapist@demo.com', password: 'demo123' },
    company_user: { email: 'company@demo.com', password: 'demo123' },
  }

  const credentials = demoUsers[role]

  if (!credentials) {
    redirect('/login?message=Invalid+role')
  }

  const { error } = await supabase.auth.signInWithPassword(credentials)

  if (error) {
    redirect('/login?message=Demo+login+failed')
  }

  // must_change_password チェック
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('must_change_password')
      .eq('id', user.id)
      .single()

    if (userProfile?.must_change_password) {
      revalidatePath('/', 'layout')
      redirect('/auth/update-password')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
