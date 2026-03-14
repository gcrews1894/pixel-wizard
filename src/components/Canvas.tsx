import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { renderPixels, renderGrid } from '../lib/canvas';

const DISPLAY_MAX = 560;

export function Canvas() {
  const pixelRef = useRef<HTMLCanvasElement>(null);
  const gridRef  = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const store = useCanvasStore();
  const {
    gridW, gridH, pixels, currentColor, tool, showGrid,
    setPixel, applyFill, pickColor, setCurrentColor, setTool,
    pushUndo, addRecentColor,
  } = store;

  // Compute display size
  const cellSize = Math.max(1, Math.floor(Math.min(DISPLAY_MAX / gridW, DISPLAY_MAX / gridH)));
  const canvasW  = cellSize * gridW;
  const canvasH  = cellSize * gridH;

  // Redraw pixels whenever they change
  useEffect(() => {
    const canvas = pixelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    renderPixels(ctx, pixels, gridW, gridH, canvasW, canvasH);
  }, [pixels, gridW, gridH, canvasW, canvasH]);

  // Redraw grid whenever it changes
  useEffect(() => {
    const canvas = gridRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (showGrid && cellSize >= 3) {
      renderGrid(ctx, gridW, gridH, canvasW, canvasH);
    } else {
      ctx.clearRect(0, 0, canvasW, canvasH);
    }
  }, [showGrid, gridW, gridH, canvasW, canvasH, cellSize]);

  const getCell = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const canvas = pixelRef.current;
      if (!canvas) return null;
      const rect   = canvas.getBoundingClientRect();
      const scaleX = canvas.width  / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx     = (e.clientX - rect.left) * scaleX;
      const cy     = (e.clientY - rect.top)  * scaleY;
      const x      = Math.floor(cx / cellSize);
      const y      = Math.floor(cy / cellSize);
      if (x < 0 || x >= gridW || y < 0 || y >= gridH) return null;
      return { x, y };
    },
    [cellSize, gridW, gridH],
  );

  const applyToolAt = useCallback(
    (x: number, y: number, forceErase = false) => {
      if (tool === 'fill') {
        applyFill(x, y);
        return;
      }
      if (tool === 'pick') {
        const col = pickColor(x, y);
        if (col) { setCurrentColor(col); addRecentColor(col); }
        setTool('draw');
        return;
      }
      const color = (tool === 'erase' || forceErase) ? null : currentColor;
      setPixel(x, y, color);
    },
    [tool, currentColor, setPixel, applyFill, pickColor, setCurrentColor, setTool, addRecentColor],
  );

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent) => {
    const cell = getCell(e);
    if (!cell) return;
    pushUndo();
    isDrawing.current = true;
    applyToolAt(cell.x, cell.y, e.button === 2);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    if (tool === 'fill' || tool === 'pick') return;
    const cell = getCell(e);
    if (!cell) return;
    applyToolAt(cell.x, cell.y, e.buttons === 2);
  };

  const onMouseUp = () => {
    if (isDrawing.current) addRecentColor(currentColor);
    isDrawing.current = false;
  };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    const cell = getCell({ clientX: t.clientX, clientY: t.clientY });
    if (!cell) return;
    pushUndo();
    isDrawing.current = true;
    applyToolAt(cell.x, cell.y);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current || tool === 'fill' || tool === 'pick') return;
    const t = e.touches[0];
    const cell = getCell({ clientX: t.clientX, clientY: t.clientY });
    if (!cell) return;
    applyToolAt(cell.x, cell.y);
  };

  const onTouchEnd = () => {
    addRecentColor(currentColor);
    isDrawing.current = false;
  };

  const cursorMap: Record<string, string> = {
    draw: 'crosshair',
    erase: 'cell',
    fill:  'copy',
    pick:  'zoom-in',
  };

  return (
    <div
      style={{ position: 'relative', width: canvasW, height: canvasH }}
      className="shadow-2xl shadow-black/60"
    >
      {/* Pixel layer */}
      <canvas
        ref={pixelRef}
        width={canvasW}
        height={canvasH}
        style={{ cursor: cursorMap[tool] ?? 'crosshair', imageRendering: 'pixelated' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onContextMenu={e => e.preventDefault()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />
      {/* Grid overlay */}
      <canvas
        ref={gridRef}
        width={canvasW}
        height={canvasH}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
