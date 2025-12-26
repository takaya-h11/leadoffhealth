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

  const role = formData.get('role') as 'admin' | 'therapist' | 'company_user' | 'employee' | 'employee2'

  const demoUsers = {
    admin: { email: 'admin@demo.com', password: 'demo123' },
    therapist: { email: 'therapist@demo.com', password: 'demo123' },
    company_user: { email: 'company@demo.com', password: 'demo123' },
    employee: { email: 'employee@demo.com', password: 'demo123' },
    employee2: { email: 'employee2@demo.com', password: 'demo123' },
  }

  const credentials = demoUsers[role]

  if (!credentials) {
    redirect('/login?message=Invalid+role')
  }

  const { error } = await supabase.auth.signInWithPassword(credentials)

  if (error) {
    console.error('Demo login error:', {
      role,
      email: credentials.email,
      errorCode: error.code,
      errorMessage: error.message,
      errorStatus: error.status
    })
    redirect(`/login?message=Demo+login+failed:+${encodeURIComponent(error.message)}`)
  }

  // must_change_password チェック
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    console.log('[DEBUG] Fetching user profile for:', user.id, 'role:', role)

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('must_change_password')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[ERROR] Failed to fetch user profile:', {
        userId: user.id,
        role,
        error: profileError,
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      })
      redirect(`/login?message=Profile+check+failed:+${encodeURIComponent(profileError.message)}`)
    }

    console.log('[DEBUG] User profile fetched successfully:', userProfile)

    if (userProfile?.must_change_password) {
      revalidatePath('/', 'layout')
      redirect('/auth/update-password')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
