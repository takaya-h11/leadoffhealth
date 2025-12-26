'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { ModernCard } from '@/components/ui/ModernCard';
import { ModernButton } from '@/components/ui/ModernButton';

interface CompanyDashboardProps {
  userName: string;
  companyName: string;
  nextAppointmentDetails: {
    id: string;
    startTime: Date;
    endTime: Date;
    therapistName: string;
    serviceMenuName: string;
    employeeName: string;
  } | null;
  monthAppointments: number;
  monthCompletedCount: number;
  userRole: string;
}

export function CompanyDashboard({
  userName,
  companyName,
  nextAppointmentDetails,
  monthAppointments,
  monthCompletedCount,
  userRole,
}: CompanyDashboardProps) {
  const { isModern } = useTheme();

  const stats = [
    {
      label: '今月の予約',
      value: monthAppointments,
      icon: '📅',
      gradient: 'blue',
      bgGradient: isModern ? 'from-blue-100 to-cyan-100' : 'bg-blue-100',
      iconColor: 'text-blue-600',
      valueColor: 'text-gray-900',
    },
    {
      label: '今月の施術完了',
      value: monthCompletedCount,
      icon: '✅',
      gradient: 'green',
      bgGradient: isModern ? 'from-green-100 to-teal-100' : 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-gray-900',
    },
  ];

  const quickLinks = [
    {
      href: '/company/schedule',
      title: '予約申込',
      description: '空き枠を確認して予約',
      icon: '📅',
      gradient: 'from-blue-50/80 to-cyan-50/60',
      iconGradient: 'from-blue-500 to-cyan-500',
    },
    {
      href: '/company/appointments',
      title: '予約管理',
      description: '予約の確認・キャンセル',
      icon: '📋',
      gradient: 'from-purple-50/80 to-pink-50/60',
      iconGradient: 'from-purple-500 to-pink-500',
    },
    {
      href: '/company/treatments',
      title: '施術履歴',
      description: '過去の施術記録を確認',
      icon: '📝',
      gradient: 'from-green-50/80 to-teal-50/60',
      iconGradient: 'from-green-500 to-teal-500',
    },
  ];

  return (
    <div className={isModern ? 'min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-8' : 'min-h-screen bg-gray-50 p-8'}>
      <div className="mx-auto max-w-7xl">
        {/* ヘッダー */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className={isModern ? 'text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent' : 'text-3xl font-bold text-gray-900'}>
              {userRole === 'employee' ? '整体利用者ダッシュボード' : '法人担当者ダッシュボード'}
            </h1>
            <p className={isModern ? 'mt-3 text-base text-gray-600 font-medium' : 'mt-2 text-sm text-gray-600'}>
              {companyName} - {userName}さん ✨
            </p>
          </div>
        </div>

        {/* 次回予約カード */}
        {nextAppointmentDetails ? (
          <ModernCard gradient={isModern ? 'blue' : undefined} className="mb-8">
            <div className={isModern ? 'p-8' : 'p-6'}>
              <div className="mb-6 flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <h2 className={isModern ? 'text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent' : 'text-xl font-semibold text-blue-900'}>
                  次回予約
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className={`${isModern ? 'p-5 rounded-xl bg-white/50 backdrop-blur-sm' : ''}`}>
                  <p className={`text-sm ${isModern ? 'text-blue-600 font-bold' : 'text-blue-700'}`}>日時</p>
                  <p className={`${isModern ? 'text-xl font-bold text-gray-900 mt-2' : 'text-lg font-semibold text-blue-900 mt-1'}`}>
                    {nextAppointmentDetails.startTime.toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </p>
                  <p className={`${isModern ? 'text-lg font-bold text-gray-900 mt-1' : 'text-lg font-semibold text-blue-900'}`}>
                    {nextAppointmentDetails.startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {nextAppointmentDetails.endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className={`${isModern ? 'p-5 rounded-xl bg-white/50 backdrop-blur-sm' : ''}`}>
                  <p className={`text-sm ${isModern ? 'text-blue-600 font-bold' : 'text-blue-700'}`}>担当整体師</p>
                  <p className={`${isModern ? 'text-xl font-bold text-gray-900 mt-2' : 'text-lg font-semibold text-blue-900 mt-1'}`}>
                    {nextAppointmentDetails.therapistName}
                  </p>
                  <p className={`text-sm mt-3 ${isModern ? 'text-blue-600 font-bold' : 'text-blue-700'}`}>施術メニュー</p>
                  <p className={`${isModern ? 'text-lg font-bold text-gray-900 mt-1' : 'text-lg font-semibold text-blue-900 mt-1'}`}>
                    {nextAppointmentDetails.serviceMenuName}
                  </p>
                </div>
              </div>
            </div>
          </ModernCard>
        ) : (
          <ModernCard gradient={isModern ? 'blue' : undefined} className="mb-8">
            <div className={isModern ? 'p-8' : 'p-6'}>
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <h2 className={isModern ? 'text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent' : 'text-xl font-semibold text-gray-900'}>
                  次回予約
                </h2>
              </div>
              <div className={`text-center py-8 ${isModern ? 'rounded-xl bg-white/50 backdrop-blur-sm' : ''}`}>
                <span className="text-6xl mb-4 block">📭</span>
                <p className={isModern ? 'text-gray-600 font-medium mb-4' : 'text-gray-500 mb-4'}>
                  予約がありません
                </p>
                <Link href="/company/schedule">
                  <ModernButton variant="primary">
                    📅 予約を申し込む
                  </ModernButton>
                </Link>
              </div>
            </div>
          </ModernCard>
        )}

        {/* 統計カード */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {stats.map((stat, index) => (
            <ModernCard key={index} gradient={isModern ? (stat.gradient as 'blue' | 'green') : undefined} hover>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={isModern ? 'text-sm font-bold text-gray-600' : 'text-sm font-medium text-gray-600'}>
                      {stat.label}
                    </p>
                    <p className={`mt-2 text-3xl font-bold ${stat.valueColor || 'text-gray-900'}`}>
                      {stat.value}件
                    </p>
                  </div>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-${isModern ? '2xl' : 'full'} bg-gradient-to-br ${stat.bgGradient} ${isModern ? 'shadow-lg' : ''}`}>
                    <span className="text-3xl">{stat.icon}</span>
                  </div>
                </div>
              </div>
            </ModernCard>
          ))}
        </div>

        {/* クイックリンク */}
        <ModernCard gradient={isModern ? 'purple' : undefined}>
          <div className={isModern ? 'p-8' : 'p-6'}>
            <div className="mb-6 flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <h2 className={isModern ? 'text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent' : 'text-xl font-semibold text-gray-900'}>
                クイックリンク
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickLinks.map((link, index) => (
                <Link key={index} href={link.href}>
                  <div className={`group cursor-pointer h-full p-6 rounded-${isModern ? '2xl' : 'lg'} ${
                    isModern
                      ? `bg-gradient-to-br ${link.gradient} hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-white/30 shadow-md`
                      : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-${isModern ? 'xl' : 'lg'} ${
                        isModern
                          ? `bg-gradient-to-br ${link.iconGradient} shadow-lg`
                          : 'bg-blue-500'
                      }`}>
                        <span className="text-2xl">{link.icon}</span>
                      </div>
                      <h3 className={isModern ? 'text-lg font-bold text-gray-900' : 'text-base font-semibold text-gray-900'}>
                        {link.title}
                      </h3>
                    </div>
                    <p className={`text-sm ${isModern ? 'text-gray-600 font-medium' : 'text-gray-600'}`}>
                      {link.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </ModernCard>
      </div>
    </div>
  );
}
