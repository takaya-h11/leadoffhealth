'use client'

import { useState } from 'react'
import { approveAppointment, rejectAppointment } from './actions'

interface AppointmentActionsProps {
  appointmentId: string
  slotId: string
  status: string
}

export function AppointmentActions({ appointmentId, slotId, status }: AppointmentActionsProps) {
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectedReason, setRejectedReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (status !== 'pending') {
    return null
  }

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await approveAppointment(appointmentId, slotId)
    } catch (error) {
      console.error('Failed to approve:', error)
      setIsSubmitting(false)
      setShowApproveModal(false)
    }
  }

  const handleReject = async () => {
    if (!rejectedReason.trim()) {
      alert('拒否理由を入力してください')
      return
    }

    setIsSubmitting(true)
    try {
      await rejectAppointment(appointmentId, slotId, rejectedReason)
    } catch (error) {
      console.error('Failed to reject:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex space-x-2">
        <button
          onClick={() => setShowApproveModal(true)}
          disabled={isSubmitting}
          className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
        >
          承認
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={isSubmitting}
          className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          拒否
        </button>
      </div>

      {/* 承認確認モーダル */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop - 半透明のグレー */}
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-25 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setShowApproveModal(false)}
          />
          <div className="relative z-50 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl border border-gray-200 transform transition-all duration-200 ease-out scale-100 opacity-100">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <h2 id="dialog-title" className="text-lg font-semibold text-gray-900">予約承認</h2>
            </div>
            <p id="dialog-description" className="mb-6 text-sm text-gray-600 leading-relaxed">
              この予約を承認してもよろしいですか？
            </p>
            <div className="flex justify-start gap-3">
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? '処理中...' : '承認する'}
              </button>
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={isSubmitting}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 拒否理由入力モーダル */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop - 半透明のグレー */}
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-25 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => {
              setShowRejectModal(false)
              setRejectedReason('')
            }}
          />
          <div className="relative z-50 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-200 transform transition-all duration-200 ease-out scale-100 opacity-100">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 id="dialog-title" className="text-lg font-semibold text-gray-900">予約拒否</h2>
            </div>

            <p className="mb-4 text-sm text-gray-600 leading-relaxed">
              拒否理由を入力してください
            </p>

            <textarea
              value={rejectedReason}
              onChange={(e) => setRejectedReason(e.target.value)}
              placeholder="例：スケジュールが重複しているため"
              rows={4}
              className="mb-6 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              autoFocus
            />

            <div className="flex justify-start gap-3">
              <button
                onClick={handleReject}
                disabled={isSubmitting || !rejectedReason.trim()}
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? '処理中...' : '拒否する'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectedReason('')
                }}
                disabled={isSubmitting}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
