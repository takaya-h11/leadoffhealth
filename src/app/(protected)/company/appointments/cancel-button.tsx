'use client'

import { useState } from 'react'
import { cancelAppointment } from './actions'
import { useConfirmation } from '@/components/providers/confirmation-provider'

interface CancelButtonProps {
  appointmentId: string
  slotId: string
  startTime: string
  status: string
}

export function CancelButton({ appointmentId, slotId, startTime, status }: CancelButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const { confirm } = useConfirmation()

  // キャンセル可能かどうかチェック
  const canCancel = status === 'approved' || status === 'pending'

  // キャンセル期限チェック（前日20時）
  const appointmentStart = new Date(startTime)
  const deadline = new Date(appointmentStart)
  deadline.setDate(deadline.getDate() - 1)
  deadline.setHours(20, 0, 0, 0)

  const now = new Date()
  const isPastDeadline = now > deadline

  const handleCancel = async () => {
    const confirmed = await confirm({
      title: '予約キャンセル',
      message: 'この予約をキャンセルしてもよろしいですか？',
      confirmLabel: 'キャンセルする',
      cancelLabel: '戻る',
      confirmVariant: 'danger',
    })

    if (!confirmed) return

    setIsCancelling(true)
    try {
      await cancelAppointment(appointmentId, slotId)
    } catch (error) {
      console.error('Cancellation error:', error)
      setIsCancelling(false)
    }
  }

  if (!canCancel) {
    return null
  }

  if (isPastDeadline) {
    return (
      <div className="text-sm text-gray-500">
        キャンセル期限を過ぎています
        <br />
        <span className="text-xs">
          （キャンセル期限: {deadline.toLocaleDateString('ja-JP')} {deadline.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}）
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCancel}
        disabled={isCancelling}
        className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCancelling ? 'キャンセル中...' : '予約をキャンセル'}
      </button>
      <div className="text-xs text-gray-500">
        キャンセル期限: {deadline.toLocaleDateString('ja-JP')} {deadline.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
