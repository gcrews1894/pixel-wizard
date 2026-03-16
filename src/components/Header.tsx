import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCanvasStore } from '../store/canvasStore';
import { useProjectStore } from '../store/projectStore';

const PRESETS = [8, 16, 32, 48, 64] as const;

interface Props {
  projectId: string;
}

export function Header({ projectId }: Props) {
  const { gridW, gridH, showGrid, setShowGrid, setResolution, clearCanvas } = useCanvasStore();
  const { getProject, updateProject } = useProjectStore();

  const project = getProject(projectId);

  const [preset, setPreset] = useState<string>('16');
  const [customW, setCustomW] = useState(String(gridW));
  const [customH, setCustomH] = useState(String(gridH));
  const [showCustom, setShowCustom] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(project?.name ?? 'Untitled');

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

  function handleNameSubmit() {
    const trimmed = nameInput.trim();
    if (trimmed) updateProject(projectId, { name: trimmed });
    else setNameInput(project?.name ?? 'Untitled');
    setEditingName(false);
  }

  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-[#16213e] border-b border-[#2a2a4a] flex-wrap shrink-0">
      {/* Back link + project name */}
      <div className="flex items-center gap-3 mr-2">
        <Link
          to="/app"
          className="text-[#8888aa] hover:text-[#e94560] text-sm transition-colors whitespace-nowrap"
          title="Back to projects"
        >
          ← Projects
        </Link>
        <span className="text-[#2a2a4a]">|</span>
        {editingName ? (
          <input
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={e => {
              if (e.key === 'Enter') handleNameSubmit();
              if (e.key === 'Escape') { setNameInput(project?.name ?? 'Untitled'); setEditingName(false); }
            }}
            className="bg-[#1a1a2e] border border-[#e94560] text-[#eaeaea] rounded px-2 py-1 text-sm outline-none w-40"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-[#eaeaea] text-sm font-semibold hover:text-[#e94560] transition-colors whitespace-nowrap"
            title="Click to rename"
          >
            {project?.name ?? 'Untitled'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Preset resolution */}
        <div className="flex items-center gap-2">
          <label className="text-[#8888aa] text-sm">Size</label>
          <select
            value={preset}
            onChange={e => handlePresetChange(e.target.value)}
            className="bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#e94560] cursor-pointer"
          >
            {PRESETS.map(n => (
              <option key={n} value={n}>{n} × {n}</option>
            ))}
            <option value="custom">Custom…</option>
          </select>
        </div>

        {showCustom && (
          <div className="flex items-center gap-2">
            <label className="text-[#8888aa] text-sm">W</label>
            <input type="number" value={customW} onChange={e => setCustomW(e.target.value)}
              min={1} max={256}
              className="w-16 bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#e94560]" />
            <label className="text-[#8888aa] text-sm">H</label>
            <input type="number" value={customH} onChange={e => setCustomH(e.target.value)}
              min={1} max={256}
              className="w-16 bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#e94560]" />
            <button onClick={handleApplyCustom}
              className="px-4 py-1.5 bg-[#0f3460] border border-[#2a2a4a] text-[#eaeaea] rounded-md text-sm hover:opacity-80 active:scale-95 transition-all">
              Apply
            </button>
          </div>
        )}

        {!showCustom && (
          <span className="text-[#8888aa] text-sm font-mono">{gridW} × {gridH}</span>
        )}

        <button onClick={() => setShowGrid(!showGrid)}
          className={`px-4 py-1.5 rounded-md text-sm border transition-all hover:opacity-80 active:scale-95 ${
            showGrid ? 'bg-[#533483] border-[#533483] text-white' : 'bg-[#1a1a2e] border-[#2a2a4a] text-[#8888aa]'
          }`}>
          Grid {showGrid ? 'ON' : 'OFF'}
        </button>

        <button onClick={handleClear}
          className="px-4 py-1.5 bg-[#e94560] text-white rounded-md text-sm hover:opacity-80 active:scale-95 transition-all">
          Clear
        </button>
      </div>
    </header>
  );
}
