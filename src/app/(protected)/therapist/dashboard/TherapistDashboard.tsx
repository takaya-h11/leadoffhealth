'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { ModernCard } from '@/components/ui/ModernCard';
import { ModernButton } from '@/components/ui/ModernButton';

interface AppointmentData {
  id: string;
  employee_name: string;
  employee_id: string;
  status: string;
  symptoms?: string[];
  available_slots: {
    start_time: string;
    end_time: string;
    service_menus: { name: string };
  };
  companies: { name: string };
  users?: { full_name: string; id: string };
}

interface TherapistDashboardProps {
  userName: string;
  todayCount: number;
  weekCount: number;
  monthCompletedCount: number;
  todayAppointments: AppointmentData[];
  needReportAppointments: AppointmentData[];
}

export function TherapistDashboard({
  userName,
  todayCount,
  weekCount,
  monthCompletedCount,
  todayAppointments,
  needReportAppointments,
}: TherapistDashboardProps) {
  const { isModern } = useTheme();

  const stats = [
    {
      label: '今日の予約',
      value: todayCount,
      icon: '📅',
      gradient: 'blue',
      bgGradient: isModern ? 'from-blue-100 to-cyan-100' : 'bg-blue-100',
      valueColor: 'text-gray-900',
    },
    {
      label: '今週の予約',
      value: weekCount,
      icon: '✅',
      gradient: 'green',
      bgGradient: isModern ? 'from-green-100 to-teal-100' : 'bg-green-100',
      valueColor: 'text-gray-900',
    },
    {
      label: '今月の施術完了',
      value: monthCompletedCount,
      icon: '📋',
      gradient: 'purple',
      bgGradient: isModern ? 'from-purple-100 to-pink-100' : 'bg-purple-100',
      valueColor: 'text-gray-900',
    },
  ];

  return (
    <div className={isModern ? 'min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-8' : 'min-h-screen bg-gray-50 p-8'}>
      <div className="mx-auto max-w-7xl">
        {/* ヘッダー */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className={isModern ? 'text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent' : 'text-3xl font-bold text-gray-900'}>
              整体師ダッシュボード
            </h1>
            <p className={isModern ? 'mt-3 text-base text-gray-600 font-medium' : 'mt-2 text-sm text-gray-600'}>
              ようこそ、{userName}さん ✨
            </p>
          </div>
        </div>

        {/* 統計カード */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {stats.map((stat, index) => (
            <ModernCard key={index} gradient={isModern ? stat.gradient as 'blue' | 'green' | 'purple' : undefined} hover>
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

        {/* レポート記入待ち */}
        {needReportAppointments && needReportAppointments.length > 0 && (
          <ModernCard gradient={isModern ? 'orange' : undefined} className="mb-8">
            <div className={isModern ? 'p-8' : 'p-6 border-2 border-orange-200 bg-orange-50'}>
              <div className="mb-6 flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <h2 className={isModern ? 'text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent' : 'text-xl font-semibold text-orange-900'}>
                  施術後レポート記入待ち
                </h2>
                <span className={`ml-auto rounded-full px-4 py-1.5 text-sm font-bold ${
                  isModern
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'bg-orange-200 text-orange-900'
                }`}>
                  {needReportAppointments.length}件
                </span>
              </div>
              <div className="space-y-3">
                {needReportAppointments.map((appointment) => {
                  const slot = Array.isArray(appointment.available_slots)
                    ? appointment.available_slots[0]
                    : appointment.available_slots;
                  const company = Array.isArray(appointment.companies)
                    ? appointment.companies[0]
                    : appointment.companies;

                  if (!slot) return null;

                  const startTime = new Date(slot.start_time);

                  return (
                    <div
                      key={appointment.id}
                      className={`flex items-center justify-between ${
                        isModern
                          ? 'rounded-xl bg-white/80 backdrop-blur-sm p-4 shadow-md hover:shadow-lg transition-all duration-200'
                          : 'rounded-lg bg-white p-4 shadow'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📝</span>
                          <p className={isModern ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}>
                            {company?.name || '不明'}
                          </p>
                        </div>
                        <p className={isModern ? 'mt-1 text-sm text-gray-600 font-medium' : 'mt-1 text-sm text-gray-600'}>
                          {Array.isArray(appointment.users) ? appointment.users[0]?.full_name : appointment.users?.full_name || appointment.employee_name || '不明'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {startTime.toLocaleDateString('ja-JP')} {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Link href={`/therapist/appointments/${appointment.id}/report`}>
                        <ModernButton variant="warning" size="sm">
                          📋 レポート記入
                        </ModernButton>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </ModernCard>
        )}

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
                  const company = Array.isArray(appointment.companies)
                    ? appointment.companies[0]
                    : appointment.companies;

                  if (!slot) return null;

                  const startTime = new Date(slot.start_time);
                  const endTime = new Date(slot.end_time);

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
                        <div className="flex items-center gap-3">
                          <div className={`flex h-14 w-14 items-center justify-center rounded-${isModern ? '2xl' : 'lg'} ${
                            isModern
                              ? 'bg-gradient-to-br from-blue-100 to-cyan-100 shadow-lg'
                              : 'bg-blue-100'
                          }`}>
                            <span className="text-xl font-bold text-blue-600">
                              {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div>
                            <p className={isModern ? 'font-bold text-gray-900 text-lg' : 'font-semibold text-gray-900'}>
                              {company?.name || '不明'}
                            </p>
                            <p className={isModern ? 'mt-1 text-sm text-gray-600 font-medium' : 'mt-1 text-sm text-gray-600'}>
                              {Array.isArray(appointment.users) ? appointment.users[0]?.full_name : appointment.users?.full_name || appointment.employee_name || '不明'}
                            </p>
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              {appointment.symptoms && appointment.symptoms.length > 0 && appointment.symptoms.map((symptom: string, idx: number) => (
                                <span
                                  key={idx}
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    isModern
                                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-semibold'
                                      : 'bg-purple-100 text-purple-700'
                                  }`}
                                >
                                  {symptom}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          appointment.status === 'approved'
                            ? isModern
                              ? 'bg-gradient-to-r from-green-100 to-teal-100 text-green-700'
                              : 'bg-green-100 text-green-700'
                            : isModern
                              ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {appointment.status === 'approved' ? '確定' : '承認待ち'}
                        </span>
                      </div>
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
        <ModernCard gradient={isModern ? 'purple' : undefined}>
          <div className={isModern ? 'p-8' : 'p-6'}>
            <div className="mb-6 flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <h2 className={isModern ? 'text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent' : 'text-xl font-semibold text-gray-900'}>
                クイックリンク
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/therapist/schedule">
                <div className={`group cursor-pointer p-6 rounded-${isModern ? '2xl' : 'lg'} ${
                  isModern
                    ? 'bg-gradient-to-br from-indigo-50/80 to-blue-50/60 hover:from-indigo-100/90 hover:to-blue-100/70 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-indigo-200/30'
                    : 'bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-${isModern ? 'xl' : 'lg'} ${
                      isModern
                        ? 'bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg'
                        : 'bg-indigo-500'
                    }`}>
                      <span className="text-2xl">📅</span>
                    </div>
                    <h3 className={isModern ? 'text-lg font-bold text-gray-900' : 'text-base font-semibold text-gray-900'}>
                      全体スケジュール・空き枠管理
                    </h3>
                  </div>
                  <p className={`text-sm ${isModern ? 'text-gray-600 font-medium' : 'text-gray-600'}`}>
                    カレンダー表示・空き枠登録
                  </p>
                </div>
              </Link>

              <Link href="/therapist/appointments">
                <div className={`group cursor-pointer p-6 rounded-${isModern ? '2xl' : 'lg'} ${
                  isModern
                    ? 'bg-gradient-to-br from-blue-50/80 to-cyan-50/60 hover:from-blue-100/90 hover:to-cyan-100/70 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-blue-200/30'
                    : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-${isModern ? 'xl' : 'lg'} ${
                      isModern
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg'
                        : 'bg-blue-500'
                    }`}>
                      <span className="text-2xl">📋</span>
                    </div>
                    <h3 className={isModern ? 'text-lg font-bold text-gray-900' : 'text-base font-semibold text-gray-900'}>
                      予約管理
                    </h3>
                  </div>
                  <p className={`text-sm ${isModern ? 'text-gray-600 font-medium' : 'text-gray-600'}`}>
                    予約の承認・拒否
                  </p>
                </div>
              </Link>

              <Link href="/therapist/appointments/all">
                <div className={`group cursor-pointer p-6 rounded-${isModern ? '2xl' : 'lg'} ${
                  isModern
                    ? 'bg-gradient-to-br from-orange-50/80 to-yellow-50/60 hover:from-orange-100/90 hover:to-yellow-100/70 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-orange-200/30'
                    : 'bg-white border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-${isModern ? 'xl' : 'lg'} ${
                      isModern
                        ? 'bg-gradient-to-br from-orange-500 to-yellow-500 shadow-lg'
                        : 'bg-orange-500'
                    }`}>
                      <span className="text-2xl">📝</span>
                    </div>
                    <h3 className={isModern ? 'text-lg font-bold text-gray-900' : 'text-base font-semibold text-gray-900'}>
                      レポート記入
                    </h3>
                  </div>
                  <p className={`text-sm ${isModern ? 'text-gray-600 font-medium' : 'text-gray-600'}`}>
                    施術後レポート記入
                  </p>
                </div>
              </Link>

              <Link href="/therapist/treatments">
                <div className={`group cursor-pointer p-6 rounded-${isModern ? '2xl' : 'lg'} ${
                  isModern
                    ? 'bg-gradient-to-br from-purple-50/80 to-pink-50/60 hover:from-purple-100/90 hover:to-pink-100/70 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-purple-200/30'
                    : 'bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-${isModern ? 'xl' : 'lg'} ${
                      isModern
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg'
                        : 'bg-purple-500'
                    }`}>
                      <span className="text-2xl">📚</span>
                    </div>
                    <h3 className={isModern ? 'text-lg font-bold text-gray-900' : 'text-base font-semibold text-gray-900'}>
                      施術履歴
                    </h3>
                  </div>
                  <p className={`text-sm ${isModern ? 'text-gray-600 font-medium' : 'text-gray-600'}`}>
                    施術履歴の閲覧
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </ModernCard>
      </div>
    </div>
  );
}
