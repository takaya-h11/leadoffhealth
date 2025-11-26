'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useConfirmation } from '@/components/providers/confirmation-provider'
import { deactivateCompanyUser } from '../actions'

interface ActionButtonsProps {
  userId: string
}

export function ActionButtons({ userId }: ActionButtonsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { confirm } = useConfirmation()
  const router = useRouter()

  const handleResetPassword = async () => {
    const confirmed = await confirm({
      title: '初期パスワード再発行',
      message: 'このユーザーの初期パスワードを再発行してもよろしいですか？新しいパスワードを手動で法人担当者に伝える必要があります。',
      confirmLabel: '再発行する',
      cancelLabel: 'キャンセル',
      confirmVariant: 'primary',
    })

    if (!confirmed) return

    setIsProcessing(true)
    try {
      // APIルートを呼び出してパスワードをリセット
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert('パスワードリセットエラー: ' + (result.error || 'Unknown error'))
        setIsProcessing(false)
        return
      }

      // 成功 - パスワード表示画面にリダイレクト
      const params = new URLSearchParams({
        password: result.password,
        email: result.userEmail,
        userName: result.userName,
      })
      router.push(`/admin/company-users/${userId}/password-reset-success?${params.toString()}`)
    } catch (error) {
      console.error('Password reset error:', error)
      alert('予期しないエラーが発生しました')
      setIsProcessing(false)
    }
  }

  const handleDeactivate = async () => {
    const confirmed = await confirm({
      title: 'ユーザー無効化',
      message: 'このユーザーを無効化してもよろしいですか？無効化するとログインできなくなります。',
      confirmLabel: '無効化する',
      cancelLabel: 'キャンセル',
      confirmVariant: 'danger',
    })

    if (!confirmed) return

    setIsProcessing(true)
    try {
      await deactivateCompanyUser(userId)
    } catch (error) {
      console.error('Deactivate error:', error)
      setIsProcessing(false)
    }
  }

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <div className="space-y-6">
        {/* パスワード管理 */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">パスワード管理</h2>
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={isProcessing}
            className="rounded-md border border-orange-300 bg-white px-4 py-2 text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? '処理中...' : '初期パスワード再発行'}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            ※新しい初期パスワードを生成し、画面に表示します
          </p>
          <p className="mt-1 text-xs text-gray-500">
            ※表示されたパスワードを法人担当者に安全な方法（電話、対面など）で伝えてください
          </p>
          <p className="mt-1 text-xs text-gray-500">
            ※再発行後、ユーザーは初回ログイン時にパスワード変更を求められます
          </p>
        </div>

        {/* 無効化ボタン */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">アカウント管理</h2>
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={isProcessing}
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? '処理中...' : 'アカウント無効化'}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            ※無効化するとログインできなくなります
          </p>
        </div>
      </div>
    </div>
  )
}
