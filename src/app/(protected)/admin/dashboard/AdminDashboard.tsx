'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { ModernCard } from '@/components/ui/ModernCard';
import { ModernButton } from '@/components/ui/ModernButton';

interface AppointmentWithDetails {
  id: string;
  employee_name: string;
  status: string;
  available_slots: {
    start_time: string;
    therapists: {
      users: {
        full_name: string;
      };
    };
  };
  companies: {
    name: string;
  };
}

interface AdminDashboardProps {
  userName: string;
  todayCount: number;
  weekCount: number;
  monthCompletedCount: number;
  activeCompanies: number;
  todayAppointments: AppointmentWithDetails[];
}

export function AdminDashboard({
  userName,
  todayCount,
  weekCount,
  monthCompletedCount,
  activeCompanies: _activeCompanies,
  todayAppointments,
}: AdminDashboardProps) {
  const { isModern } = useTheme();

  const stats = [
    {
      label: '今日の予約',
      value: todayCount,
      icon: '📅',
      gradient: 'blue',
      bgGradient: isModern ? 'from-blue-100 to-cyan-100' : 'bg-blue-100',
      iconColor: 'text-blue-600',
      valueColor: 'text-gray-900',
    },
    {
      label: '今週の予約',
      value: weekCount,
      icon: '✅',
      gradient: 'green',
      bgGradient: isModern ? 'from-green-100 to-teal-100' : 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-gray-900',
    },
    {
      label: '今月の施術完了',
      value: monthCompletedCount,
      icon: '📋',
      gradient: 'purple',
      bgGradient: isModern ? 'from-purple-100 to-pink-100' : 'bg-purple-100',
      iconColor: 'text-purple-600',
      valueColor: 'text-gray-900',
    },
  ];

  const quickLinks = [
    {
      title: 'スケジュール・予約管理',
      links: [
        {
          href: '/admin/schedule',
          title: '全体スケジュール',
          description: 'カレンダー表示',
          icon: '📅',
          gradient: 'from-indigo-50/80 to-blue-50/60',
          iconGradient: 'from-indigo-500 to-blue-500',
        },
        {
          href: '/admin/slots',
          title: '空き枠管理',
          description: '空き枠の登録・削除',
          icon: '➕',
          gradient: 'from-teal-50/80 to-cyan-50/60',
          iconGradient: 'from-teal-500 to-cyan-500',
        },
        {
          href: '/admin/appointments',
          title: '予約管理',
          description: '予約の閲覧・キャンセル',
          icon: '📋',
          gradient: 'from-blue-50/80 to-cyan-50/60',
          iconGradient: 'from-blue-500 to-cyan-500',
        },
        {
          href: '/admin/book',
          title: '予約申込（法人代行）',
          description: '法人の代わりに予約',
          icon: '🎯',
          gradient: 'from-pink-50/80 to-rose-50/60',
          iconGradient: 'from-pink-500 to-rose-500',
        },
      ],
    },
    {
      title: '法人・整体師管理',
      links: [
        {
          href: '/admin/companies',
          title: '法人管理',
          description: '法人情報の管理',
          icon: '🏢',
          gradient: 'from-purple-50/80 to-pink-50/60',
          iconGradient: 'from-purple-500 to-pink-500',
        },
        {
          href: '/admin/company-users',
          title: '法人担当者・整体利用者管理',
          description: 'ログインアカウントの管理',
          icon: '👤',
          gradient: 'from-blue-50/80 to-indigo-50/60',
          iconGradient: 'from-blue-500 to-indigo-500',
        },
        {
          href: '/admin/therapists',
          title: '整体師管理',
          description: '整体師の登録・編集',
          icon: '👨‍⚕️',
          gradient: 'from-orange-50/80 to-yellow-50/60',
          iconGradient: 'from-orange-500 to-yellow-500',
        },
      ],
    },
    {
      title: '施術・マスターデータ',
      links: [
        {
          href: '/admin/treatments',
          title: '施術履歴',
          description: '全施術記録の閲覧',
          icon: '📝',
          gradient: 'from-green-50/80 to-teal-50/60',
          iconGradient: 'from-green-500 to-teal-500',
        },
        {
          href: '/admin/treatments',
          title: 'レポート記入管理',
          description: 'レポート記入状況の確認',
          icon: '📋',
          gradient: 'from-orange-50/80 to-yellow-50/60',
          iconGradient: 'from-orange-500 to-yellow-500',
        },
        {
          href: '/admin/service-menus',
          title: '施術メニュー管理',
          description: 'メニューの追加・編集',
          icon: '📄',
          gradient: 'from-cyan-50/80 to-blue-50/60',
          iconGradient: 'from-cyan-500 to-blue-500',
        },
        {
          href: '/admin/symptoms',
          title: '症状マスター管理',
          description: '症状の追加・編集',
          icon: '💊',
          gradient: 'from-red-50/80 to-pink-50/60',
          iconGradient: 'from-red-500 to-pink-500',
        },
      ],
    },
    {
      title: 'レポート',
      links: [
        {
          href: '/admin/reports/company-treatment',
          title: '法人別施術レポート',
          description: '統計・詳細をPDF出力',
          icon: '📊',
          gradient: 'from-indigo-50/80 to-purple-50/60',
          iconGradient: 'from-indigo-500 to-purple-500',
        },
      ],
    },
  ];

  return (
    <div className={isModern ? 'min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-8' : 'min-h-screen bg-gray-50 p-8'}>
      <div className="mx-auto max-w-7xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className={isModern ? 'text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent' : 'text-3xl font-bold text-gray-900'}>
            管理者ダッシュボード
          </h1>
          <p className={isModern ? 'mt-3 text-base text-gray-600 font-medium' : 'mt-2 text-sm text-gray-600'}>
            ようこそ、{userName}さん ✨
          </p>
        </div>

        {/* 統計カード */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {stats.map((stat, index) => (
            <ModernCard key={index} gradient={isModern ? (stat.gradient as 'blue' | 'green' | 'purple') : undefined} hover>
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

        {/* 今日の予約 */}
        <ModernCard gradient={isModern ? 'cyan' : undefined} className="mb-8">
          <div className={isModern ? 'p-8' : 'p-6'}>
            <div className="mb-6 flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <h2 className={isModern ? 'text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent' : 'text-xl font-semibold text-gray-900'}>
                今日の予約
              </h2>
              <span className={`ml-auto rounded-full px-4 py-1.5 text-sm font-bold ${
                isModern
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-blue-200 text-blue-900'
              }`}>
                {todayCount}件
              </span>
            </div>

            {todayAppointments && todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => {
                  const slot = Array.isArray(appointment.available_slots)
                    ? appointment.available_slots[0]
                    : appointment.available_slots;

                  if (!slot) return null;

                  const therapist = Array.isArray(slot.therapists) ? slot.therapists[0] : slot.therapists;
                  const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users;
                  const company = Array.isArray(appointment.companies)
                    ? appointment.companies[0]
                    : appointment.companies;
                  const startTime = new Date(slot.start_time);

                  return (
                    <div
                      key={appointment.id}
                      className={`flex items-center justify-between ${
                        isModern
                          ? 'rounded-xl bg-white/80 backdrop-blur-sm p-5 shadow-md hover:shadow-lg transition-all duration-200'
                          : 'rounded-lg bg-white p-4 shadow border border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <p className={isModern ? 'font-bold text-gray-900 text-lg' : 'font-semibold text-gray-900'}>
                          {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {company?.name} - {appointment.employee_name}様
                        </p>
                        <p className={isModern ? 'mt-1 text-sm text-gray-600 font-medium' : 'text-sm text-gray-600'}>
                          担当: {therapistUser?.full_name || '不明'}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        appointment.status === 'approved'
                          ? isModern
                            ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700'
                            : 'bg-blue-100 text-blue-800'
                          : isModern
                            ? 'bg-gradient-to-r from-green-100 to-teal-100 text-green-700'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {appointment.status === 'approved' ? '予約済み' : '施術完了'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-12 ${
                isModern
                  ? 'rounded-xl bg-white/50 backdrop-blur-sm'
                  : 'rounded-lg bg-gray-50'
              }`}>
                <span className="text-6xl mb-4 block">🌙</span>
                <p className={isModern ? 'text-gray-600 font-medium' : 'text-gray-500'}>
                  今日の予約はありません
                </p>
              </div>
            )}
          </div>
        </ModernCard>

        {/* クイックリンク */}
        {quickLinks.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <h2 className={isModern ? 'text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent' : 'text-xl font-semibold text-gray-900'}>
                {section.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {section.links.map((link, linkIndex) => (
                <Link key={linkIndex} href={link.href}>
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
                      <h3 className={isModern ? 'text-base font-bold text-gray-900 flex-1' : 'text-base font-semibold text-gray-900 flex-1'}>
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
        ))}
      </div>
    </div>
  );
}
