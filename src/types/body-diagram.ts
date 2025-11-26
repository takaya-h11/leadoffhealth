/**
 * Body diagram types for treatment records
 */

export type BodyView = 'front' | 'back' | 'left' | 'right';

export type DrawingTool = 'pen' | 'eraser' | 'pin' | 'text';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  tool: 'pen' | 'eraser';
  points: number[]; // Flat array of x,y coordinates [x1, y1, x2, y2, ...]
  color: string;
  strokeWidth: number;
  timestamp: string;
}

export interface Annotation {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  timestamp: string;
}

export interface Pin {
  id: string;
  x: number;
  y: number;
  bodyPart: string;
  note: string;
  timestamp: string;
}

export interface ViewData {
  strokes: Stroke[];
  annotations: Annotation[];
  pins: Pin[];
}

export interface BodyDiagramData {
  views: Record<BodyView, ViewData>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    authorId: string;
    version: number;
  };
}

export interface BodyDiagramProps {
  data?: BodyDiagramData;
  onSave?: (data: BodyDiagramData) => void;
  readonly?: boolean;
}

// Colors for different purposes
export const DIAGRAM_COLORS = {
  PAIN: '#FF0000', // Red
  TREATMENT: '#0000FF', // Blue
  TENSION: '#FFA500', // Orange
  IMPROVEMENT: '#00FF00', // Green
  NOTE: '#FFD700', // Gold
  DEFAULT: '#000000', // Black
} as const;

// Stroke widths
export const STROKE_WIDTHS = {
  THIN: 1,
  NORMAL: 3,
  THICK: 5,
  VERY_THICK: 8,
} as const;

// Body parts for clickable regions
export const BODY_PARTS = {
  // Front view
  HEAD: 'HEAD',
  NECK: 'NECK',
  LEFT_SHOULDER: 'LEFT_SHOULDER',
  RIGHT_SHOULDER: 'RIGHT_SHOULDER',
  CHEST: 'CHEST',
  ABDOMEN: 'ABDOMEN',
  LEFT_UPPER_ARM: 'LEFT_UPPER_ARM',
  RIGHT_UPPER_ARM: 'RIGHT_UPPER_ARM',
  LEFT_FOREARM: 'LEFT_FOREARM',
  RIGHT_FOREARM: 'RIGHT_FOREARM',
  LEFT_HAND: 'LEFT_HAND',
  RIGHT_HAND: 'RIGHT_HAND',
  PELVIS: 'PELVIS',
  LEFT_THIGH: 'LEFT_THIGH',
  RIGHT_THIGH: 'RIGHT_THIGH',
  LEFT_LOWER_LEG: 'LEFT_LOWER_LEG',
  RIGHT_LOWER_LEG: 'RIGHT_LOWER_LEG',
  LEFT_FOOT: 'LEFT_FOOT',
  RIGHT_FOOT: 'RIGHT_FOOT',

  // Back view
  UPPER_BACK: 'UPPER_BACK',
  MIDDLE_BACK: 'MIDDLE_BACK',
  LOWER_BACK: 'LOWER_BACK',
  LEFT_CALF: 'LEFT_CALF',
  RIGHT_CALF: 'RIGHT_CALF',
} as const;

export type BodyPart = keyof typeof BODY_PARTS;
