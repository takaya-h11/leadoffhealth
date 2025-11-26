'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createCompany(formData: FormData) {
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

  const name = formData.get('name')
  const email = formData.get('email')

  // バリデーション
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    redirect('/admin/companies/new?message=' + encodeURIComponent('法人名は必須です'))
  }

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    redirect('/admin/companies/new?message=' + encodeURIComponent('メールアドレスは必須です'))
  }

  const address = formData.get('address')
  const phone = formData.get('phone')
  const contract_start_date = formData.get('contract_start_date')
  const contract_end_date = formData.get('contract_end_date')
  const notes = formData.get('notes')

  const company = {
    name: name as string,
    address: address && typeof address === 'string' ? address : null,
    phone: phone && typeof phone === 'string' ? phone : null,
    email: email as string,
    contract_start_date: contract_start_date && typeof contract_start_date === 'string' ? contract_start_date : null,
    contract_end_date: contract_end_date && typeof contract_end_date === 'string' ? contract_end_date : null,
    notes: notes && typeof notes === 'string' ? notes : null,
    is_active: true,
  }

  const { error } = await supabase
    .from('companies')
    .insert(company)

  if (error) {
    console.error('Company creation error:', error)
    redirect('/admin/companies/new?message=' + encodeURIComponent('法人の登録に失敗しました'))
  }

  revalidatePath('/admin/companies')
  redirect('/admin/companies?message=' + encodeURIComponent('法人を登録しました'))
}

export async function updateCompany(formData: FormData) {
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

  const id = formData.get('company_id') as string
  const name = formData.get('name')
  const email = formData.get('email')

  // バリデーション
  if (!id) {
    redirect('/admin/companies?message=' + encodeURIComponent('法人IDが必要です'))
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    redirect(`/admin/companies/${id}?message=` + encodeURIComponent('法人名は必須です'))
  }

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    redirect(`/admin/companies/${id}?message=` + encodeURIComponent('メールアドレスは必須です'))
  }

  const address = formData.get('address')
  const phone = formData.get('phone')
  const contract_start_date = formData.get('contract_start_date')
  const contract_end_date = formData.get('contract_end_date')
  const notes = formData.get('notes')
  const is_active = formData.get('is_active')

  const company = {
    name: name as string,
    address: address && typeof address === 'string' ? address : null,
    phone: phone && typeof phone === 'string' ? phone : null,
    email: email as string,
    contract_start_date: contract_start_date && typeof contract_start_date === 'string' ? contract_start_date : null,
    contract_end_date: contract_end_date && typeof contract_end_date === 'string' ? contract_end_date : null,
    notes: notes && typeof notes === 'string' ? notes : null,
    is_active: is_active === 'true',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('companies')
    .update(company)
    .eq('id', id)

  if (error) {
    console.error('Company update error:', error)
    redirect(`/admin/companies/${id}?message=` + encodeURIComponent('法人情報の更新に失敗しました'))
  }

  revalidatePath('/admin/companies')
  revalidatePath(`/admin/companies/${id}`)
  redirect(`/admin/companies/${id}?message=` + encodeURIComponent('法人情報を更新しました'))
}

export async function deleteCompany(formData: FormData) {
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

  const id = formData.get('company_id') as string

  if (!id) {
    redirect('/admin/companies?message=' + encodeURIComponent('法人IDが必要です'))
  }

  // 論理削除（is_activeをfalseに変更）
  const { error } = await supabase
    .from('companies')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Company deletion error:', error)
    redirect(`/admin/companies/${id}?message=` + encodeURIComponent('法人の無効化に失敗しました'))
  }

  revalidatePath('/admin/companies')
  redirect('/admin/companies?message=' + encodeURIComponent('法人を無効化しました'))
}
