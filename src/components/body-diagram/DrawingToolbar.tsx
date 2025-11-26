'use client';

import React from 'react';
import type { DrawingTool, BodyView } from '@/types/body-diagram';
import { DIAGRAM_COLORS, STROKE_WIDTHS } from '@/types/body-diagram';

interface DrawingToolbarProps {
  currentTool: DrawingTool;
  currentColor: string;
  currentStrokeWidth: number;
  currentView: BodyView;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onViewChange: (view: BodyView) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onSave?: () => void;
  justSaved?: boolean;
}

// コンポーネント外で定義して再作成を防ぐ
const tools: { value: DrawingTool; label: string; icon: string }[] = [
  { value: 'pen', label: 'ペン', icon: '✏️' },
  { value: 'eraser', label: '消しゴム', icon: '🧹' },
  { value: 'pin', label: 'ピン', icon: '📍' },
  { value: 'text', label: 'テキスト', icon: '📝' },
];

const views: { value: BodyView; label: string }[] = [
  { value: 'front', label: '前面' },
  { value: 'back', label: '背面' },
  { value: 'left', label: '左側' },
  { value: 'right', label: '右側' },
];

const colors: { value: string; label: string; name: string }[] = [
  { value: DIAGRAM_COLORS.DEFAULT, label: '黒', name: 'デフォルト' },
  { value: DIAGRAM_COLORS.PAIN, label: '赤', name: '痛み' },
  { value: DIAGRAM_COLORS.TREATMENT, label: '青', name: '施術箇所' },
  { value: DIAGRAM_COLORS.TENSION, label: 'オレンジ', name: '緊張' },
  { value: DIAGRAM_COLORS.IMPROVEMENT, label: '緑', name: '改善' },
  { value: DIAGRAM_COLORS.NOTE, label: 'ゴールド', name: 'メモ' },
];

const strokeWidths: { value: number; label: string }[] = [
  { value: STROKE_WIDTHS.THIN, label: '細' },
  { value: STROKE_WIDTHS.NORMAL, label: '標準' },
  { value: STROKE_WIDTHS.THICK, label: '太' },
  { value: STROKE_WIDTHS.VERY_THICK, label: '極太' },
];

