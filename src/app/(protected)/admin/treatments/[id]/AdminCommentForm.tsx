'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { updateAdminComments } from '../actions'
import { Toast } from '@/components/ui/Toast'

interface AdminCommentFormProps {
  treatmentId: string
  initialComments: string | null
}

export function AdminCommentForm({ treatmentId, initialComments }: AdminCommentFormProps) {
  const searchParams = useSearchParams()
  const [isEditing, setIsEditing] = useState(false)
  const [comments, setComments] = useState(initialComments || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [savedRecently, setSavedRecently] = useState(false)

  // URLパラメータから成功メッセージを確認
  useEffect(() => {
    const message = searchParams.get('message')
    // 管理者コメント更新成功時のみトーストを表示
    if (message && message.includes('success') && message.includes('管理者コメント')) {
      // 編集モードを閉じる
      setIsEditing(false)
      setShowSuccessToast(true)
      setSavedRecently(true)
      setTimeout(() => {
        setSavedRecently(false)
      }, 3000)

      // URLから message パラメータを削除
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      await updateAdminComments(formData)
    } catch (error) {
      console.error('Failed to update admin comments:', error)
      setIsSubmitting(false)
    }
  }

  if (!isEditing) {
    return (
      <>
        {/* Success Toast */}
        {showSuccessToast && (
          <Toast
            message="管理者コメントを更新しました！"
            type="success"
            duration={3000}
            onClose={() => setShowSuccessToast(false)}
          />
        )}

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">管理者コメント</h2>
              {savedRecently && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold animate-in fade-in duration-200">
                  <span>✓</span>
                  <span>保存済み</span>
                </span>
              )}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              編集
            </button>
          </div>
          {comments ? (
            <p className="whitespace-pre-wrap text-gray-700">{comments}</p>
          ) : (
            <p className="text-gray-500 italic">コメントがありません</p>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">管理者コメント</h2>
      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="treatment_id" value={treatmentId} />
        <textarea
          name="admin_comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={6}
          placeholder="管理者のコメントを入力してください..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false)
              setComments(initialComments || '')
            }}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}
