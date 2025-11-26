'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createAvailableSlot } from '@/app/(protected)/therapist/slots/actions'

type ServiceMenu = {
  id: string
  name: string
  duration_minutes: number
  price: number
}

type Therapist = {
  id: string
  name: string
}

type AdminSlotFormProps = {
  therapists: Therapist[]
  serviceMenus: ServiceMenu[]
}

export default function AdminSlotForm({ therapists, serviceMenus }: AdminSlotFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 今日の日付を取得（YYYY-MM-DD形式）
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(formData: FormData) {
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await createAvailableSlot(formData)

      if (result.success) {
        // 成功時はリダイレクト
        router.push('/admin/slots?message=' + encodeURIComponent(result.message || '空き枠を登録しました'))
      } else {
        // エラー時はエラーメッセージを表示
        setError(result.message || '予期しないエラーが発生しました')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Form submission error:', error)
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

      <form action={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label htmlFor="therapist_id" className="block text-sm font-medium text-gray-700">
            整体師 <span className="text-red-500">*</span>
          </label>
          <select
            id="therapist_id"
            name="therapist_id"
            required
            disabled={isSubmitting}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">選択してください</option>
            {therapists?.map((therapist) => (
              <option key={therapist.id} value={therapist.id}>
                {therapist.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="service_menu_id" className="block text-sm font-medium text-gray-700">
            施術メニュー <span className="text-red-500">*</span>
          </label>
          <select
            id="service_menu_id"
            name="service_menu_id"
            required
            disabled={isSubmitting}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">選択してください</option>
            {serviceMenus?.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name} （{menu.duration_minutes}分 / ¥{menu.price.toLocaleString()}）
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            日付 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            required
            min={today}
            disabled={isSubmitting}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              開始時刻 <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex gap-2">
              <select
                name="start_hour"
                required
                disabled={isSubmitting}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">時</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, '0')}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className="flex items-center">:</span>
              <select
                name="start_minute"
                required
                disabled={isSubmitting}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">分</option>
                <option value="00">00</option>
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="45">45</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              終了時刻 <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex gap-2">
              <select
                name="end_hour"
                required
                disabled={isSubmitting}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">時</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, '0')}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className="flex items-center">:</span>
              <select
                name="end_minute"
                required
                disabled={isSubmitting}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">分</option>
                <option value="00">00</option>
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="45">45</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-md bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-blue-900">注意事項</h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-800">
            <li>• 終了時刻は開始時刻より後の時刻を指定してください</li>
            <li>• 施術メニューの時間と一致している必要はありません</li>
            <li>• 予約が入っていない枠は後から削除できます</li>
            <li>• 過去の日時は登録できません</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-4">
          <Link
            href="/admin/slots"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? '登録中...' : '登録'}
          </button>
        </div>
      </form>
    </div>
  )
}
