import { useEffect } from 'react';
import { useCanvasStore, type Tool } from '../store/canvasStore';

const TOOLS: { id: Tool; icon: string; label: string; key: string }[] = [
  { id: 'draw',  icon: '✏️',  label: 'Draw',  key: 'D' },
  { id: 'erase', icon: '🧹', label: 'Erase', key: 'E' },
  { id: 'fill',  icon: '🪣',  label: 'Fill',  key: 'F' },
  { id: 'pick',  icon: '🔍',  label: 'Pick',  key: 'I' },
];

export function Toolbar() {
  const { tool, setTool, undo } = useCanvasStore();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.key === 'd' || e.key === 'D') setTool('draw');
      if (e.key === 'e' || e.key === 'E') setTool('erase');
      if (e.key === 'f' || e.key === 'F') setTool('fill');
      if (e.key === 'i' || e.key === 'I') setTool('pick');
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
      <p className="text-[#8888aa] text-[10px] font-bold uppercase tracking-widest mb-2">Tools</p>
      <div className="grid grid-cols-2 gap-1.5">
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            title={`${t.label} (${t.key})`}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg border text-base transition-all hover:bg-[#0f3460] active:scale-95 ${
              tool === t.id
                ? 'bg-[#533483] border-[#e94560] text-white'
                : 'bg-[#1a1a2e] border-[#2a2a4a] text-[#eaeaea]'
            }`}
          >
            <span>{t.icon}</span>
            <span className="text-[9px] text-[#8888aa] leading-none">{t.label}</span>
          </button>
        ))}
      </div>
      <p className="text-[#555577] text-[9px] mt-2 leading-relaxed">
        Right-click = erase<br />Ctrl+Z = undo
      </p>
    </div>
  );
}
