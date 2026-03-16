import { useEffect, useRef } from 'react';
import { useCanvasStore, type StoredState } from '../store/canvasStore';

const STORAGE_KEY = 'pixel-wizard-state';
const DEBOUNCE_MS = 400;

export function usePersistence() {
  const store = useCanvasStore();
  const hydrateFromStorage = useCanvasStore(s => s.hydrateFromStorage);
  const hasHydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore on mount (runs once)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: Partial<StoredState> = JSON.parse(raw);
        hydrateFromStorage(saved);
      }
    } catch {
      // corrupt storage — ignore
    }
    hasHydrated.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on every relevant state change (debounced)
  useEffect(() => {
    if (!hasHydrated.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        const toSave: StoredState = {
          gridW: store.gridW,
          gridH: store.gridH,
          pixels: store.pixels,
          currentColor: store.currentColor,
          recentColors: store.recentColors,
          showGrid: store.showGrid,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch {
        // storage full or unavailable — ignore
      }
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    store.gridW,
    store.gridH,
    store.pixels,
    store.currentColor,
    store.recentColors,
    store.showGrid,
  ]);
}
