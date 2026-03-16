import { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { SimplePicker } from './SimplePicker';
import { FullPicker } from './FullPicker';

type Mode = 'simple' | 'full';

export function ColorPicker() {
  const { currentColor, recentColors, setCurrentColor, addRecentColor } = useCanvasStore();
  const [mode, setMode] = useState<Mode>('simple');

  function handleSwatchClick() {
    setMode('full');
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Current color swatch */}
      <div>
        <p className="text-[#8888aa] text-xs font-bold uppercase tracking-widest mb-2">
          Color
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSwatchClick}
            title="Open full picker"
            style={{ background: currentColor }}
            className="w-12 h-12 rounded-lg border-2 border-[#2a2a4a] flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
          />
          <span className="text-[#8888aa] text-sm font-mono">{currentColor}</span>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg overflow-hidden">
        {(['simple', 'full'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-sm font-semibold capitalize transition-all ${
              mode === m
                ? 'bg-[#533483] text-white'
                : 'text-[#8888aa] hover:text-[#eaeaea]'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Picker content */}
      {mode === 'simple' ? <SimplePicker /> : <FullPicker />}

      {/* Recent colors */}
      {recentColors.length > 0 && (
        <div>
          <p className="text-[#8888aa] text-xs font-bold uppercase tracking-widest mb-2">
            Recent
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recentColors.map((c, i) => (
              <button
                key={`${c}-${i}`}
                title={c}
                style={{ background: c }}
                onClick={() => { setCurrentColor(c); addRecentColor(c); }}
                className="w-7 h-7 rounded border border-[#2a2a4a] transition-transform hover:scale-125"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
