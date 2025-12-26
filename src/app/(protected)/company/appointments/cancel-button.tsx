'use client'

import { useState } from 'react'
import { cancelAppointment } from './actions'
import { useConfirmation } from '@/components/providers/confirmation-provider'

interface CancelButtonProps {
  appointmentId: string
  slotId: string
  startTime: string
  status: string
  variant?: 'default' | 'small'
}

export function CancelButton({ appointmentId, slotId, startTime, status, variant = 'default' }: CancelButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const { confirm } = useConfirmation()

  // キャンセル可能かどうかチェック
  const canCancel = status === 'approved' || status === 'pending'

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

  const buttonClasses = variant === 'small'
    ? 'rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
    : 'rounded-md border border-red-300 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <button
      onClick={handleCancel}
      disabled={isCancelling}
      className={buttonClasses}
    >
      {isCancelling ? 'キャンセル中...' : 'キャンセル'}
    </button>
  )
}
