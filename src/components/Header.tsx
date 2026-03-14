import { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';

const PRESETS = [8, 16, 32, 48, 64] as const;

export function Header() {
  const { gridW, gridH, showGrid, setShowGrid, setResolution, clearCanvas } =
    useCanvasStore();
  const [preset, setPreset] = useState<string>('16');
  const [customW, setCustomW] = useState(String(gridW));
  const [customH, setCustomH] = useState(String(gridH));
  const [showCustom, setShowCustom] = useState(false);

  function handlePresetChange(val: string) {
    setPreset(val);
    if (val === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      const n = parseInt(val);
      setResolution(n, n);
    }
  }

  function handleApplyCustom() {
    const w = Math.max(1, Math.min(256, parseInt(customW) || 16));
    const h = Math.max(1, Math.min(256, parseInt(customH) || 16));
    setResolution(w, h);
  }

  function handleClear() {
    if (window.confirm('Clear the canvas? This cannot be undone.')) {
      clearCanvas();
    }
  }

  return (
    <header className="flex items-center gap-4 px-4 py-2.5 bg-[#16213e] border-b border-[#2a2a4a] flex-wrap shrink-0">
      <h1 className="text-[#e94560] font-bold text-xl tracking-wide whitespace-nowrap select-none">
        ✦ Pixel Wizard
      </h1>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Preset resolution */}
        <div className="flex items-center gap-2">
          <label className="text-[#8888aa] text-xs">Size</label>
          <select
            value={preset}
            onChange={e => handlePresetChange(e.target.value)}
            className="bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-md px-2 py-1 text-sm outline-none focus:border-[#e94560] cursor-pointer"
          >
            {PRESETS.map(n => (
              <option key={n} value={n}>
                {n} × {n}
              </option>
            ))}
            <option value="custom">Custom…</option>
          </select>
        </div>

        {/* Custom size */}
        {showCustom && (
          <div className="flex items-center gap-1.5">
            <label className="text-[#8888aa] text-xs">W</label>
            <input
              type="number"
              value={customW}
              onChange={e => setCustomW(e.target.value)}
              min={1}
              max={256}
              className="w-14 bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-md px-2 py-1 text-sm outline-none focus:border-[#e94560]"
            />
            <label className="text-[#8888aa] text-xs">H</label>
            <input
              type="number"
              value={customH}
              onChange={e => setCustomH(e.target.value)}
              min={1}
              max={256}
              className="w-14 bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-md px-2 py-1 text-sm outline-none focus:border-[#e94560]"
            />
            <button
              onClick={handleApplyCustom}
              className="px-3 py-1 bg-[#0f3460] border border-[#2a2a4a] text-[#eaeaea] rounded-md text-sm hover:opacity-80 active:scale-95 transition-all"
            >
              Apply
            </button>
          </div>
        )}

        {/* Current grid info */}
        {!showCustom && (
          <span className="text-[#8888aa] text-xs font-mono">
            {gridW} × {gridH}
          </span>
        )}

        {/* Grid toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`px-3 py-1 rounded-md text-sm border transition-all hover:opacity-80 active:scale-95 ${
            showGrid
              ? 'bg-[#533483] border-[#533483] text-white'
              : 'bg-[#1a1a2e] border-[#2a2a4a] text-[#8888aa]'
          }`}
        >
          Grid {showGrid ? 'ON' : 'OFF'}
        </button>

        {/* Clear */}
        <button
          onClick={handleClear}
          className="px-3 py-1 bg-[#e94560] text-white rounded-md text-sm hover:opacity-80 active:scale-95 transition-all"
        >
          Clear
        </button>
      </div>
    </header>
  );
}
