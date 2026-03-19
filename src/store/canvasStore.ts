import { create } from 'zustand';
import { floodFill, type Pixels } from '../lib/canvas';

export type Tool = 'draw' | 'erase' | 'fill' | 'pick' | 'line' | 'rect' | 'ellipse' | 'select';

export type SelectionState =
  | { phase: 'dragging'; startX: number; startY: number; endX: number; endY: number }
  | { phase: 'floating'; originX: number; originY: number; width: number; height: number;
      pixels: (string | null)[][]; currentX: number; currentY: number };

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

  // Selection tool state
  selection: SelectionState | null;

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

  // Selection actions
  startSelectionDrag: (x: number, y: number) => void;
  updateSelectionDrag: (x: number, y: number) => void;
  liftSelection: () => void;
  moveSelectionTo: (x: number, y: number) => void;
  dropSelection: () => void;
  cancelSelection: () => void;
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
  selection: null,

  setTool: (tool) => {
    const { selection, pixels, gridW, gridH } = get();
    if (selection?.phase === 'floating') {
      const next = pixels.map(row => [...row]);
      const { currentX, currentY, width, height, pixels: sp } = selection;
      for (let dy = 0; dy < height; dy++)
        for (let dx = 0; dx < width; dx++) {
          const tx = currentX + dx, ty = currentY + dy;
          if (tx >= 0 && tx < gridW && ty >= 0 && ty < gridH && sp[dy][dx] !== null)
            next[ty][tx] = sp[dy][dx];
        }
      set({ pixels: next });
    }
    set({ tool, shapeStart: null, previewCells: [], selection: null });
  },

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
    set({ gridW: w, gridH: h, pixels: next, undoStack: [], shapeStart: null, previewCells: [], selection: null });
  },

  clearCanvas: () => {
    const { gridW, gridH } = get();
    set({ pixels: makeEmptyPixels(gridW, gridH), undoStack: [], shapeStart: null, previewCells: [], selection: null });
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

  startSelectionDrag: (x, y) => {
    set({ selection: { phase: 'dragging', startX: x, startY: y, endX: x, endY: y } });
  },

  updateSelectionDrag: (x, y) => {
    const { selection } = get();
    if (selection?.phase !== 'dragging') return;
    set({ selection: { ...selection, endX: x, endY: y } });
  },

  liftSelection: () => {
    const { selection, pixels, gridW, gridH } = get();
    if (selection?.phase !== 'dragging') return;
    const { startX, startY, endX, endY } = selection;
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const w = Math.abs(endX - startX) + 1;
    const h = Math.abs(endY - startY) + 1;
    // Capture pixels
    const captured: (string | null)[][] = Array.from({ length: h }, (_, dy) =>
      Array.from({ length: w }, (_, dx) => pixels[y + dy]?.[x + dx] ?? null),
    );
    // Clear the region
    const next = pixels.map(row => [...row]);
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        if (y + dy < gridH && x + dx < gridW) next[y + dy][x + dx] = null;
    set({
      pixels: next,
      selection: { phase: 'floating', originX: x, originY: y, width: w, height: h,
                   pixels: captured, currentX: x, currentY: y },
    });
  },

  moveSelectionTo: (x, y) => {
    const { selection } = get();
    if (selection?.phase !== 'floating') return;
    set({ selection: { ...selection, currentX: x, currentY: y } });
  },

  dropSelection: () => {
    const { selection, pixels, gridW, gridH } = get();
    if (selection?.phase !== 'floating') return;
    const { currentX, currentY, width, height, pixels: sp } = selection;
    const next = pixels.map(row => [...row]);
    for (let dy = 0; dy < height; dy++)
      for (let dx = 0; dx < width; dx++) {
        const tx = currentX + dx, ty = currentY + dy;
        if (tx >= 0 && tx < gridW && ty >= 0 && ty < gridH && sp[dy][dx] !== null)
          next[ty][tx] = sp[dy][dx];
      }
    set({ pixels: next, selection: null });
  },

  cancelSelection: () => {
    const { selection, pixels, gridW, gridH } = get();
    if (selection?.phase !== 'floating') {
      set({ selection: null });
      return;
    }
    const { originX, originY, width, height, pixels: sp } = selection;
    const next = pixels.map(row => [...row]);
    for (let dy = 0; dy < height; dy++)
      for (let dx = 0; dx < width; dx++) {
        const tx = originX + dx, ty = originY + dy;
        if (tx >= 0 && tx < gridW && ty >= 0 && ty < gridH)
          next[ty][tx] = sp[dy][dx];
      }
    set({ pixels: next, selection: null });
  },
}));
