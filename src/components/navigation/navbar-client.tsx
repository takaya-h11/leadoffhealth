'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationsDropdown } from '@/components/notifications-dropdown';

interface NavbarClientProps {
  user: {
    email?: string;
  } | null;
  userProfile: {
    full_name: string;
    role: string;
  } | null;
}

export function NavbarClient({ user, userProfile }: NavbarClientProps) {
  const { isModern } = useTheme();

  return (
    <nav className={`border-b transition-all duration-300 ${
      isModern
        ? 'bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl border-white/50 shadow-lg'
        : 'bg-white border-gray-200'
    }`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
            isModern
              ? 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg group-hover:shadow-xl group-hover:scale-110'
              : 'bg-blue-600'
          }`}>
            <span className="text-white text-xl font-bold">L</span>
          </div>
          <div>
            <span className={`text-xl font-bold transition-all duration-300 ${
              isModern
                ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'
                : 'text-gray-900'
            }`}>
              Lead off Health
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold transition-all duration-300 ${
                isModern
                  ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                予約管理システム
              </span>
            </div>
          </div>
        </Link>

        {/* ナビゲーション */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-semibold transition-all duration-300 ${
                  isModern
                    ? 'text-gray-700 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                ダッシュボード
              </Link>
              <Link
                href="/profile"
                className={`text-sm font-semibold transition-all duration-300 ${
                  isModern
                    ? 'text-gray-700 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                プロフィール
              </Link>

              {/* ユーザー情報 */}
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-300 ${
                isModern
                  ? 'bg-gradient-to-r from-gray-50/90 to-blue-50/70 backdrop-blur-sm border border-white/50 shadow-md'
                  : 'bg-gray-100'
              }`}>
                <span className={`text-xs ${isModern ? 'font-semibold text-gray-700' : 'text-gray-600'}`}>
                  {userProfile?.full_name || user.email}
                </span>
                {userProfile?.role && (
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all duration-300 ${
                    userProfile.role === 'admin'
                      ? isModern
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 shadow-sm'
                        : 'bg-white text-purple-700'
                      : userProfile.role === 'therapist'
                      ? isModern
                        ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 shadow-sm'
                        : 'bg-white text-blue-700'
                      : isModern
                        ? 'bg-gradient-to-r from-green-100 to-teal-100 text-green-700 shadow-sm'
                        : 'bg-white text-green-700'
                  }`}>
                    {userProfile.role === 'admin' && '管理者'}
                    {userProfile.role === 'therapist' && '整体師'}
                    {userProfile.role === 'company_user' && '法人'}
                  </span>
                )}
              </div>

              {/* 通知 */}
              <NotificationsDropdown />

              {/* ログアウトボタン */}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                    isModern
                      ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 hover:from-red-200 hover:to-pink-200 shadow-md hover:shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ログアウト
                </button>
              </form>

              {/* テーマ切り替えボタン */}
              <ThemeToggle />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                  isModern
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                ログイン
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
