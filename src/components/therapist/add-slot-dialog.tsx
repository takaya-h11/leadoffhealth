'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'

interface AddSlotDialogProps {
  isOpen: boolean
  initialStartTime?: Date
  initialEndTime?: Date
  serviceMenus: { id: string; name: string; duration_minutes: number }[]
  companies: { id: string; name: string }[]
  onClose: () => void
  onSubmit: (data: {
    service_menu_id: string
    company_id?: string
    start_time: string
    end_time: string
  }) => Promise<void>
}

export function AddSlotDialog({
  isOpen,
  initialStartTime,
  initialEndTime,
  serviceMenus,
  companies,
  onClose,
  onSubmit,
}: AddSlotDialogProps) {
  const [selectedMenuId, setSelectedMenuId] = useState<string>('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialDurationMinutes, setInitialDurationMinutes] = useState<number | null>(null)

  // 初期値を設定
  useEffect(() => {
    if (isOpen) {
      if (initialStartTime && initialEndTime) {
        // カレンダーから時間帯を選択した場合
        setStartDate(format(initialStartTime, 'yyyy-MM-dd'))
        setStartTime(format(initialStartTime, 'HH:mm'))
        setEndDate(format(initialEndTime, 'yyyy-MM-dd'))
        setEndTime(format(initialEndTime, 'HH:mm'))

        // カレンダーから選択された時間帯の長さを記録
        const durationMs = initialEndTime.getTime() - initialStartTime.getTime()
        const durationMinutes = durationMs / 60000
        setInitialDurationMinutes(durationMinutes)
      } else {
        // ボタンから開いた場合は、今日の日付と現在時刻（次の15分刻み）を設定
        const now = new Date()
        const minutes = now.getMinutes()
        const roundedMinutes = Math.ceil(minutes / 15) * 15

        const nextSlot = new Date(now)
        if (roundedMinutes >= 60) {
          nextSlot.setHours(now.getHours() + 1, 0, 0, 0)
        } else {
          nextSlot.setHours(now.getHours(), roundedMinutes, 0, 0)
        }

        setStartDate(format(nextSlot, 'yyyy-MM-dd'))
        setStartTime(format(nextSlot, 'HH:mm'))
        setEndDate('')
        setEndTime('')
        setInitialDurationMinutes(null)
      }
    }
  }, [isOpen, initialStartTime, initialEndTime])

  // メニュー選択時に終了時刻を自動計算
  useEffect(() => {
    if (selectedMenuId && startDate && startTime) {
      const menu = serviceMenus.find(m => m.id.toString() === selectedMenuId)
      if (menu) {
        const start = new Date(`${startDate}T${startTime}`)
        const end = new Date(start.getTime() + menu.duration_minutes * 60000)
        setEndDate(format(end, 'yyyy-MM-dd'))
        setEndTime(format(end, 'HH:mm'))

        // カレンダーから選択した時間帯と一致しない場合は警告を表示
        if (initialDurationMinutes !== null && initialDurationMinutes !== menu.duration_minutes) {
          setError(
            `カレンダーで選択した時間帯は${initialDurationMinutes}分ですが、選択したメニューは${menu.duration_minutes}分です。開始時刻を調整するか、${initialDurationMinutes}分のメニューを選択してください。`
          )
        } else {
          setError(null)
        }
      }
    }
  }, [selectedMenuId, startDate, startTime, serviceMenus, initialDurationMinutes])

  const handleClose = useCallback(() => {
    setSelectedMenuId('')
    setSelectedCompanyId('')
    setStartDate('')
    setStartTime('')
    setEndDate('')
    setEndTime('')
    setError(null)
    setInitialDurationMinutes(null)
    onClose()
  }, [onClose])

  // ESCキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose])

  // 画面スクロール防止
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // バリデーション
    if (!selectedMenuId || !startDate || !startTime || !endDate || !endTime) {
      setError('すべての項目を入力してください')
      return
    }

    const startDateTime = new Date(`${startDate}T${startTime}`)
    const endDateTime = new Date(`${endDate}T${endTime}`)

    if (startDateTime >= endDateTime) {
      setError('終了時刻は開始時刻より後である必要があります')
      return
    }

    if (startDateTime < new Date()) {
      setError('過去の日時は登録できません')
      return
    }

    // 時間帯とメニューの施術時間が一致するかチェック
    const selectedMenu = serviceMenus.find(m => m.id.toString() === selectedMenuId)
    if (selectedMenu) {
      const actualDurationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / 60000
      if (actualDurationMinutes !== selectedMenu.duration_minutes) {
        setError(
          `選択したメニューの施術時間は${selectedMenu.duration_minutes}分ですが、指定された時間帯は${actualDurationMinutes}分です。時間帯を修正するか、別のメニューを選択してください。`
        )
        return
      }
    }

    setIsLoading(true)

    try {
      await onSubmit({
        service_menu_id: selectedMenuId,
        company_id: selectedCompanyId || undefined,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-25 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-200 transform transition-all duration-200 ease-out scale-100 opacity-100">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h2 id="dialog-title" className="text-lg font-semibold text-gray-900">
            空き枠を登録
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* エラーメッセージ */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
              {error}
            </div>
          )}

          {/* 対象法人 */}
          <div>
            <label htmlFor="company-id" className="block text-sm font-medium text-gray-700 mb-1">
              対象法人
            </label>
            <select
              id="company-id"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">全法人公開（誰でも予約可能）</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} 専用
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              特定の法人専用にする場合は法人を選択してください
            </p>
          </div>

          {/* 施術メニュー */}
          <div>
            <label htmlFor="service-menu" className="block text-sm font-medium text-gray-700 mb-1">
              施術メニュー <span className="text-red-500">*</span>
            </label>
            <select
              id="service-menu"
              value={selectedMenuId}
              onChange={(e) => setSelectedMenuId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">選択してください</option>
              {serviceMenus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name} ({menu.duration_minutes}分)
                </option>
              ))}
            </select>
          </div>

          {/* 開始日時 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                開始日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-1">
                開始時刻 <span className="text-red-500">*</span>
              </label>
              <select
                id="start-time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">選択してください</option>
                {Array.from({ length: 96 }, (_, i) => {
                  const hour = Math.floor(i / 4)
                  const minute = (i % 4) * 15
                  const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                  return (
                    <option key={timeStr} value={timeStr}>
                      {timeStr}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* 終了日時（自動計算・読み取り専用） */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                終了日（自動計算）
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                readOnly
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-1">
                終了時刻（自動計算）
              </label>
              <input
                type="time"
                id="end-time"
                value={endTime}
                readOnly
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>
          </div>

          {/* 注意書き */}
          <div className="rounded-md bg-yellow-50 p-3 text-xs text-yellow-800 border border-yellow-200">
            終了時刻は、選択したメニューの施術時間に基づいて自動計算されます
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading}
            >
              {isLoading ? '登録中...' : '登録'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              disabled={isLoading}
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
