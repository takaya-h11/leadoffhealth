'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'cyan';
  hover?: boolean;
}

export function ModernCard({ children, className = '', gradient, hover = false }: ModernCardProps) {
  const { isModern } = useTheme();

  const gradientClasses = {
    blue: 'from-blue-50/90 via-cyan-50/80 to-blue-50/70',
    purple: 'from-purple-50/90 via-pink-50/80 to-purple-50/70',
    pink: 'from-pink-50/90 via-rose-50/80 to-pink-50/70',
    green: 'from-green-50/90 via-teal-50/80 to-green-50/70',
    orange: 'from-orange-50/90 via-yellow-50/80 to-orange-50/70',
    cyan: 'from-cyan-50/90 via-blue-50/80 to-cyan-50/70',
  };

  if (!isModern) {
    // クラシックモード: シンプルな白いカード
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
        {children}
      </div>
    );
  }

  // モダンモード: グラデーション + ガラスモーフィズム
  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-br ${gradient ? gradientClasses[gradient] : 'from-white/95 via-gray-50/90 to-white/85'} backdrop-blur-xl shadow-xl border border-white/50 ${
        hover ? 'transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl' : ''
      } ${className}`}
    >
      {/* 装飾的なぼかし円 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* コンテンツ */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
