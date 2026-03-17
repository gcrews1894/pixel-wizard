import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';

const PRESETS = [8, 16, 32, 48, 64] as const;

interface Props {
  onClose: () => void;
}

export function NewProjectModal({ onClose }: Props) {
  const navigate = useNavigate();
  const { createProject } = useProjectStore();
  const [name, setName] = useState('Untitled');
  const [preset, setPreset] = useState<string>('16');
  const [customW, setCustomW] = useState('32');
  const [customH, setCustomH] = useState('32');

  function getResolution(): [number, number] {
    if (preset === 'custom') {
      const w = Math.max(1, Math.min(256, parseInt(customW) || 16));
      const h = Math.max(1, Math.min(256, parseInt(customH) || 16));
      return [w, h];
    }
    const n = parseInt(preset);
    return [n, n];
  }

  async function handleCreate() {
    const [w, h] = getResolution();
    const project = await createProject(name, w, h);
    navigate(`/editor/${project.id}`);
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#16213e] border border-[#2a2a4a] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-[#eaeaea] font-bold text-lg mb-5">New Project</h2>

        {/* Name */}
        <div className="mb-4">
          <label className="text-[#8888aa] text-xs font-bold uppercase tracking-widest mb-1.5 block">
            Name
          </label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="w-full bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#e94560]"
          />
        </div>

        {/* Canvas size */}
        <div className="mb-6">
          <label className="text-[#8888aa] text-xs font-bold uppercase tracking-widest mb-1.5 block">
            Canvas Size
          </label>
          <select
            value={preset}
            onChange={e => setPreset(e.target.value)}
            className="w-full bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#e94560] cursor-pointer mb-2"
          >
            {PRESETS.map(n => (
              <option key={n} value={n}>{n} × {n}</option>
            ))}
            <option value="custom">Custom…</option>
          </select>

          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <label className="text-[#8888aa] text-sm">W</label>
              <input type="number" value={customW} onChange={e => setCustomW(e.target.value)}
                min={1} max={256}
                className="flex-1 bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#e94560]" />
              <label className="text-[#8888aa] text-sm">H</label>
              <input type="number" value={customH} onChange={e => setCustomH(e.target.value)}
                min={1} max={256}
                className="flex-1 bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#e94560]" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#1a1a2e] border border-[#2a2a4a] text-[#8888aa] rounded-lg text-sm hover:text-[#eaeaea] active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 py-2.5 bg-[#e94560] text-white rounded-lg text-sm font-semibold hover:opacity-80 active:scale-95 transition-all"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
