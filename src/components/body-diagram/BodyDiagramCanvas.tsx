'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Text, Circle, Image as KonvaImage } from 'react-konva';
import type { BodyView, Stroke, Annotation, Pin } from '@/types/body-diagram';
import Konva from 'konva';

interface BodyDiagramCanvasProps {
  view: BodyView;
  strokes: Stroke[];
  annotations: Annotation[];
  pins: Pin[];
  scale: number;
  position: { x: number; y: number };
  currentStroke?: number[];
  currentColor: string;
  currentStrokeWidth: number;
  currentTool?: 'pen' | 'marker' | 'eraser' | 'text' | 'pin';
  onStartDrawing: (x: number, y: number) => void;
  onContinueDrawing: (x: number, y: number) => void;
  onEndDrawing: () => void;
  onAnnotationClick?: (id: string) => void;
  onPinClick?: (id: string) => void;
  onAnnotationDragEnd?: (id: string, x: number, y: number) => void;
  onPinDragEnd?: (id: string, x: number, y: number) => void;
  onCanvasClick?: (x: number, y: number) => void;
  readonly?: boolean;
}

const BodyDiagramCanvasComponent: React.FC<BodyDiagramCanvasProps> = ({
  view,
  strokes,
  annotations,
  pins,
  scale,
  position,
  currentStroke = [],
  currentColor,
  currentStrokeWidth,
  currentTool = 'pen',
  onStartDrawing,
  onContinueDrawing,
  onEndDrawing,
  onAnnotationClick,
  onPinClick,
  onAnnotationDragEnd,
  onPinDragEnd,
  onCanvasClick,
  readonly = false,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 500, height: 400 });
  const isDrawing = useRef(false);

  // Component mount log
  useEffect(() => {
    console.log('🎨 BodyDiagramCanvas mounted', { view, currentTool, readonly });
    return () => {
      console.log('🎨 BodyDiagramCanvas unmounted');
    };
  }, [view, currentTool, readonly]);

  // Track tool changes
  useEffect(() => {
    console.log('🔧 Current tool changed to:', currentTool);
  }, [currentTool]);

  // Load background image
  useEffect(() => {
    console.log('🖼️ Loading background image for view:', view);
    const img = new window.Image();
    img.src = `/body-diagrams/${view}.png`;
    img.onload = () => {
      console.log('✅ Background image loaded:', view);
      setImage(img);
    };
    img.onerror = () => {
      console.error('❌ Failed to load background image:', view);
    };
  }, [view]);

  // Update stage size on window resize
  useEffect(() => {
    const updateSize = () => {
      const container = stageRef.current?.container();
      if (container) {
        const parent = container.parentElement;
        if (parent) {
          const maxWidth = Math.min(parent.clientWidth - 40, 600); // パディング考慮、最大600px
          const maxHeight = Math.min(maxWidth * 0.8, 480); // アスペクト比0.8、最大480px
          console.log('📐 Stage size updated:', { maxWidth, maxHeight });
          setStageSize({
            width: maxWidth,
            height: maxHeight,
          });
        }
      } else {
        console.warn('⚠️ Stage container not found');
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Log when stage size changes
  useEffect(() => {
    console.log('📏 Stage size:', stageSize);
  }, [stageSize]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    console.log('🖱️ Mouse down event:', { readonly, currentTool });
    if (readonly) {
      console.log('⛔ Readonly mode - ignoring');
      return;
    }

    const stage = e.target.getStage();
    if (!stage) {
      console.error('❌ No stage found');
      return;
    }

    const point = stage.getPointerPosition();
    if (!point) {
      console.error('❌ No pointer position');
      return;
    }

    // Adjust for zoom and pan
    const x = (point.x - position.x) / scale;
    const y = (point.y - position.y) / scale;
    console.log('📍 Calculated position:', { x, y, scale, position });

    // Check if clicking on an interactive element (annotation or pin)
    // We want to ignore clicks on Text (annotations) and Circle (pins) only
    const targetName = e.target.getClassName();
    console.log('🎯 Target className:', targetName);
    const isInteractiveElement = targetName === 'Text' || targetName === 'Circle';
    if (isInteractiveElement) {
      console.log('🎯 Clicked on interactive element - ignoring');
      return;
    }

    // For text and pin tools, only trigger the canvas click (to open dialog)
    if (currentTool === 'text' || currentTool === 'pin') {
      console.log(`✅ Tool is ${currentTool} - calling onCanvasClick`);
      if (onCanvasClick) {
        onCanvasClick(x, y);
      } else {
        console.error('❌ onCanvasClick is not defined!');
      }
      return;
    }

    // For drawing tools (pen, marker, eraser), start drawing
    console.log(`✏️ Drawing tool ${currentTool} - starting drawing`);
    isDrawing.current = true;
    onStartDrawing(x, y);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current || readonly) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    // Adjust for zoom and pan
    const x = (point.x - position.x) / scale;
    const y = (point.y - position.y) / scale;

    onContinueDrawing(x, y);
  };

  const handleMouseUp = () => {
    if (!isDrawing.current || readonly) return;
    isDrawing.current = false;
    onEndDrawing();
  };

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (readonly) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    const x = (point.x - position.x) / scale;
    const y = (point.y - position.y) / scale;

    // Check if clicking on an interactive element (annotation or pin)
    const targetName = e.target.getClassName();
    const isInteractiveElement = targetName === 'Text' || targetName === 'Circle';
    if (isInteractiveElement) {
      return;
    }

    // For text and pin tools, only trigger the canvas click (to open dialog)
    if (currentTool === 'text' || currentTool === 'pin') {
      if (onCanvasClick) {
        onCanvasClick(x, y);
      }
      return;
    }

    // For drawing tools (pen, marker, eraser), start drawing
    isDrawing.current = true;
    onStartDrawing(x, y);
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (!isDrawing.current || readonly) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    const x = (point.x - position.x) / scale;
    const y = (point.y - position.y) / scale;

    onContinueDrawing(x, y);
  };

  const handleTouchEnd = () => {
    if (!isDrawing.current || readonly) return;
    isDrawing.current = false;
    onEndDrawing();
  };

  // Log render
  console.log('🔄 BodyDiagramCanvas rendering', {
    stageSize,
    scale,
    position,
    currentTool,
    imageLoaded: !!image
  });

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 shadow-2xl border-2 border-white/50 backdrop-blur-sm w-full max-w-2xl mx-auto" style={{ maxHeight: '500px' }}>
      {/* Decorative corner gradients */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={(e) => {
          console.log('🖱️ Stage onMouseDown fired!');
          handleMouseDown(e);
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => console.log('👆 Stage onClick fired!')}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
      >
        {/* Background layer with body diagram */}
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              x={0}
              y={0}
              width={stageSize.width}
              height={stageSize.height}
            />
          )}
        </Layer>

        {/* Drawing layer */}
        <Layer>
          {/* Existing strokes */}
          {strokes.map((stroke) => (
            <Line
              key={stroke.id}
              points={stroke.points}
              stroke={stroke.color}
              strokeWidth={stroke.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}

          {/* Current stroke being drawn */}
          {currentStroke && currentStroke.length > 0 && (
            <Line
              points={currentStroke}
              stroke={currentColor}
              strokeWidth={currentStrokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Annotations */}
          {annotations.map((annotation) => (
            <Text
              key={annotation.id}
              x={annotation.x}
              y={annotation.y}
              text={annotation.text}
              fontSize={annotation.fontSize}
              fill={annotation.color}
              onDblClick={() => {
                console.log('📝 Annotation double-clicked - deleting:', annotation.id);
                onAnnotationClick?.(annotation.id);
              }}
              onDblTap={() => onAnnotationClick?.(annotation.id)}
              draggable={!readonly}
              onDragEnd={(e) => {
                if (onAnnotationDragEnd) {
                  const newX = e.target.x();
                  const newY = e.target.y();
                  console.log('📝 Annotation dragged:', { id: annotation.id, newX, newY });
                  onAnnotationDragEnd(annotation.id, newX, newY);
                }
              }}
            />
          ))}

          {/* Pins */}
          {pins.map((pin) => (
            <React.Fragment key={pin.id}>
              <Circle
                x={pin.x}
                y={pin.y}
                radius={8}
                fill="#FF0000"
                stroke="#FFFFFF"
                strokeWidth={2}
                onDblClick={() => {
                  console.log('📍 Pin double-clicked - deleting:', pin.id);
                  onPinClick?.(pin.id);
                }}
                onDblTap={() => onPinClick?.(pin.id)}
                draggable={!readonly}
                onDragEnd={(e) => {
                  if (onPinDragEnd) {
                    const newX = e.target.x();
                    const newY = e.target.y();
                    console.log('📍 Pin dragged:', { id: pin.id, newX, newY });
                    onPinDragEnd(pin.id, newX, newY);
                  }
                }}
              />
              <Text
                x={pin.x + 12}
                y={pin.y - 8}
                text={pin.note}
                fontSize={12}
                fill="#000000"
                onDblClick={() => {
                  console.log('📍 Pin label double-clicked - deleting:', pin.id);
                  onPinClick?.(pin.id);
                }}
                onDblTap={() => onPinClick?.(pin.id)}
              />
            </React.Fragment>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

// React.memoでメモ化してパフォーマンス向上
// propsが変わらない限り再レンダリングしない
export const BodyDiagramCanvas = React.memo(BodyDiagramCanvasComponent);
