'use client'

import { useState, useCallback, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface CompanyAppointmentDialogProps {
  isOpen: boolean
  event: {
    id: string
    slotId?: string
    appointmentId?: string
    title: string
    start: Date
    end: Date
    resource: {
      therapistName: string
      status: 'available' | 'my_booking' | 'company_booking' | 'other_booking'
      serviceMenuName: string
      companyName?: string
      userName?: string
      durationMinutes?: number
    }
  } | null
  onClose: () => void
  onCancelAppointment: (appointmentId: string, slotId: string) => Promise<void>
}

export function CompanyAppointmentDialog({
  isOpen,
  event,
  onClose,
  onCancelAppointment,
}: CompanyAppointmentDialogProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    setError(null)
    onClose()
  }, [onClose])

  // ESCキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !showCancelConfirm) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, showCancelConfirm, handleClose])

  const handleCancelAppointment = async () => {
    if (!event || !event.appointmentId || !event.slotId) return
    setIsLoading(true)

    try {
      await onCancelAppointment(event.appointmentId, event.slotId)
      setShowCancelConfirm(false)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'キャンセルに失敗しました')
      setShowCancelConfirm(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !event) return null

  const canCancel = (event.resource.status === 'my_booking' || event.resource.status === 'company_booking') && event.appointmentId && event.slotId

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
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 id="dialog-title" className="text-lg font-semibold text-gray-900">
              予約詳細
            </h2>
            <button
              onClick={handleClose}
              className="ml-auto text-gray-400 hover:text-gray-500"
              aria-label="閉じる"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Content */}
          <div className="space-y-4">
            {/* 日時 */}
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">日時</div>
              <div className="text-base text-gray-900">
                {format(event.start, 'yyyy年M月d日(E) HH:mm', { locale: ja })} -{' '}
                {format(event.end, 'HH:mm', { locale: ja })}
                {event.resource.durationMinutes && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({event.resource.durationMinutes}分)
                  </span>
                )}
              </div>
            </div>

            {/* 整体師 */}
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">整体師</div>
              <div className="text-base text-gray-900">{event.resource.therapistName}</div>
            </div>

            {/* 施術メニュー */}
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">施術メニュー</div>
              <div className="text-base text-gray-900">{event.resource.serviceMenuName}</div>
            </div>

            {/* 利用者名 */}
            {event.resource.userName && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">利用者</div>
                <div className="text-base text-gray-900">{event.resource.userName}</div>
              </div>
            )}

            {/* ステータス */}
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">ステータス</div>
              <div>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  予約確定
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            {canCancel && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isLoading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                予約をキャンセル
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>

      {/* キャンセル確認ダイアログ */}
      <ConfirmationDialog
        isOpen={showCancelConfirm}
        title="予約をキャンセル"
        message="この予約をキャンセルしてもよろしいですか？空き枠は再度予約可能な状態に戻ります。"
        confirmLabel="キャンセル"
        cancelLabel="戻る"
        confirmVariant="danger"
        onConfirm={handleCancelAppointment}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </>
  )
}
