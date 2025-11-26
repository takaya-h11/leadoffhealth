'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useBodyDiagram } from '@/hooks/useBodyDiagram';
import { DrawingToolbar } from './DrawingToolbar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { BodyDiagramProps } from '@/types/body-diagram';

// Dynamically import BodyDiagramCanvas to avoid SSR issues with Konva
const BodyDiagramCanvas = dynamic(
  () => import('./BodyDiagramCanvas').then(mod => ({ default: mod.BodyDiagramCanvas })),
  { ssr: false }
);

export const BodyDiagram: React.FC<BodyDiagramProps> = ({
  data: initialData,
  onSave,
  readonly = false,
}) => {
  // TODO: Get user ID from auth context
  const authorId = 'current-user-id';

  const {
    data,
    currentView,
    currentTool,
    currentColor,
    currentStrokeWidth,
    scale,
    position,
    canUndo,
    canRedo,
    setCurrentView,
    setCurrentTool,
    setCurrentColor,
    setCurrentStrokeWidth,
    startDrawing,
    continueDrawing,
    endDrawing,
    currentStroke,
    addAnnotation,
    addPin,
    updateAnnotationPosition,
    updatePinPosition,
    deleteAnnotation,
    deletePin,
    undo,
    redo,
    clearView,
    zoomIn,
    zoomOut,
    resetZoom,
    setPosition: _setPosition,
  } = useBodyDiagram({ initialData, authorId });

  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  const [annotationText, setAnnotationText] = useState('');
  const [pinNote, setPinNote] = useState('');
  const [pinBodyPart, setPinBodyPart] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      console.log('🎯 Canvas clicked:', { x, y, currentTool });
      if (currentTool === 'text') {
        console.log('📝 Opening annotation dialog');
        setDialogPosition({ x, y });
        setShowAnnotationDialog(true);
      } else if (currentTool === 'pin') {
        console.log('📍 Opening pin dialog');
        setDialogPosition({ x, y });
        setShowPinDialog(true);
      }
    },
    [currentTool]
  );

  const handleAddAnnotation = useCallback(() => {
    if (annotationText.trim()) {
      addAnnotation(dialogPosition.x, dialogPosition.y, annotationText);
      setAnnotationText('');
      setShowAnnotationDialog(false);
    }
  }, [annotationText, dialogPosition, addAnnotation]);

  const handleAddPin = useCallback(() => {
    if (pinNote.trim() && pinBodyPart.trim()) {
      addPin(dialogPosition.x, dialogPosition.y, pinBodyPart, pinNote);
      setPinNote('');
      setPinBodyPart('');
      setShowPinDialog(false);
    }
  }, [pinNote, pinBodyPart, dialogPosition, addPin]);

  const handleSave = useCallback(() => {
    console.log('💾 BodyDiagram handleSave called');
    console.log('   onSave function exists?', !!onSave);
    console.log('   data exists?', !!data);
    console.log('   data views:', data?.views ? Object.keys(data.views) : 'none');

    if (onSave) {
      console.log('✅ Calling onSave with data');
      onSave(data);
      console.log('✅ onSave completed');

      // Show visual feedback
      setJustSaved(true);
      setTimeout(() => {
        setJustSaved(false);
      }, 2000);
    } else {
      console.log('⚠️  No onSave function provided');
    }
  }, [data, onSave]);

  const handleClearRequest = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const handleClearConfirm = useCallback(() => {
    clearView();
    setShowClearConfirm(false);
  }, [clearView]);

  const handleClearCancel = useCallback(() => {
    setShowClearConfirm(false);
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readonly) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, readonly]);

  // Log data for debugging in readonly mode
  React.useEffect(() => {
    if (readonly) {
      console.log('📊 [READONLY] BodyDiagram rendering with data:', data);
      console.log('📊 [READONLY] Current view:', currentView);
      console.log('📊 [READONLY] Strokes count:', data.views[currentView].strokes.length);
      console.log('📊 [READONLY] Annotations count:', data.views[currentView].annotations.length);
      console.log('📊 [READONLY] Pins count:', data.views[currentView].pins.length);
      console.log('📊 [READONLY] All strokes:', data.views[currentView].strokes);
    }
  }, [readonly, data, currentView]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* View Switcher for readonly mode */}
      {readonly && (
        <div className="mb-4 flex justify-center gap-2">
          <button
            onClick={() => setCurrentView('front')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'front'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            正面
          </button>
          <button
            onClick={() => setCurrentView('back')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'back'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            背面
          </button>
          <button
            onClick={() => setCurrentView('left')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'left'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            左側面
          </button>
          <button
            onClick={() => setCurrentView('right')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'right'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            右側面
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Toolbar */}
        {!readonly && (
          <div className="lg:sticky lg:top-4 lg:self-start">
            <DrawingToolbar
              currentTool={currentTool}
              currentColor={currentColor}
              currentStrokeWidth={currentStrokeWidth}
              currentView={currentView}
              canUndo={canUndo}
              canRedo={canRedo}
              onToolChange={setCurrentTool}
              onColorChange={setCurrentColor}
              onStrokeWidthChange={setCurrentStrokeWidth}
              onViewChange={setCurrentView}
              onUndo={undo}
              onRedo={redo}
              onClear={handleClearRequest}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onResetZoom={resetZoom}
              onSave={onSave ? handleSave : undefined}
              justSaved={justSaved}
            />
          </div>
        )}

        {/* Canvas */}
        <div className={readonly ? 'col-span-1' : ''}>
          <BodyDiagramCanvas
          view={currentView}
          strokes={data.views[currentView].strokes}
          annotations={data.views[currentView].annotations}
          pins={data.views[currentView].pins}
          scale={scale}
          position={position}
          currentStroke={currentStroke}
          currentColor={currentColor}
          currentStrokeWidth={currentStrokeWidth}
          currentTool={currentTool}
          onStartDrawing={startDrawing}
          onContinueDrawing={continueDrawing}
          onEndDrawing={endDrawing}
          onAnnotationClick={deleteAnnotation}
          onPinClick={deletePin}
          onAnnotationDragEnd={updateAnnotationPosition}
          onPinDragEnd={updatePinPosition}
          onCanvasClick={handleCanvasClick}
          readonly={readonly}
        />

          {/* Display current zoom level */}
          <div className="mt-4 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200/50 shadow-lg">
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🔍 ズーム
              </span>
              <span className="text-sm font-bold text-gray-700">
                {Math.round(scale * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Annotation Dialog */}
      {showAnnotationDialog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => {
            setShowAnnotationDialog(false);
            setAnnotationText('');
          }}
        >
          <div
            className="bg-gradient-to-br from-white/95 to-blue-50/90 backdrop-blur-xl rounded-2xl border-2 border-blue-300/50 p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <span className="text-2xl">📝</span>
              テキスト注釈を追加
            </h3>
            <textarea
              value={annotationText}
              onChange={(e) => setAnnotationText(e.target.value)}
              placeholder="注釈を入力..."
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] bg-white/80 backdrop-blur-sm shadow-inner transition-all duration-200"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddAnnotation}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg hover:shadow-xl"
              >
                ✓ 追加
              </button>
              <button
                onClick={() => {
                  setShowAnnotationDialog(false);
                  setAnnotationText('');
                }}
                className="flex-1 px-5 py-3 border-2 border-gray-300 bg-white/80 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-semibold shadow-md hover:shadow-lg"
              >
                ✕ キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pin Dialog */}
      {showPinDialog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => {
            setShowPinDialog(false);
            setPinNote('');
            setPinBodyPart('');
          }}
        >
          <div
            className="bg-gradient-to-br from-white/95 to-pink-50/90 backdrop-blur-xl rounded-2xl border-2 border-pink-300/50 p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <span className="text-2xl">📍</span>
              ピンを追加
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  📌 部位
                </label>
                <input
                  type="text"
                  value={pinBodyPart}
                  onChange={(e) => setPinBodyPart(e.target.value)}
                  placeholder="例: 右肩"
                  className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white/80 backdrop-blur-sm shadow-inner transition-all duration-200"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  ✍️ メモ
                </label>
                <textarea
                  value={pinNote}
                  onChange={(e) => setPinNote(e.target.value)}
                  placeholder="メモを入力..."
                  className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 min-h-[100px] bg-white/80 backdrop-blur-sm shadow-inner transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddPin}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg hover:shadow-xl"
              >
                ✓ 追加
              </button>
              <button
                onClick={() => {
                  setShowPinDialog(false);
                  setPinNote('');
                  setPinBodyPart('');
                }}
                className="flex-1 px-5 py-3 border-2 border-gray-300 bg-white/80 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-semibold shadow-md hover:shadow-lg"
              >
                ✕ キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="ビューをクリア"
        message={`現在のビュー（${currentView === 'front' ? '前面' : currentView === 'back' ? '背面' : currentView === 'left' ? '左側' : '右側'}）をクリアしてもよろしいですか？\n\nこの操作は元に戻せません。`}
        confirmText="クリアする"
        cancelText="キャンセル"
        onConfirm={handleClearConfirm}
        onCancel={handleClearCancel}
        variant="danger"
      />
    </div>
  );
};
