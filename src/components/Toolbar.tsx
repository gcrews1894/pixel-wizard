import { useEffect } from 'react';
import { useCanvasStore, type Tool } from '../store/canvasStore';

const TOOLS: { id: Tool; icon: string; label: string; key: string }[] = [
  { id: 'draw',    icon: '✏️',  label: 'Draw',    key: 'D' },
  { id: 'erase',   icon: '🧹',  label: 'Erase',   key: 'E' },
  { id: 'fill',    icon: '🪣',  label: 'Fill',    key: 'F' },
  { id: 'pick',    icon: '🔍',  label: 'Pick',    key: 'I' },
  { id: 'line',    icon: '╱',   label: 'Line',    key: 'L' },
  { id: 'rect',    icon: '▭',   label: 'Rect',    key: 'R' },
  { id: 'ellipse', icon: '○',   label: 'Ellipse', key: 'O' },
];

export function Toolbar() {
  const { tool, setTool, undo, filledShape, setFilledShape } = useCanvasStore();

  const showFillToggle = tool === 'rect' || tool === 'ellipse';

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.key === 'd' || e.key === 'D') setTool('draw');
      if (e.key === 'e' || e.key === 'E') setTool('erase');
      if (e.key === 'f' || e.key === 'F') setTool('fill');
      if (e.key === 'i' || e.key === 'I') setTool('pick');
      if (e.key === 'l' || e.key === 'L') setTool('line');
      if (e.key === 'r' || e.key === 'R') setTool('rect');
      if (e.key === 'o' || e.key === 'O') setTool('ellipse');
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setTool, undo]);

  return (
    <div>
      <p className="text-[#8888aa] text-xs font-bold uppercase tracking-widest mb-3">Tools</p>
      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            title={`${t.label} (${t.key})`}
            className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg border text-xl transition-all hover:bg-[#0f3460] active:scale-95 ${
              tool === t.id
                ? 'bg-[#533483] border-[#e94560] text-white'
                : 'bg-[#1a1a2e] border-[#2a2a4a] text-[#eaeaea]'
            }`}
          >
            <span>{t.icon}</span>
            <span className="text-[11px] text-[#8888aa] leading-none">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Filled/outline toggle — only for rect/ellipse */}
      {showFillToggle && (
        <div className="mt-3 flex bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg overflow-hidden">
          {[false, true].map(filled => (
            <button
              key={String(filled)}
              onClick={() => setFilledShape(filled)}
              className={`flex-1 py-1.5 text-xs font-semibold transition-all ${
                filledShape === filled
                  ? 'bg-[#533483] text-white'
                  : 'text-[#8888aa] hover:text-[#eaeaea]'
              }`}
            >
              {filled ? 'Filled' : 'Outline'}
            </button>
          ))}
        </div>
      )}

      <p className="text-[#555577] text-[11px] mt-3 leading-relaxed">
        Right-click = erase<br />Ctrl+Z = undo
      </p>
    </div>
  );
}
