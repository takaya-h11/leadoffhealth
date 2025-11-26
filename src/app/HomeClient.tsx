'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { ModernCard } from '@/components/ui/ModernCard';
import { ModernButton } from '@/components/ui/ModernButton';

export function HomeClient() {
  const { isModern } = useTheme();

  const features = [
    {
      icon: '📅',
      title: '簡単予約管理',
      description: '空き枠の登録から予約承認まで、シンプルな操作で管理できます',
      gradient: 'blue',
      iconGradient: 'from-blue-100 to-cyan-100',
    },
    {
      icon: '✅',
      title: '施術記録管理',
      description: '施術内容や改善度を記録し、効果的な健康管理をサポート',
      gradient: 'green',
      iconGradient: 'from-green-100 to-teal-100',
    },
    {
      icon: '📊',
      title: '健康経営レポート',
      description: '月次レポートで従業員の健康状態を可視化し、経営に活用',
      gradient: 'purple',
      iconGradient: 'from-purple-100 to-pink-100',
    },
  ];

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-8 ${
      isModern
        ? 'bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/20'
        : 'bg-gradient-to-b from-blue-50 to-white'
    }`}>
      <div className="max-w-5xl text-center">
        {/* ロゴ・ヘッダー */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className={`flex items-center justify-center w-20 h-20 rounded-2xl transition-all duration-300 ${
            isModern
              ? 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl shadow-blue-500/30 transform hover:scale-110'
              : 'bg-blue-600 shadow-lg'
          }`}>
            <span className="text-white text-4xl font-bold">L</span>
          </div>
        </div>

        <h1 className={`mb-6 ${
          isModern
            ? 'text-7xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-fade-in'
            : 'text-6xl font-bold text-gray-900'
        }`}>
          Lead off Health
        </h1>

        <p className={`mb-4 ${
          isModern
            ? 'text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent'
            : 'text-2xl font-medium text-gray-700'
        }`}>
          法人向け出張整体 予約管理システム
        </p>

        <p className={`mb-12 ${
          isModern
            ? 'text-lg text-gray-600 font-medium leading-relaxed'
            : 'text-lg text-gray-600'
        }`}>
          理学療法士による専門的な施術で、従業員の健康をサポート
          <br />
          予約から施術記録、健康経営レポートまで一元管理
        </p>

        {/* ボタン */}
        <div className="mb-16 flex justify-center gap-4">
          <Link href="/login">
            <ModernButton variant="primary" size="lg">
              🔐 ログイン
            </ModernButton>
          </Link>
          <Link href="/login">
            {isModern ? (
              <ModernButton variant="secondary" size="lg">
                ✨ 新規登録
              </ModernButton>
            ) : (
              <button className="rounded-md border-2 border-gray-300 bg-white px-8 py-3 text-lg font-medium text-gray-700 shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                新規登録
              </button>
            )}
          </Link>
        </div>

        {/* 機能紹介カード */}
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <ModernCard key={index} gradient={isModern ? feature.gradient as 'blue' | 'orange' | 'green' | 'purple' : undefined} hover>
              <div className="p-8">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-${isModern ? '2xl' : 'full'} mx-auto bg-gradient-to-br ${feature.iconGradient} ${
                  isModern ? 'shadow-lg transform transition-transform duration-300 hover:scale-110' : ''
                }`}>
                  <span className="text-4xl">{feature.icon}</span>
                </div>
                <h3 className={`mb-3 ${
                  isModern
                    ? 'text-xl font-bold text-gray-900'
                    : 'text-lg font-semibold text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={`${
                  isModern
                    ? 'text-sm text-gray-600 font-medium leading-relaxed'
                    : 'text-sm text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </div>
            </ModernCard>
          ))}
        </div>

        {/* フッター */}
        <div className={`mt-16 ${
          isModern
            ? 'text-gray-500 font-medium'
            : 'text-gray-500'
        }`}>
          <p className="text-sm">
            © 2025 Lead off Health. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
