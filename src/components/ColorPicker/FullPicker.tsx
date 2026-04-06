import { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { hexToRgb, rgbToHex, rgbToHsb, hsbToRgb, isValidHex } from '../../lib/colors';

type Mode = 'rgb' | 'hsb';

export function FullPicker() {
  const { currentColor, setCurrentColor, addRecentColor } = useCanvasStore();
  const [mode, setMode] = useState<Mode>('rgb');
  const [hexInput, setHexInput] = useState(currentColor);

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

  function handleHexInput(val: string) {
    setHexInput(val);
    const normalized = val.startsWith('#') ? val : '#' + val;
    if (isValidHex(normalized)) applyColor(normalized);
  }

  // RGB mode
  const { r, g, b } = hexToRgb(currentColor);
  function handleRgbSlider(channel: 'r' | 'g' | 'b', val: number) {
    const cur = hexToRgb(currentColor);
    applyColor(rgbToHex({ ...cur, [channel]: val }.r, { ...cur, [channel]: val }.g, { ...cur, [channel]: val }.b));
  }

  // HSB mode
  const { h, s, bv } = rgbToHsb(r, g, b);
  function handleHsbSlider(channel: 'h' | 's' | 'bv', val: number) {
    const cur = rgbToHsb(r, g, b);
    const next = { ...cur, [channel]: val };
    const rgb = hsbToRgb(next.h, next.s, next.bv);
    applyColor(rgbToHex(rgb.r, rgb.g, rgb.b));
  }

  const rgbSliders = [
    { key: 'r' as const, label: 'R', color: '#e94560', val: r, max: 255 },
    { key: 'g' as const, label: 'G', color: '#22c55e', val: g, max: 255 },
    { key: 'b' as const, label: 'B', color: '#3b82f6', val: b, max: 255 },
  ];

  const hsbSliders = [
    { key: 'h' as const, label: 'H', unit: '°', color: '#f59e0b', val: h, max: 360 },
    { key: 's' as const, label: 'S', unit: '%', color: '#a78bfa', val: s, max: 100 },
    { key: 'bv' as const, label: 'B', unit: '%', color: '#94a3b8', val: bv, max: 100 },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Native color wheel */}
      <input
        type="color"
        value={currentColor}
        onChange={handleNative}
        className="w-full h-24 rounded-lg cursor-pointer"
      />

      {/* Mode toggle */}
      <div className="flex bg-[#1a1a2e] rounded-md p-0.5 text-xs font-semibold">
        {(['rgb', 'hsb'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1 rounded transition-colors uppercase tracking-wide ${
              mode === m
                ? 'bg-[#533483] text-white'
                : 'text-[#8888aa] hover:text-[#eaeaea]'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Sliders */}
      {mode === 'rgb'
        ? rgbSliders.map(({ key, label, color, val, max }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span style={{ color }} className="font-semibold">{label}</span>
                <span className="text-[#8888aa] font-mono">{val}</span>
              </div>
              <input
                type="range" min={0} max={max} value={val}
                onChange={e => handleRgbSlider(key, +e.target.value)}
                className="w-full"
              />
            </div>
          ))
        : hsbSliders.map(({ key, label, unit, color, val, max }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span style={{ color }} className="font-semibold">{label}</span>
                <span className="text-[#8888aa] font-mono">{val}{unit}</span>
              </div>
              <input
                type="range" min={0} max={max} value={val}
                onChange={e => handleHsbSlider(key, +e.target.value)}
                className="w-full"
              />
            </div>
          ))
      }

      {/* Hex input */}
      <input
        type="text"
        value={hexInput}
        onChange={e => handleHexInput(e.target.value)}
        maxLength={7}
        placeholder="#000000"
        className="w-full bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-[#e94560]"
      />
    </div>
  );
}
