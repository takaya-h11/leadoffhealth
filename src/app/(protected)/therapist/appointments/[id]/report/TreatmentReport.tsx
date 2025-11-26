'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ModernCard } from '@/components/ui/ModernCard';
import { TreatmentReportForm } from './TreatmentReportForm';

interface Symptom {
  id: string;
  name: string;
}

interface TreatmentReportProps {
  appointmentId: string;
  therapistId: string;
  defaultDuration: number;
  symptoms: Symptom[];
  appointmentInfo: {
    companyName: string;
    employeeName: string;
    employeeId: string;
    startTime: string;
    serviceMenuName: string;
    symptoms?: string[];
    notes?: string;
  };
  message?: string;
  translatedMessage?: string;
}

export function TreatmentReport({
  appointmentId,
  therapistId,
  defaultDuration,
  symptoms,
  appointmentInfo,
  message,
  translatedMessage,
}: TreatmentReportProps) {
  const { isModern } = useTheme();
  const startTime = new Date(appointmentInfo.startTime);

  return (
    <div className={isModern ? 'min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 p-8' : 'min-h-screen bg-gray-50 p-8'}>
      <div className="mx-auto max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className={isModern ? 'text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent' : 'text-3xl font-bold text-gray-900'}>
              施術後レポート記入
            </h1>
            <p className={isModern ? 'mt-3 text-base text-gray-600 font-medium' : 'mt-2 text-sm text-gray-600'}>
              施術の詳細を記録してください 📋
            </p>
          </div>
        </div>

        {/* メッセージ表示 */}
        {message && translatedMessage && (
          <ModernCard
            gradient={message.includes('success') ? 'green' : 'orange'}
            className="mb-6"
          >
            <div className={isModern ? 'p-4' : 'p-4 border-2 border-orange-200'}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {message.includes('success') ? '✅' : '⚠️'}
                </span>
                <p className={`text-sm ${
                  message.includes('success')
                    ? isModern
                      ? 'text-green-700 font-semibold'
                      : 'text-green-800'
                    : isModern
                      ? 'text-orange-700 font-semibold'
                      : 'text-orange-800'
                }`}>
                  {translatedMessage}
                </p>
              </div>
            </div>
          </ModernCard>
        )}

        {/* 予約情報サマリー */}
        <ModernCard gradient={isModern ? 'blue' : undefined} className="mb-6">
          <div className={isModern ? 'p-8' : 'p-6'}>
            <div className="mb-6 flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <h2 className={isModern ? 'text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent' : 'text-lg font-semibold text-gray-900'}>
                予約情報
              </h2>
            </div>

            <div className="space-y-4">
              <div className={`flex items-start ${isModern ? 'gap-4' : 'gap-3'}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-${isModern ? 'xl' : 'lg'} ${
                  isModern
                    ? 'bg-gradient-to-br from-purple-100 to-pink-100 shadow-md'
                    : 'bg-purple-100'
                }`}>
                  <span className="text-xl">🏢</span>
                </div>
                <div className="flex-1">
                  <p className={`text-xs ${isModern ? 'text-gray-500 font-semibold' : 'text-gray-600'}`}>法人</p>
                  <p className={isModern ? 'mt-1 font-bold text-gray-900 text-lg' : 'mt-1 font-semibold text-gray-900'}>
                    {appointmentInfo.companyName}
                  </p>
                </div>
              </div>

              <div className={`flex items-start ${isModern ? 'gap-4' : 'gap-3'}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-${isModern ? 'xl' : 'lg'} ${
                  isModern
                    ? 'bg-gradient-to-br from-blue-100 to-cyan-100 shadow-md'
                    : 'bg-blue-100'
                }`}>
                  <span className="text-xl">👤</span>
                </div>
                <div className="flex-1">
                  <p className={`text-xs ${isModern ? 'text-gray-500 font-semibold' : 'text-gray-600'}`}>社員情報</p>
                  <p className={isModern ? 'mt-1 font-bold text-gray-900' : 'mt-1 font-semibold text-gray-900'}>
                    {appointmentInfo.employeeName}
                  </p>
                  <p className="text-sm text-gray-600">ID: {appointmentInfo.employeeId}</p>
                </div>
              </div>

              <div className={`flex items-start ${isModern ? 'gap-4' : 'gap-3'}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-${isModern ? 'xl' : 'lg'} ${
                  isModern
                    ? 'bg-gradient-to-br from-green-100 to-teal-100 shadow-md'
                    : 'bg-green-100'
                }`}>
                  <span className="text-xl">🕒</span>
                </div>
                <div className="flex-1">
                  <p className={`text-xs ${isModern ? 'text-gray-500 font-semibold' : 'text-gray-600'}`}>施術日時</p>
                  <p className={isModern ? 'mt-1 font-bold text-gray-900' : 'mt-1 font-semibold text-gray-900'}>
                    {startTime.toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className={`flex items-start ${isModern ? 'gap-4' : 'gap-3'}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-${isModern ? 'xl' : 'lg'} ${
                  isModern
                    ? 'bg-gradient-to-br from-orange-100 to-yellow-100 shadow-md'
                    : 'bg-orange-100'
                }`}>
                  <span className="text-xl">💆</span>
                </div>
                <div className="flex-1">
                  <p className={`text-xs ${isModern ? 'text-gray-500 font-semibold' : 'text-gray-600'}`}>メニュー</p>
                  <p className={isModern ? 'mt-1 font-bold text-gray-900' : 'mt-1 font-semibold text-gray-900'}>
                    {appointmentInfo.serviceMenuName}
                  </p>
                </div>
              </div>

              {appointmentInfo.symptoms && appointmentInfo.symptoms.length > 0 && (
                <div className={`flex items-start ${isModern ? 'gap-4' : 'gap-3'}`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-${isModern ? 'xl' : 'lg'} ${
                    isModern
                      ? 'bg-gradient-to-br from-red-100 to-pink-100 shadow-md'
                      : 'bg-red-100'
                  }`}>
                    <span className="text-xl">🩺</span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs ${isModern ? 'text-gray-500 font-semibold' : 'text-gray-600'}`}>申込時の症状</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {appointmentInfo.symptoms.map((symptom, idx) => (
                        <span
                          key={idx}
                          className={`px-3 py-1 rounded-full text-sm ${
                            isModern
                              ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 font-semibold'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {appointmentInfo.notes && (
                <div className={`flex items-start ${isModern ? 'gap-4' : 'gap-3'}`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-${isModern ? 'xl' : 'lg'} ${
                    isModern
                      ? 'bg-gradient-to-br from-gray-100 to-slate-100 shadow-md'
                      : 'bg-gray-100'
                  }`}>
                    <span className="text-xl">📝</span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs ${isModern ? 'text-gray-500 font-semibold' : 'text-gray-600'}`}>要望</p>
                    <p className="mt-1 text-gray-900">{appointmentInfo.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModernCard>

        {/* レポート記入フォーム */}
        <TreatmentReportForm
          appointmentId={appointmentId}
          therapistId={therapistId}
          defaultDuration={defaultDuration}
          symptoms={symptoms}
        />
      </div>
    </div>
  );
}
