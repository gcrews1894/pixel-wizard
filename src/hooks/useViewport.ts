import { useState, useRef, useCallback, useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';

export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface ViewportControls {
  viewport: Viewport;
  containerRef: React.RefObject<HTMLDivElement | null>;
  fitToWindow: () => void;
  zoomStep: (direction: 1 | -1) => void;
  zoomAround: (newZoom: number, originX: number, originY: number) => void;
  panBy: (dx: number, dy: number) => void;
  isPanning: React.RefObject<boolean>;
  spaceHeld: React.RefObject<boolean>;
}

const ZOOM_STEPS = [0.25, 0.5, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32];
const BASE_CELL = 16; // canvas pixels per grid cell

function clampZoom(z: number) {
  return Math.min(Math.max(z, ZOOM_STEPS[0]), ZOOM_STEPS[ZOOM_STEPS.length - 1]);
}

export function useViewport(): ViewportControls {
  const containerRef = useRef<HTMLDivElement>(null);
  const { gridW, gridH } = useCanvasStore();
  const isPanning = useRef(false);
  const spaceHeld = useRef(false);

  const [viewport, setViewport] = useState<Viewport>({ zoom: 1, panX: 0, panY: 0 });

  const canvasW = BASE_CELL * gridW;
  const canvasH = BASE_CELL * gridH;

  const fitToWindow = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const padding = 80;
    const fitZoom = Math.min(
      (width  - padding) / canvasW,
      (height - padding) / canvasH,
    );
    const zoom = clampZoom(fitZoom);
    const panX = (width  - canvasW * zoom) / 2;
    const panY = (height - canvasH * zoom) / 2;
    setViewport({ zoom, panX, panY });
  }, [canvasW, canvasH]);

  // Re-fit whenever grid dimensions change
  useEffect(() => {
    // Small delay to let layout settle after a resolution change
    const id = setTimeout(fitToWindow, 0);
    return () => clearTimeout(id);
  }, [gridW, gridH, fitToWindow]);

  // Initial fit after mount
  useEffect(() => {
    fitToWindow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoomAround = useCallback(
    (newZoom: number, originX: number, originY: number) => {
      const clamped = clampZoom(newZoom);
      setViewport(prev => {
        // Keep the point under the cursor fixed
        const scale = clamped / prev.zoom;
        return {
          zoom: clamped,
          panX: originX - (originX - prev.panX) * scale,
          panY: originY - (originY - prev.panY) * scale,
        };
      });
    },
    [],
  );

  const zoomStep = useCallback(
    (direction: 1 | -1) => {
      setViewport(prev => {
        const idx = ZOOM_STEPS.findIndex(z => z >= prev.zoom);
        const nextIdx = Math.min(
          Math.max(idx + direction, 0),
          ZOOM_STEPS.length - 1,
        );
        const newZoom = ZOOM_STEPS[nextIdx];
        // Zoom around canvas center
        const el = containerRef.current;
        if (!el) return { ...prev, zoom: newZoom };
        const { width, height } = el.getBoundingClientRect();
        const ox = width  / 2;
        const oy = height / 2;
        const scale = newZoom / prev.zoom;
        return {
          zoom: newZoom,
          panX: ox - (ox - prev.panX) * scale,
          panY: oy - (oy - prev.panY) * scale,
        };
      });
    },
    [],
  );

  const panBy = useCallback((dx: number, dy: number) => {
    setViewport(prev => ({ ...prev, panX: prev.panX + dx, panY: prev.panY + dy }));
  }, []);

  return { viewport, containerRef, fitToWindow, zoomStep, zoomAround, panBy, isPanning, spaceHeld };
}
