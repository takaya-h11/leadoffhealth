import Link from 'next/link'
import { login, signup, demoLogin } from './actions'
import { translateAuthError } from '@/utils/translate-error'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams
  const message = params.message ? translateAuthError(params.message) : undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4 rounded-lg border bg-white p-8 shadow-sm">
      <form className="space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Lead off Health</h1>
          <p className="mt-2 text-sm text-gray-600">予約管理システム</p>
        </div>

        {message && (
          <div
            className={`rounded-md p-3 text-sm ${
              message.includes('メールを確認') || message.includes('更新しました') || message.includes('送信しました')
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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <div className="flex gap-2">
          <button
            formAction={login}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ログイン
          </button>
          <button
            formAction={signup}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            サインアップ
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/reset-password"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            パスワードをお忘れですか？
          </Link>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>※ サインアップ後、メールをご確認ください</p>
        </div>
      </form>

        {/* 開発者用デモログイン */}
        <div className="border-t border-gray-200 pt-4">
          <p className="mb-3 text-center text-xs font-medium text-gray-700">開発者用デモログイン</p>
          <div className="space-y-2">
            <form action={demoLogin}>
              <input type="hidden" name="role" value="admin" />
              <button
                type="submit"
                className="w-full rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-700 hover:bg-purple-100"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>管理者としてログイン</span>
                </div>
              </button>
            </form>

            <form action={demoLogin}>
              <input type="hidden" name="role" value="therapist" />
              <button
                type="submit"
                className="w-full rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 hover:bg-green-100"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>整体師としてログイン</span>
                </div>
              </button>
            </form>

            <form action={demoLogin}>
              <input type="hidden" name="role" value="company_user" />
              <button
                type="submit"
                className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>法人担当者としてログイン</span>
                </div>
              </button>
            </form>

            <form action={demoLogin}>
              <input type="hidden" name="role" value="employee" />
              <button
                type="submit"
                className="w-full rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700 hover:bg-orange-100"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>整体利用者としてログイン（次郎さん）</span>
                </div>
              </button>
            </form>

            <form action={demoLogin}>
              <input type="hidden" name="role" value="employee2" />
              <button
                type="submit"
                className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 hover:bg-amber-100"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>整体利用者としてログイン（三郎さん）</span>
                </div>
              </button>
            </form>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            ※ 開発環境専用機能です
          </p>
        </div>
      </div>
    </div>
  )
}
