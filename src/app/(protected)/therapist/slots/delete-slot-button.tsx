'use client'

import { useState } from 'react'
import { deleteAvailableSlot } from './actions'
import { useConfirmation } from '@/components/providers/confirmation-provider'

export default function DeleteSlotButton({ slotId }: { slotId: string }) {
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
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-md border border-red-300 bg-white px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isDeleting ? '削除中...' : '削除'}
    </button>
  )
}
