'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function ModernButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ModernButtonProps) {
  const { isModern } = useTheme();

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  if (!isModern) {
    // クラシックモード: シンプルなボタン
    const classicVariants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
      success: 'bg-green-600 text-white hover:bg-green-700',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      warning: 'bg-orange-600 text-white hover:bg-orange-700',
    };

    return (
      <button
        className={`rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${classicVariants[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }

  // モダンモード: グラデーション + アニメーション
  const modernVariants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30',
    secondary: 'bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 shadow-lg shadow-gray-500/30',
    success: 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg shadow-green-500/30',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg shadow-red-500/30',
    warning: 'bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 shadow-lg shadow-orange-500/30',
  };

  return (
    <button
      className={`group relative rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden ${modernVariants[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
