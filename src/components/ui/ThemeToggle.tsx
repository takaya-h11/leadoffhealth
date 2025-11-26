'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme: _theme, toggleTheme, isModern } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`group relative px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
        isModern
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl'
          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 shadow-md'
      }`}
      title={isModern ? 'クラシックUIに切り替え' : 'モダンUIに切り替え'}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{isModern ? '✨' : '📋'}</span>
        <span className="text-sm">
          {isModern ? 'モダンUI' : 'クラシックUI'}
        </span>
      </div>
      {isModern && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300" />
      )}
    </button>
  );
}
