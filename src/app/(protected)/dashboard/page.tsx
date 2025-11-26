import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile to check role
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Log error for debugging
  if (error) {
    console.error('Error fetching user profile:', error)
    redirect(`/login?message=Error+fetching+profile:+${error.message}`)
  }

  // Check if userProfile exists
  if (!userProfile) {
    console.error('No user profile found for user:', user.id)
    redirect('/login?message=User+profile+not+found')
  }

  // Redirect to role-specific dashboard
  if (userProfile.role === 'admin') {
    redirect('/admin/dashboard')
  } else if (userProfile.role === 'therapist') {
    redirect('/therapist/dashboard')
  } else if (userProfile.role === 'company_user') {
    redirect('/company/dashboard')
  }

  // Fallback: if no role is found, redirect to login
  redirect('/login?message=Invalid+user+role')
}
