'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createAvailableSlot } from '../actions'

type ServiceMenu = {
  id: string
  name: string
  duration_minutes: number
  price: number
}

type SlotFormProps = {
  therapistId: string
  serviceMenus: ServiceMenu[]
}

export default function SlotForm({ therapistId, serviceMenus }: SlotFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [durationWarning, setDurationWarning] = useState<string | null>(null)

  // フォームの値を管理
  const [selectedMenuId, setSelectedMenuId] = useState('')
  const [startHour, setStartHour] = useState('')
  const [startMinute, setStartMinute] = useState('')
  const [endHour, setEndHour] = useState('')
  const [endMinute, setEndMinute] = useState('')

  // 今日の日付を取得（YYYY-MM-DD形式）
  const today = new Date().toISOString().split('T')[0]

  // 時間の整合性をチェック
  useEffect(() => {
    if (!selectedMenuId || !startHour || !startMinute || !endHour || !endMinute) {
      setDurationWarning(null)
      return
    }

    // 選択された施術メニューを取得
    const selectedMenu = serviceMenus.find(menu => menu.id === selectedMenuId)
    if (!selectedMenu) {
      setDurationWarning(null)
      return
    }

    // 開始時刻と終了時刻から実際の時間を計算（分単位）
    const startTotalMinutes = parseInt(startHour) * 60 + parseInt(startMinute)
    const endTotalMinutes = parseInt(endHour) * 60 + parseInt(endMinute)
    const actualDuration = endTotalMinutes - startTotalMinutes

    // 終了時刻が開始時刻より前の場合
    if (actualDuration <= 0) {
      setDurationWarning('終了時刻は開始時刻より後にしてください')
      return
    }

    // 施術メニューの時間と一致しない場合
    if (actualDuration !== selectedMenu.duration_minutes) {
      setDurationWarning(
        `選択した施術メニューの時間は${selectedMenu.duration_minutes}分ですが、入力された時間は${actualDuration}分です。時間を確認してください。`
      )
    } else {
      setDurationWarning(null)
    }
  }, [selectedMenuId, startHour, startMinute, endHour, endMinute, serviceMenus])

  async function handleSubmit(formData: FormData) {
    setError(null)

    // 送信前に再度チェック
    const menuId = formData.get('service_menu_id') as string
    const sHour = formData.get('start_hour') as string
    const sMinute = formData.get('start_minute') as string
    const eHour = formData.get('end_hour') as string
    const eMinute = formData.get('end_minute') as string

    if (menuId && sHour && sMinute && eHour && eMinute) {
      const selectedMenu = serviceMenus.find(menu => menu.id === menuId)
      if (selectedMenu) {
        const startTotalMinutes = parseInt(sHour) * 60 + parseInt(sMinute)
        const endTotalMinutes = parseInt(eHour) * 60 + parseInt(eMinute)
        const actualDuration = endTotalMinutes - startTotalMinutes

        if (actualDuration !== selectedMenu.duration_minutes) {
          setError(
            `施術メニューの時間（${selectedMenu.duration_minutes}分）と入力された時間（${actualDuration}分）が一致しません`
          )
          return
        }
      }
    }

    setIsSubmitting(true)

    try {
      const result = await createAvailableSlot(formData)

      if (result.success) {
        // 成功時はリダイレクト
        router.push('/therapist/slots?message=' + encodeURIComponent(result.message || '空き枠を登録しました'))
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

      {durationWarning && (
        <div className="mb-4 rounded-md bg-yellow-50 p-4 text-yellow-800 border border-yellow-200">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">{durationWarning}</p>
          </div>
        </div>
      )}

      <form onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        handleSubmit(formData)
      }} className="space-y-4">
        <input
          type="hidden"
          name="therapist_id"
          value={therapistId}
        />

        <div className="mb-4">
          <label htmlFor="service_menu_id" className="block text-sm font-medium text-gray-700">
            施術メニュー <span className="text-red-500">*</span>
          </label>
          <select
            id="service_menu_id"
            name="service_menu_id"
            required
            disabled={isSubmitting}
            value={selectedMenuId}
            onChange={(e) => setSelectedMenuId(e.target.value)}
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
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
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
                value={startMinute}
                onChange={(e) => setStartMinute(e.target.value)}
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
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
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
                value={endMinute}
                onChange={(e) => setEndMinute(e.target.value)}
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
            <li>• <strong>入力する時間枠は選択した施術メニューの時間と一致させてください</strong></li>
            <li>• 予約が入っていない枠は後から削除できます</li>
            <li>• 過去の日時は登録できません</li>
          </ul>
        </div>

        <div className="flex justify-start space-x-4">
          <button
            type="submit"
            disabled={isSubmitting || !!durationWarning}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '登録中...' : '登録'}
          </button>
          <Link
            href="/therapist/slots"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  )
}
