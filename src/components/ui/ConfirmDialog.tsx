'use client';

import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
  onConfirm,
  onCancel,
  variant = 'warning',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bg: 'bg-gradient-to-br from-red-50/95 to-pink-50/90',
      border: 'border-red-300/50',
      icon: 'text-red-600',
      iconBg: 'bg-gradient-to-br from-red-100 to-pink-100',
      button: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg shadow-red-500/30',
      titleGradient: 'from-red-600 to-pink-600',
    },
    warning: {
      bg: 'bg-gradient-to-br from-orange-50/95 to-yellow-50/90',
      border: 'border-orange-300/50',
      icon: 'text-orange-600',
      iconBg: 'bg-gradient-to-br from-orange-100 to-yellow-100',
      button: 'bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 shadow-lg shadow-orange-500/30',
      titleGradient: 'from-orange-600 to-yellow-600',
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-50/95 to-cyan-50/90',
      border: 'border-blue-300/50',
      icon: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-100 to-cyan-100',
      button: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30',
      titleGradient: 'from-blue-600 to-cyan-600',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className={`max-w-md w-full rounded-2xl border-2 ${styles.border} ${styles.bg} backdrop-blur-xl p-8 shadow-2xl animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-5">
          <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${styles.iconBg} shadow-lg`}>
            <svg
              className={`h-7 w-7 ${styles.icon}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {variant === 'danger' || variant === 'warning' ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-3 bg-gradient-to-r ${styles.titleGradient} bg-clip-text text-transparent`}>{title}</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-6 py-3 text-sm font-bold text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border-2 border-gray-300 bg-white/80 backdrop-blur-sm px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-md hover:shadow-lg"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
