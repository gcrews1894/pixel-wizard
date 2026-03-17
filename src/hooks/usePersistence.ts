import { useEffect, useRef } from 'react';
import { useCanvasStore, type StoredState } from '../store/canvasStore';
import { useProjectStore } from '../store/projectStore';
import { exportCanvas } from '../lib/canvas';

const DEBOUNCE_MS = 400;

export function usePersistence(projectId: string) {
  const store = useCanvasStore();
  const hydrateFromStorage = useCanvasStore(s => s.hydrateFromStorage);
  const { getProject, updateProject } = useProjectStore();
  const hasHydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load project into canvas store on mount / when projectId changes
  useEffect(() => {
    hasHydrated.current = false;
    const project = getProject(projectId);
    if (project) {
      hydrateFromStorage({
        gridW: project.gridW,
        gridH: project.gridH,
        pixels: project.pixels,
        currentColor: store.currentColor,
        recentColors: store.recentColors,
        showGrid: store.showGrid,
      });
    }
    hasHydrated.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Auto-save back to project store (debounced)
  useEffect(() => {
    if (!hasHydrated.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const toSave: Partial<StoredState> = {
        gridW: store.gridW,
        gridH: store.gridH,
        pixels: store.pixels,
      };
      // Generate thumbnail (small scale for speed)
      const thumbnail = exportCanvas(store.pixels, store.gridW, store.gridH, {
        scale: Math.max(1, Math.floor(64 / Math.max(store.gridW, store.gridH))),
        format: 'png',
        includeGrid: false,
        transparent: true,
      });
      updateProject(projectId, { ...toSave, thumbnail });
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    projectId,
    store.gridW,
    store.gridH,
    store.pixels,
    updateProject,
  ]);
}
