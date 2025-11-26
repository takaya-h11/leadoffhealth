import Link from 'next/link'
import { requestPasswordReset } from './actions'
import { translateAuthError } from '@/utils/translate-error'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams
  const message = params.message ? translateAuthError(params.message) : undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form className="w-full max-w-md space-y-4 rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">パスワードリセット</h1>
        <p className="text-sm text-gray-600">
          登録済みのメールアドレスを入力してください。パスワードリセット用のリンクを送信します。
        </p>

        {message && (
          <div
            className={`rounded-md p-3 text-sm ${
              message.includes('メールを確認') || message.includes('送信しました')
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="example@example.com"
          />
        </div>

        <button
          formAction={requestPasswordReset}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          リセットメールを送信
        </button>

        <Link
          href="/login"
          className="block text-center text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          ログインページに戻る
        </Link>
      </form>
    </div>
  )
}
