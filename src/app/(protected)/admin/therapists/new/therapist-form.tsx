'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createTherapist, addTherapistToExistingUser } from '../actions'

type User = {
  id: string
  email: string
  full_name: string
  role: string
}

type TherapistFormProps = {
  existingAdminUsers: User[]
}

export default function TherapistForm({ existingAdminUsers }: TherapistFormProps) {
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setIsSubmitting(true)

    try {
      if (mode === 'new') {
        await createTherapist(formData)
      } else {
        // 既存ユーザーの場合
        if (!selectedUserId) {
          setError('ユーザーを選択してください')
          setIsSubmitting(false)
          return
        }
        formData.append('user_id', selectedUserId)
        await addTherapistToExistingUser(formData)
      }
    } catch (err) {
      console.error('Form submission error:', err)
      setError('予期しないエラーが発生しました')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* モード選択 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          登録方法を選択
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'new'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            新規ユーザーを作成
          </button>
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'existing'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            既存ユーザーから選択
          </button>
        </div>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        handleSubmit(formData)
      }} className="space-y-6">

        {mode === 'existing' && (
          <div className="mb-6">
            <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
              ユーザーを選択 <span className="text-red-500">*</span>
            </label>
            <select
              id="user_id"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              disabled={isSubmitting}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">選択してください</option>
              {existingAdminUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.email}) - {user.role === 'admin' ? '管理者' : user.role}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500">
              ※ まだ整体師として登録されていない管理者ユーザーのみ表示されます
            </p>
          </div>
        )}

        {mode === 'new' && (
          <>
            {/* 基本情報 */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">基本情報</h2>

              <div className="mb-4">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  氏名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  required
                  disabled={isSubmitting}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  disabled={isSubmitting}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
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
                  disabled={isSubmitting}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </>
        )}

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
              disabled={isSubmitting}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
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
              placeholder="例: 肩こり, 腰痛, スポーツ外傷"
              disabled={isSubmitting}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
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
              disabled={isSubmitting}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '登録中...' : '登録'}
          </button>
          <Link
            href="/admin/therapists"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  )
}
