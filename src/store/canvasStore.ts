import { create } from 'zustand';
import { floodFill, type Pixels } from '../lib/canvas';

export type Tool = 'draw' | 'erase' | 'fill' | 'pick' | 'line' | 'rect' | 'ellipse';

interface CanvasState {
  gridW: number;
  gridH: number;
  pixels: Pixels;
  currentColor: string;
  tool: Tool;
  showGrid: boolean;
  recentColors: string[];
  undoStack: Pixels[];

  // Shape tool state
  shapeStart: { x: number; y: number } | null;
  previewCells: [number, number][];
  filledShape: boolean;

  // Actions
  setTool: (tool: Tool) => void;
  setCurrentColor: (color: string) => void;
  setShowGrid: (show: boolean) => void;
  setPixel: (x: number, y: number, color: string | null) => void;
  applyFill: (x: number, y: number) => void;
  pickColor: (x: number, y: number) => string | null;
  pushUndo: () => void;
  undo: () => void;
  setResolution: (w: number, h: number) => void;
  clearCanvas: () => void;
  addRecentColor: (color: string) => void;
  hydrateFromStorage: (state: Partial<StoredState>) => void;

  // Shape actions
  setShapeStart: (pt: { x: number; y: number } | null) => void;
  setPreviewCells: (cells: [number, number][]) => void;
  setFilledShape: (filled: boolean) => void;
  commitPreview: () => void;
}

export interface StoredState {
  gridW: number;
  gridH: number;
  pixels: Pixels;
  currentColor: string;
  recentColors: string[];
  showGrid: boolean;
}

function makeEmptyPixels(w: number, h: number): Pixels {
  return Array.from({ length: h }, () => Array(w).fill(null));
}

function resizePixels(existing: Pixels, newW: number, newH: number): Pixels {
  return Array.from({ length: newH }, (_, y) =>
    Array.from({ length: newW }, (_, x) => existing[y]?.[x] ?? null),
  );
}

const MAX_UNDO = 50;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  gridW: 16,
  gridH: 16,
  pixels: makeEmptyPixels(16, 16),
  currentColor: '#e94560',
  tool: 'draw',
  showGrid: true,
  recentColors: [],
  undoStack: [],

  shapeStart: null,
  previewCells: [],
  filledShape: false,

  setTool: (tool) => set({ tool, shapeStart: null, previewCells: [] }),

  setCurrentColor: (color) => set({ currentColor: color }),

  setShowGrid: (show) => set({ showGrid: show }),

  setPixel: (x, y, color) => {
    const { pixels, gridW, gridH } = get();
    if (x < 0 || x >= gridW || y < 0 || y >= gridH) return;
    const next = pixels.map(row => [...row]);
    next[y][x] = color;
    set({ pixels: next });
  },

  applyFill: (x, y) => {
    const { pixels, gridW, gridH, currentColor } = get();
    const next = pixels.map(row => [...row]);
    const target = next[y]?.[x] ?? null;
    floodFill(next, x, y, gridW, gridH, target, currentColor);
    set({ pixels: next });
  },

  pickColor: (x, y) => {
    const { pixels } = get();
    return pixels[y]?.[x] ?? null;
  },

  pushUndo: () => {
    const { pixels, undoStack } = get();
    const snapshot = pixels.map(row => [...row]);
    const stack = [...undoStack, snapshot];
    if (stack.length > MAX_UNDO) stack.shift();
    set({ undoStack: stack });
  },

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const stack = [...undoStack];
    const prev = stack.pop()!;
    set({ pixels: prev, undoStack: stack });
  },

  setResolution: (w, h) => {
    const { pixels } = get();
    const next = resizePixels(pixels, w, h);
    set({ gridW: w, gridH: h, pixels: next, undoStack: [], shapeStart: null, previewCells: [] });
  },

  clearCanvas: () => {
    const { gridW, gridH } = get();
    set({ pixels: makeEmptyPixels(gridW, gridH), undoStack: [], shapeStart: null, previewCells: [] });
  },

  addRecentColor: (color) => {
    const { recentColors } = get();
    const next = [color, ...recentColors.filter(c => c !== color)].slice(0, 16);
    set({ recentColors: next });
  },

  hydrateFromStorage: (saved) => {
    set({
      gridW: saved.gridW ?? 16,
      gridH: saved.gridH ?? 16,
      pixels: saved.pixels ?? makeEmptyPixels(saved.gridW ?? 16, saved.gridH ?? 16),
      currentColor: saved.currentColor ?? '#e94560',
      recentColors: saved.recentColors ?? [],
      showGrid: saved.showGrid ?? true,
    });
  },

  setShapeStart: (pt) => set({ shapeStart: pt }),
  setPreviewCells: (cells) => set({ previewCells: cells }),
  setFilledShape: (filled) => set({ filledShape: filled }),

  commitPreview: () => {
    const { pixels, previewCells, currentColor, gridW, gridH } = get();
    if (previewCells.length === 0) return;
    const next = pixels.map(row => [...row]);
    for (const [x, y] of previewCells) {
      if (x >= 0 && x < gridW && y >= 0 && y < gridH) {
        next[y][x] = currentColor;
      }
    }
    set({ pixels: next, previewCells: [], shapeStart: null });
  },
}));
