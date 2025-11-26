import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { updateTherapist } from '../actions'
import { ActionButtons } from './action-buttons'

export default async function EditTherapistPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ユーザーのロールを確認
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const resolvedParams = await params
  const therapistId = resolvedParams.id

  // 整体師情報を取得（usersとtherapistsをJOIN）
  const { data: therapist } = await supabase
    .from('therapists')
    .select(`
      id,
      user_id,
      license_number,
      specialties,
      bio,
      is_available,
      users!inner (
        id,
        email,
        full_name,
        phone,
        is_active
      )
    `)
    .eq('id', therapistId)
    .single()

  // users が配列で返ってくるので、最初の要素を取得
  const userData = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users

  if (!therapist) {
    notFound()
  }

  const resolvedSearchParams = await searchParams
  const message = resolvedSearchParams.message

  // specialtiesをカンマ区切り文字列に変換
  const specialtiesString = therapist.specialties?.join(', ') || ''

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/admin/therapists"
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            ← 整体師一覧に戻る
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">整体師情報編集</h1>
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

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <form action={updateTherapist} className="space-y-6">
            <input type="hidden" name="therapist_id" value={therapistId} />

            {/* 基本情報 */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">基本情報</h2>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  type="email"
                  id="email"
                  value={userData?.email || ''}
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">※メールアドレスは変更できません</p>
              </div>

              <div className="mb-4">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  氏名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  required
                  defaultValue={userData?.full_name || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  電話番号
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  defaultValue={userData?.phone || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 整体師情報 */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">整体師情報</h2>

              <div className="mb-4">
                <label htmlFor="license_number" className="block text-sm font-medium text-gray-700">
                  免許番号
                </label>
                <input
                  type="text"
                  id="license_number"
                  name="license_number"
                  defaultValue={therapist.license_number || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="specialties" className="block text-sm font-medium text-gray-700">
                  専門分野（カンマ区切り）
                </label>
                <input
                  type="text"
                  id="specialties"
                  name="specialties"
                  defaultValue={specialtiesString}
                  placeholder="例: 肩こり, 腰痛, スポーツ外傷"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  自己紹介
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  defaultValue={therapist.bio || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            {/* ステータス */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">ステータス</h2>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    value="true"
                    defaultChecked={userData?.is_active}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">アカウント有効</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  ※無効にするとログインできなくなります
                </p>
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_available"
                    value="true"
                    defaultChecked={therapist.is_available}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">予約受付可能</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  ※無効にすると新規予約を受け付けなくなります
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  更新
                </button>
                <Link
                  href="/admin/therapists"
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </Link>
              </div>

              <ActionButtons therapistId={therapistId} />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
