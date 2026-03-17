import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { renderPixels, renderGrid } from '../lib/canvas';
import { type ViewportControls } from '../hooks/useViewport';
import { bresenhamLine, rectangleCells, ellipseCells } from '../lib/shapes';

const BASE_CELL = 16; // canvas pixels per grid cell

interface Props {
  viewportControls: ViewportControls;
}

export function Canvas({ viewportControls }: Props) {
  const pixelRef   = useRef<HTMLCanvasElement>(null);
  const gridRef    = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const isDrawing  = useRef(false);
  const lastPanPt  = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchMid  = useRef<{ x: number; y: number } | null>(null);

  const { viewport, containerRef, zoomAround, zoomStep, fitToWindow, panBy, isPanning, spaceHeld } =
    viewportControls;
  const { zoom, panX, panY } = viewport;

  const {
    gridW, gridH, pixels, currentColor, tool, showGrid,
    shapeStart, previewCells, filledShape,
    setPixel, applyFill, pickColor, setCurrentColor, setTool,
    pushUndo, addRecentColor,
    setShapeStart, setPreviewCells, commitPreview,
  } = useCanvasStore();

  const canvasW = BASE_CELL * gridW;
  const canvasH = BASE_CELL * gridH;

  const isShapeTool = tool === 'line' || tool === 'rect' || tool === 'ellipse';

  // ── Rendering ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = pixelRef.current;
    if (!canvas) return;
    renderPixels(canvas.getContext('2d')!, pixels, gridW, gridH, canvasW, canvasH);
  }, [pixels, gridW, gridH, canvasW, canvasH]);

  useEffect(() => {
    const canvas = gridRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (showGrid) {
      renderGrid(ctx, gridW, gridH, canvasW, canvasH);
    } else {
      ctx.clearRect(0, 0, canvasW, canvasH);
    }
  }, [showGrid, gridW, gridH, canvasW, canvasH]);

  // Preview layer rendering
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvasW, canvasH);
    if (previewCells.length === 0) return;
    const cellW = canvasW / gridW;
    const cellH = canvasH / gridH;
    ctx.fillStyle = currentColor;
    ctx.globalAlpha = 0.6;
    for (const [x, y] of previewCells) {
      ctx.fillRect(Math.round(x * cellW), Math.round(y * cellH), Math.ceil(cellW), Math.ceil(cellH));
    }
    ctx.globalAlpha = 1;
  }, [previewCells, currentColor, canvasW, canvasH, gridW, gridH]);

  // ── Cell hit-testing ──────────────────────────────────────────────────────
  const getCell = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const canvas = pixelRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((e.clientX - rect.left) / rect.width)  * gridW);
      const y = Math.floor(((e.clientY - rect.top)  / rect.height) * gridH);
      if (x < 0 || x >= gridW || y < 0 || y >= gridH) return null;
      return { x, y };
    },
    [gridW, gridH],
  );

  // ── Shape preview computation ─────────────────────────────────────────────
  const computePreview = useCallback(
    (x: number, y: number) => {
      if (!shapeStart) return;
      let cells: [number, number][] = [];
      if (tool === 'line')    cells = bresenhamLine(shapeStart.x, shapeStart.y, x, y);
      if (tool === 'rect')    cells = rectangleCells(shapeStart.x, shapeStart.y, x, y, filledShape);
      if (tool === 'ellipse') cells = ellipseCells(shapeStart.x, shapeStart.y, x, y, filledShape);
      setPreviewCells(cells);
    },
    [shapeStart, tool, filledShape, setPreviewCells],
  );

  // ── Regular tool application ──────────────────────────────────────────────
  const applyToolAt = useCallback(
    (x: number, y: number, forceErase = false) => {
      if (tool === 'fill') { applyFill(x, y); return; }
      if (tool === 'pick') {
        const col = pickColor(x, y);
        if (col) { setCurrentColor(col); addRecentColor(col); }
        setTool('draw');
        return;
      }
      setPixel(x, y, (tool === 'erase' || forceErase) ? null : currentColor);
    },
    [tool, currentColor, setPixel, applyFill, pickColor, setCurrentColor, setTool, addRecentColor],
  );

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAround(zoom * factor, e.clientX - rect.left, e.clientY - rect.top);
    },
    [zoom, zoomAround, containerRef],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel, containerRef]);

  // ── Space-bar pan mode ────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); spaceHeld.current = true; }
      if (e.key === 'Escape') { setPreviewCells([]); setShapeStart(null); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeld.current = false;
        isPanning.current = false;
        lastPanPt.current = null;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [spaceHeld, isPanning, setPreviewCells, setShapeStart]);

  // ── Zoom keyboard shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.ctrlKey || e.metaKey) return;
      if (e.key === '0') fitToWindow();
      if (e.key === '+' || e.key === '=') zoomStep(1);
      if (e.key === '-') zoomStep(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fitToWindow, zoomStep]);

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && spaceHeld.current)) {
      e.preventDefault();
      isPanning.current = true;
      lastPanPt.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (e.button !== 0 && e.button !== 2) return;
    const cell = getCell(e);
    if (!cell) return;

    if (isShapeTool && e.button === 0) {
      pushUndo();
      setShapeStart(cell);
      setPreviewCells([[cell.x, cell.y]]);
      return;
    }

    pushUndo();
    isDrawing.current = true;
    applyToolAt(cell.x, cell.y, e.button === 2);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning.current && lastPanPt.current) {
      panBy(e.clientX - lastPanPt.current.x, e.clientY - lastPanPt.current.y);
      lastPanPt.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (isShapeTool && shapeStart) {
      const cell = getCell(e);
      if (cell) computePreview(cell.x, cell.y);
      return;
    }

    if (!isDrawing.current || tool === 'fill' || tool === 'pick') return;
    const cell = getCell(e);
    if (!cell) return;
    applyToolAt(cell.x, cell.y, e.buttons === 2);
  };

  const onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning.current) {
      isPanning.current = false;
      lastPanPt.current = null;
      return;
    }

    if (isShapeTool && shapeStart) {
      const cell = getCell(e);
      if (cell) computePreview(cell.x, cell.y);
      commitPreview();
      addRecentColor(currentColor);
      return;
    }

    if (isDrawing.current) addRecentColor(currentColor);
    isDrawing.current = false;
  };

  const onMouseLeave = () => {
    if (isPanning.current) {
      isPanning.current = false;
      lastPanPt.current = null;
      return;
    }
    if (isShapeTool) {
      setPreviewCells([]);
      setShapeStart(null);
    }
    isDrawing.current = false;
  };

  // ── Touch handlers ────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      lastTouchDist.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      lastTouchMid.current  = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
      return;
    }
    e.preventDefault();
    const t = e.touches[0];
    const cell = getCell({ clientX: t.clientX, clientY: t.clientY });
    if (!cell) return;
    pushUndo();
    isDrawing.current = true;
    applyToolAt(cell.x, cell.y);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const mid  = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
      if (lastTouchDist.current != null && lastTouchMid.current) {
        const el = containerRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          zoomAround(zoom * (dist / lastTouchDist.current), mid.x - rect.left, mid.y - rect.top);
        }
        panBy(mid.x - lastTouchMid.current.x, mid.y - lastTouchMid.current.y);
      }
      lastTouchDist.current = dist;
      lastTouchMid.current  = mid;
      return;
    }
    e.preventDefault();
    if (!isDrawing.current || tool === 'fill' || tool === 'pick') return;
    const t = e.touches[0];
    const cell = getCell({ clientX: t.clientX, clientY: t.clientY });
    if (!cell) return;
    applyToolAt(cell.x, cell.y);
  };

  const onTouchEnd = () => {
    lastTouchDist.current = null;
    lastTouchMid.current  = null;
    if (isDrawing.current) addRecentColor(currentColor);
    isDrawing.current = false;
  };

  // ── Cursor ────────────────────────────────────────────────────────────────
  const toolCursor: Record<string, string> = {
    draw: 'crosshair', erase: 'cell', fill: 'copy', pick: 'zoom-in',
    line: 'crosshair', rect: 'crosshair', ellipse: 'crosshair',
  };
  const cursor = isPanning.current ? 'grabbing'
    : spaceHeld.current           ? 'grab'
    : (toolCursor[tool] ?? 'crosshair');

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ cursor }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onContextMenu={e => e.preventDefault()}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        style={{
          position: 'absolute',
          transformOrigin: '0 0',
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        }}
      >
        <div style={{ position: 'relative', width: canvasW, height: canvasH }}
             className="shadow-2xl shadow-black/60">
          <canvas ref={pixelRef} width={canvasW} height={canvasH}
                  style={{ imageRendering: 'pixelated', display: 'block' }} />
          <canvas ref={gridRef} width={canvasW} height={canvasH}
                  style={{ position: 'absolute', top: 0, left: 0,
                           pointerEvents: 'none', imageRendering: 'pixelated' }} />
          <canvas ref={previewRef} width={canvasW} height={canvasH}
                  style={{ position: 'absolute', top: 0, left: 0,
                           pointerEvents: 'none', imageRendering: 'pixelated' }} />
        </div>
      </div>
    </div>
  );
}
