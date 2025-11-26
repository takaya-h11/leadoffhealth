import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  BodyView,
  DrawingTool,
  Stroke,
  Annotation,
  Pin,
  ViewData,
  BodyDiagramData,
} from '@/types/body-diagram';
import { DIAGRAM_COLORS, STROKE_WIDTHS } from '@/types/body-diagram';

interface UseBodyDiagramProps {
  initialData?: BodyDiagramData;
  authorId: string;
}

export const useBodyDiagram = ({ initialData, authorId }: UseBodyDiagramProps) => {
  const [currentView, setCurrentView] = useState<BodyView>('front');
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pen');
  const [currentColor, setCurrentColor] = useState<string>(DIAGRAM_COLORS.DEFAULT);
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState<number>(STROKE_WIDTHS.NORMAL);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Initialize diagram data
  const getEmptyViewData = (): ViewData => ({
    strokes: [],
    annotations: [],
    pins: [],
  });

  const getInitialData = (): BodyDiagramData => {
    if (initialData) return initialData;

    return {
      views: {
        front: getEmptyViewData(),
        back: getEmptyViewData(),
        left: getEmptyViewData(),
        right: getEmptyViewData(),
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId,
        version: 1,
      },
    };
  };

  const [data, setData] = useState<BodyDiagramData>(getInitialData);

  // Update data when initialData changes (important for readonly mode with async data)
  useEffect(() => {
    if (initialData) {
      console.log('🔄 useBodyDiagram: initialData changed, updating state:', initialData);
      setData(initialData);
      setHistory([initialData]);
      setHistoryIndex(0);
    }
  }, [initialData]);

  // History for undo/redo
  const [history, setHistory] = useState<BodyDiagramData[]>([getInitialData()]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Drawing state
  const isDrawing = useRef(false);
  const currentStroke = useRef<number[]>([]);

  // Add to history
  const addToHistory = useCallback((newData: BodyDiagramData) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newData);
      // Limit history to 50 items
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setData(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setData(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  // Can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Start drawing
  const startDrawing = useCallback((x: number, y: number) => {
    isDrawing.current = true;
    currentStroke.current = [x, y];
  }, []);

  // Continue drawing
  const continueDrawing = useCallback((x: number, y: number) => {
    if (!isDrawing.current) return;
    currentStroke.current = [...currentStroke.current, x, y];
  }, []);

  // End drawing
  const endDrawing = useCallback(() => {
    if (!isDrawing.current || currentStroke.current.length < 4) {
      isDrawing.current = false;
      currentStroke.current = [];
      return;
    }

    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      tool: currentTool === 'eraser' ? 'eraser' : 'pen',
      points: currentStroke.current,
      color: currentTool === 'eraser' ? '#FFFFFF' : currentColor,
      strokeWidth: currentTool === 'eraser' ? STROKE_WIDTHS.VERY_THICK : currentStrokeWidth,
      timestamp: new Date().toISOString(),
    };

    const newData: BodyDiagramData = {
      ...data,
      views: {
        ...data.views,
        [currentView]: {
          ...data.views[currentView],
          strokes: [...data.views[currentView].strokes, newStroke],
        },
      },
      metadata: {
        ...data.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    setData(newData);
    addToHistory(newData);

    isDrawing.current = false;
    currentStroke.current = [];
  }, [currentTool, currentColor, currentStrokeWidth, currentView, data, addToHistory]);

  // Add annotation
  const addAnnotation = useCallback((x: number, y: number, text: string) => {
    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      type: 'text',
      x,
      y,
      text,
      fontSize: 14,
      color: currentColor,
      timestamp: new Date().toISOString(),
    };

    const newData: BodyDiagramData = {
      ...data,
      views: {
        ...data.views,
        [currentView]: {
          ...data.views[currentView],
          annotations: [...data.views[currentView].annotations, newAnnotation],
        },
      },
      metadata: {
        ...data.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    setData(newData);
    addToHistory(newData);
  }, [currentColor, currentView, data, addToHistory]);

  // Add pin
  const addPin = useCallback((x: number, y: number, bodyPart: string, note: string) => {
    const newPin: Pin = {
      id: crypto.randomUUID(),
      x,
      y,
      bodyPart,
      note,
      timestamp: new Date().toISOString(),
    };

    const newData: BodyDiagramData = {
      ...data,
      views: {
        ...data.views,
        [currentView]: {
          ...data.views[currentView],
          pins: [...data.views[currentView].pins, newPin],
        },
      },
      metadata: {
        ...data.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    setData(newData);
    addToHistory(newData);
  }, [currentView, data, addToHistory]);

  // Update annotation position
  const updateAnnotationPosition = useCallback((id: string, x: number, y: number) => {
    const newData: BodyDiagramData = {
      ...data,
      views: {
        ...data.views,
        [currentView]: {
          ...data.views[currentView],
          annotations: data.views[currentView].annotations.map((a) =>
            a.id === id ? { ...a, x, y } : a
          ),
        },
      },
      metadata: {
        ...data.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    setData(newData);
    addToHistory(newData);
  }, [currentView, data, addToHistory]);

  // Delete annotation
  const deleteAnnotation = useCallback((id: string) => {
    const newData: BodyDiagramData = {
      ...data,
      views: {
        ...data.views,
        [currentView]: {
          ...data.views[currentView],
          annotations: data.views[currentView].annotations.filter((a) => a.id !== id),
        },
      },
      metadata: {
        ...data.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    setData(newData);
    addToHistory(newData);
  }, [currentView, data, addToHistory]);

  // Update pin position
  const updatePinPosition = useCallback((id: string, x: number, y: number) => {
    const newData: BodyDiagramData = {
      ...data,
      views: {
        ...data.views,
        [currentView]: {
          ...data.views[currentView],
          pins: data.views[currentView].pins.map((p) =>
            p.id === id ? { ...p, x, y } : p
          ),
        },
      },
      metadata: {
        ...data.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    setData(newData);
    addToHistory(newData);
  }, [currentView, data, addToHistory]);

  // Delete pin
  const deletePin = useCallback((id: string) => {
    const newData: BodyDiagramData = {
      ...data,
      views: {
        ...data.views,
        [currentView]: {
          ...data.views[currentView],
          pins: data.views[currentView].pins.filter((p) => p.id !== id),
        },
      },
      metadata: {
        ...data.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    setData(newData);
    addToHistory(newData);
  }, [currentView, data, addToHistory]);

  // Clear current view
  const clearView = useCallback(() => {
    const newData: BodyDiagramData = {
      ...data,
      views: {
        ...data.views,
        [currentView]: getEmptyViewData(),
      },
      metadata: {
        ...data.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    setData(newData);
    addToHistory(newData);
  }, [currentView, data, addToHistory]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  return {
    // State
    data,
    currentView,
    currentTool,
    currentColor,
    currentStrokeWidth,
    scale,
    position,
    canUndo,
    canRedo,

    // View management
    setCurrentView,
    setCurrentTool,
    setCurrentColor,
    setCurrentStrokeWidth,

    // Drawing
    startDrawing,
    continueDrawing,
    endDrawing,
    currentStroke: currentStroke.current,
    isDrawing: isDrawing.current,

    // Annotations and pins
    addAnnotation,
    addPin,
    updateAnnotationPosition,
    updatePinPosition,
    deleteAnnotation,
    deletePin,

    // History
    undo,
    redo,
    clearView,

    // Zoom/Pan
    zoomIn,
    zoomOut,
    resetZoom,
    setPosition,
  };
};
