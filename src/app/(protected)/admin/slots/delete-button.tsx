'use client'

import { deleteAvailableSlot } from '@/app/(protected)/therapist/slots/actions'
import { useState } from 'react'
import { useConfirmation } from '@/components/providers/confirmation-provider'

export function DeleteSlotButton({ slotId }: { slotId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { confirm } = useConfirmation()

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: '空き枠削除',
      message: 'この空き枠を削除してもよろしいですか？',
      confirmLabel: '削除する',
      cancelLabel: 'キャンセル',
      confirmVariant: 'danger',
    })

    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteAvailableSlot(slotId)
    } catch (error) {
      console.error('Delete error:', error)
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-900 disabled:text-gray-400"
    >
      {isDeleting ? '削除中...' : '削除'}
    </button>
  )
}
