'use client'

import { useState } from 'react'
import { useConfirmation } from '@/components/providers/confirmation-provider'
import { deactivateServiceMenu } from '../actions'

interface ActionButtonsProps {
  menuId: string
}

export function ActionButtons({ menuId }: ActionButtonsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { confirm } = useConfirmation()

  const handleDeactivate = async () => {
    const confirmed = await confirm({
      title: '施術メニュー無効化',
      message: 'この施術メニューを無効化してもよろしいですか？無効化すると新規予約で選択できなくなります。',
      confirmLabel: '無効化する',
      cancelLabel: 'キャンセル',
      confirmVariant: 'danger',
    })

    if (!confirmed) return

    setIsProcessing(true)
    try {
      await deactivateServiceMenu(menuId)
    } catch (error) {
      console.error('Deactivate error:', error)
      setIsProcessing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDeactivate}
      disabled={isProcessing}
      className="rounded-md border border-red-300 bg-white px-4 py-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isProcessing ? '処理中...' : '無効化'}
    </button>
  )
}
