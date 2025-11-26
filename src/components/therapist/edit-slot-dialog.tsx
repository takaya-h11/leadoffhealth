'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface EditSlotDialogProps {
  isOpen: boolean
  event: {
    id: string
    title: string
    start: Date
    end: Date
    resource: {
      therapistName: string
      status: 'available' | 'pending' | 'booked' | 'cancelled'
      serviceMenuName: string
      companyName?: string
      employeeName?: string
    }
  } | null
  serviceMenus: { id: string; name: string; duration_minutes: number }[]
  onClose: () => void
  onUpdate: (
    id: string,
    data: {
      service_menu_id: string
      start_time: string
      end_time: string
    }
  ) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function EditSlotDialog({
  isOpen,
  event,
  serviceMenus,
  onClose,
  onUpdate,
  onDelete,
}: EditSlotDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMenuId, setSelectedMenuId] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // イベント情報を初期化
  useEffect(() => {
    if (isOpen && event) {
      setStartDate(format(event.start, 'yyyy-MM-dd'))
      setStartTime(format(event.start, 'HH:mm'))
      setEndDate(format(event.end, 'yyyy-MM-dd'))
      setEndTime(format(event.end, 'HH:mm'))

      // メニューIDを取得するため、メニュー名から探す
      const menu = serviceMenus.find(m => m.name === event.resource.serviceMenuName)
      setSelectedMenuId(menu?.id.toString() || '')
      setIsEditing(false)
      setError(null)
    }
  }, [isOpen, event, serviceMenus])

  // メニュー選択時または開始時刻変更時に終了時刻を自動計算
  useEffect(() => {
    if (isEditing && selectedMenuId && startDate && startTime) {
      const menu = serviceMenus.find(m => m.id.toString() === selectedMenuId)
      if (menu) {
        const start = new Date(`${startDate}T${startTime}`)
        const end = new Date(start.getTime() + menu.duration_minutes * 60000)
        setEndDate(format(end, 'yyyy-MM-dd'))
        setEndTime(format(end, 'HH:mm'))
      }
    }
  }, [isEditing, selectedMenuId, startDate, startTime, serviceMenus])

  const handleClose = useCallback(() => {
    setIsEditing(false)
    setError(null)
    onClose()
  }, [onClose])

  // ESCキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !showDeleteConfirm) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, showDeleteConfirm, handleClose])

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
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
      await onUpdate(event.id, {
        service_menu_id: selectedMenuId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!event) return
    setIsLoading(true)

    try {
      await onDelete(event.id)
      setShowDeleteConfirm(false)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
      setShowDeleteConfirm(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !event) return null

  const isAvailable = event.resource.status === 'available'
  const canEdit = isAvailable

  return (
    <>
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
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isAvailable ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              <svg
                className={`h-6 w-6 ${isAvailable ? 'text-green-600' : 'text-blue-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 id="dialog-title" className="text-lg font-semibold text-gray-900">
              {isEditing ? '空き枠を編集' : '空き枠の詳細'}
            </h2>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
              {error}
            </div>
          )}

          {/* 予約済みの場合の警告 */}
          {!canEdit && (
            <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 border border-yellow-200">
              予約が入っているため、編集・削除できません
            </div>
          )}

          {isEditing ? (
            /* 編集フォーム */
            <form onSubmit={handleUpdate} className="space-y-4">
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
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  disabled={isLoading}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? '更新中...' : '更新'}
                </button>
              </div>
            </form>
          ) : (
            /* 詳細表示 */
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">整体師</div>
                <div className="text-base text-gray-900">{event.resource.therapistName}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">施術メニュー</div>
                <div className="text-base text-gray-900">{event.resource.serviceMenuName}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">日時</div>
                <div className="text-base text-gray-900">
                  {format(event.start, 'yyyy年M月d日 (E) HH:mm', { locale: ja })} 〜{' '}
                  {format(event.end, 'HH:mm')}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">ステータス</div>
                <div className="inline-flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${
                    event.resource.status === 'available' ? 'bg-green-500' :
                    event.resource.status === 'pending' ? 'bg-yellow-500' :
                    event.resource.status === 'booked' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="text-base text-gray-900">
                    {event.resource.status === 'available' ? '予約可能' :
                     event.resource.status === 'pending' ? '承認待ち' :
                     event.resource.status === 'booked' ? '予約確定' :
                     'キャンセル'}
                  </span>
                </div>
              </div>

              {event.resource.companyName && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">法人</div>
                  <div className="text-base text-gray-900">{event.resource.companyName}</div>
                </div>
              )}

              {event.resource.employeeName && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">社員名</div>
                  <div className="text-base text-gray-900">{event.resource.employeeName}</div>
                </div>
              )}

              {/* ボタン */}
              <div className="flex justify-end gap-3 pt-4">
                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                      disabled={isLoading}
                    >
                      削除
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="空き枠を削除"
        message="この空き枠を削除してもよろしいですか？この操作は取り消せません。"
        confirmLabel="削除"
        cancelLabel="キャンセル"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}
