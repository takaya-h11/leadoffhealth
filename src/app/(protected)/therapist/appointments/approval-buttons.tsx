'use client'

import { useState } from 'react'
import { approveAppointment, rejectAppointment } from './actions'
import { useConfirmation } from '@/components/providers/confirmation-provider'

export function ApprovalButtons({
  appointmentId,
  slotId,
}: {
  appointmentId: string
  slotId: string
}) {
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectedReason, setRejectedReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showError, setShowError] = useState(false)
  const { confirm } = useConfirmation()

  const handleApprove = async () => {
    const confirmed = await confirm({
      title: '予約承認',
      message: 'この予約を承認してもよろしいですか？',
      confirmLabel: '承認する',
      cancelLabel: 'キャンセル',
      confirmVariant: 'primary',
    })

    if (!confirmed) return

    setIsProcessing(true)
    try {
      await approveAppointment(appointmentId, slotId)
    } catch (error) {
      console.error('Approval error:', error)
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectedReason.trim()) {
      setShowError(true)
      return
    }
    setShowError(false)
    setIsProcessing(true)
    try {
      await rejectAppointment(appointmentId, slotId, rejectedReason)
    } catch (error) {
      console.error('Rejection error:', error)
      setIsProcessing(false)
    }
  }

  if (showRejectModal) {
    return (
      <div className="w-64 rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
        <h3 className="mb-2 font-semibold text-gray-900">拒否理由</h3>
        <textarea
          value={rejectedReason}
          onChange={(e) => {
            setRejectedReason(e.target.value)
            setShowError(false)
          }}
          rows={3}
          placeholder="拒否理由を入力してください"
          disabled={isProcessing}
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none disabled:bg-gray-100 ${
            showError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
        />
        {showError && (
          <p className="mt-1 text-xs text-red-600">拒否理由を入力してください</p>
        )}
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? '処理中...' : '拒否'}
          </button>
          <button
            onClick={() => setShowRejectModal(false)}
            disabled={isProcessing}
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-2">
      <button
        onClick={handleApprove}
        disabled={isProcessing}
        className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isProcessing ? '処理中...' : '承認'}
      </button>
      <button
        onClick={() => setShowRejectModal(true)}
        disabled={isProcessing}
        className="rounded-md border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        拒否
      </button>
    </div>
  )
}