const DrawingToolbarComponent: React.FC<DrawingToolbarProps> = ({
  currentTool,
  currentColor,
  currentStrokeWidth,
  currentView,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onViewChange,
  onUndo,
  onRedo,
  onClear,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSave,
  justSaved = false,
}) => {
  return (
    <div className="relative rounded-2xl p-6 bg-gradient-to-br from-white/95 via-blue-50/90 to-purple-50/80 backdrop-blur-xl shadow-2xl border border-white/50 space-y-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-3xl -z-10" />

      {/* View selector */}
      <div>
        <label className="text-sm font-bold mb-3 block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
          <span className="text-xl">🔄</span>
          表示角度
        </label>
        <div className="grid grid-cols-4 gap-2">
          {views.map((view) => (
            <button
              key={view.value}
              onClick={() => onViewChange(view.value)}
              className={`relative px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                currentView === view.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                  : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/50'
              }`}
            >
              {currentView === view.value && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl animate-pulse" />
              )}
              <span className="relative z-10">{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tool selector */}
      <div>
        <label className="text-sm font-bold mb-3 block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
          <span className="text-xl">🎨</span>
          描画ツール
        </label>
        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool) => (
            <button
              key={tool.value}
              onClick={() => {
                console.log('🎨 Tool changed to:', tool.value);
                onToolChange(tool.value);
              }}
              className={`group relative px-4 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                currentTool === tool.value
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 scale-105'
                  : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-lg border border-gray-200/50'
              }`}
              title={tool.label}
            >
              {currentTool === tool.value && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-xl animate-pulse" />
              )}
              <div className="relative z-10 flex items-center gap-3">
                <span className="text-2xl transform group-hover:scale-110 transition-transform duration-200">{tool.icon}</span>
                <span className="text-sm font-semibold">{tool.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Color selector - only for pen and text */}
      {(currentTool === 'pen' || currentTool === 'text') && (
        <div className="animate-in slide-in-from-top duration-300">
          <label className="text-sm font-bold mb-3 block bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-xl">🎨</span>
            カラーパレット
          </label>
          <div className="grid grid-cols-3 gap-3">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => onColorChange(color.value)}
                className={`group relative w-9 h-9 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                  currentColor === color.value
                    ? 'ring-3 ring-offset-1 ring-gray-900 scale-105 shadow-lg'
                    : 'ring-2 ring-white/50 hover:ring-gray-400 shadow-md'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {currentColor === color.value && (
                  <div className="absolute inset-0 bg-white/20 rounded-lg animate-pulse" />
                )}
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  ✓
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stroke width selector - only for pen */}
      {currentTool === 'pen' && (
        <div className="animate-in slide-in-from-top duration-300">
          <label className="text-sm font-bold mb-3 block bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-xl">📏</span>
            線の太さ
          </label>
          <div className="grid grid-cols-4 gap-2">
            {strokeWidths.map((width) => (
              <button
                key={width.value}
                onClick={() => onStrokeWidthChange(width.value)}
                className={`group relative px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  currentStrokeWidth === width.value
                    ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg shadow-green-500/50 scale-105'
                    : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/50'
                }`}
              >
                {currentStrokeWidth === width.value && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-teal-400/20 rounded-xl animate-pulse" />
                )}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-current rounded-full"
                    style={{ height: `${width.value / 2}px` }}
                  />
                  <span className="text-xs font-semibold">{width.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History controls */}
      <div className="border-t border-gray-200/50 pt-6">
        <label className="text-sm font-bold mb-3 block bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
          <span className="text-xl">⚡</span>
          クイック操作
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`px-3 py-3 text-sm font-semibold rounded-xl transition-all duration-300 transform ${
              canUndo
                ? 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 hover:from-indigo-200 hover:to-blue-200 hover:scale-105 shadow-md hover:shadow-lg'
                : 'bg-gray-100/50 text-gray-400 cursor-not-allowed'
            }`}
            title="元に戻す (Ctrl+Z)"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">↩️</span>
              <span className="text-xs">元に戻す</span>
            </div>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`px-3 py-3 text-sm font-semibold rounded-xl transition-all duration-300 transform ${
              canRedo
                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 hover:from-blue-200 hover:to-indigo-200 hover:scale-105 shadow-md hover:shadow-lg'
                : 'bg-gray-100/50 text-gray-400 cursor-not-allowed'
            }`}
            title="やり直し (Ctrl+Y)"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">↪️</span>
              <span className="text-xs">やり直し</span>
            </div>
          </button>
          <button
            onClick={onClear}
            className="px-3 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-red-100 to-pink-100 text-red-700 hover:from-red-200 hover:to-pink-200 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            title="現在のビューをクリア"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">🗑️</span>
              <span className="text-xs">クリア</span>
            </div>
          </button>
        </div>
      </div>

      {/* Zoom controls */}
      <div>
        <label className="text-sm font-bold mb-3 block bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
          <span className="text-xl">🔍</span>
          ズーム & ビュー
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onZoomIn}
            className="px-3 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 hover:from-cyan-200 hover:to-blue-200 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            title="拡大"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">🔍+</span>
              <span className="text-xs">拡大</span>
            </div>
          </button>
          <button
            onClick={onZoomOut}
            className="px-3 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 hover:from-blue-200 hover:to-cyan-200 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            title="縮小"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">🔍-</span>
              <span className="text-xs">縮小</span>
            </div>
          </button>
          <button
            onClick={onResetZoom}
            className="px-3 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 hover:from-gray-200 hover:to-slate-200 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            title="リセット"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">⟲</span>
              <span className="text-xs">リセット</span>
            </div>
          </button>
        </div>
      </div>

      {/* Save button */}
      {onSave && (
        <div className="pt-6 border-t border-gray-200/50">
          <button
            onClick={onSave}
            className={`group relative w-full px-6 py-4 text-base font-bold rounded-2xl text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 overflow-hidden ${
              justSaved
                ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600'
                : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'
            }`}
          >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
              justSaved
                ? 'bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400'
                : 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400'
            }`} />
            {justSaved && (
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            )}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
            <div className="relative z-10 flex items-center justify-center gap-3">
              {justSaved ? (
                <>
                  <span className="text-2xl animate-bounce">✓</span>
                  <span className="text-lg">保存しました！</span>
                </>
              ) : (
                <>
                  <span className="text-2xl transform group-hover:scale-110 transition-transform duration-200">💾</span>
                  <span className="text-lg">データを保存</span>
                  <span className="text-xl transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                </>
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

// React.memoでメモ化してパフォーマンス向上
export const DrawingToolbar = React.memo(DrawingToolbarComponent);
