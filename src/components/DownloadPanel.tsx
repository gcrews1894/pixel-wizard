import { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { exportCanvas, type ExportOptions } from '../lib/canvas';

const SCALES = [1, 2, 4, 8, 16, 32] as const;
const FORMATS = ['png', 'jpeg', 'webp'] as const;

export function DownloadPanel() {
  const { pixels, gridW, gridH } = useCanvasStore();

  const [scale, setScale]         = useState<number>(4);
  const [format, setFormat]       = useState<ExportOptions['format']>('png');
  const [includeGrid, setIncludeGrid] = useState(false);
  const [transparent, setTransparent] = useState(true);

  const outW = gridW * scale;
  const outH = gridH * scale;

  function handleDownload() {
    const dataURL = exportCanvas(pixels, gridW, gridH, { scale, format, includeGrid, transparent });
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `pixel-wizard.${format}`;
    a.click();
  }

  return (
    <div className="flex items-center gap-5 px-5 py-3 bg-[#16213e] border-t border-[#2a2a4a] flex-wrap shrink-0">
      <span className="text-[#8888aa] text-xs font-bold uppercase tracking-widest whitespace-nowrap">
        ⬇ Download
      </span>

      {/* Scale */}
      <div className="flex items-center gap-2">
        <label className="text-[#8888aa] text-sm">Scale</label>
        <select
          value={scale}
          onChange={e => setScale(+e.target.value)}
          className="bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#e94560] cursor-pointer"
        >
          {SCALES.map(s => (
            <option key={s} value={s}>{s}×</option>
          ))}
        </select>
      </div>

      {/* Format */}
      <div className="flex items-center gap-2">
        <label className="text-[#8888aa] text-sm">Format</label>
        <select
          value={format}
          onChange={e => setFormat(e.target.value as ExportOptions['format'])}
          className="bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#e94560] cursor-pointer"
        >
          {FORMATS.map(f => (
            <option key={f} value={f}>{f.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Include grid */}
      <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-[#8888aa]">
        <input
          type="checkbox"
          checked={includeGrid}
          onChange={e => setIncludeGrid(e.target.checked)}
        />
        Include grid
      </label>

      {/* Transparent BG */}
      <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-[#8888aa]">
        <input
          type="checkbox"
          checked={transparent}
          onChange={e => setTransparent(e.target.checked)}
          disabled={format === 'jpeg'}
        />
        Transparent BG
        {format === 'jpeg' && (
          <span className="text-[#555577] text-xs">(N/A for JPEG)</span>
        )}
      </label>

      {/* Size preview */}
      <span className="text-[#555577] text-sm font-mono ml-auto">
        Output: {outW} × {outH} px
      </span>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="px-5 py-2 bg-[#2ea043] text-white rounded-md text-sm font-semibold hover:opacity-80 active:scale-95 transition-all whitespace-nowrap"
      >
        ⬇ Download
      </button>
    </div>
  );
}
