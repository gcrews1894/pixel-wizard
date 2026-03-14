import { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { hexToRgb, rgbToHex, isValidHex } from '../../lib/colors';

export function FullPicker() {
  const { currentColor, setCurrentColor, addRecentColor } = useCanvasStore();

  const [hexInput, setHexInput] = useState(currentColor);
  const { r, g, b } = hexToRgb(currentColor);

  // Keep hex input in sync when store changes externally
  useEffect(() => {
    setHexInput(currentColor);
  }, [currentColor]);

  function applyColor(hex: string) {
    setCurrentColor(hex);
    addRecentColor(hex);
  }

  function handleNative(e: React.ChangeEvent<HTMLInputElement>) {
    applyColor(e.target.value);
  }

  function handleSlider(channel: 'r' | 'g' | 'b', val: number) {
    const cur = hexToRgb(currentColor);
    const next = { ...cur, [channel]: val };
    applyColor(rgbToHex(next.r, next.g, next.b));
  }

  function handleHexInput(val: string) {
    setHexInput(val);
    const normalized = val.startsWith('#') ? val : '#' + val;
    if (isValidHex(normalized)) applyColor(normalized);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Native color wheel */}
      <input
        type="color"
        value={currentColor}
        onChange={handleNative}
        className="w-full h-16 rounded-lg cursor-pointer"
      />

      {/* RGB Sliders */}
      {(['r', 'g', 'b'] as const).map((ch, i) => {
        const val = [r, g, b][i];
        const labels = ['R', 'G', 'B'];
        const colors  = ['#e94560', '#22c55e', '#3b82f6'];
        return (
          <div key={ch} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span style={{ color: colors[i] }} className="font-semibold">{labels[i]}</span>
              <span className="text-[#8888aa] font-mono">{val}</span>
            </div>
            <input
              type="range"
              min={0}
              max={255}
              value={val}
              onChange={e => handleSlider(ch, +e.target.value)}
              className="w-full"
            />
          </div>
        );
      })}

      {/* Hex input */}
      <input
        type="text"
        value={hexInput}
        onChange={e => handleHexInput(e.target.value)}
        maxLength={7}
        placeholder="#000000"
        className="w-full bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-md px-2 py-1.5 text-sm font-mono outline-none focus:border-[#e94560]"
      />
    </div>
  );
}
