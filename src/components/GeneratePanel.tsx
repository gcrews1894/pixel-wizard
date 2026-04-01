import { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { supabase } from '../lib/supabase';
import type { Pixels } from '../lib/canvas';

/** Convert a base64 PNG to a 2D pixel grid by drawing onto an off-screen canvas */
async function base64PngToPixels(base64: string, gridW: number, gridH: number): Promise<Pixels> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = gridW;
      canvas.height = gridH;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, gridW, gridH);
      const { data } = ctx.getImageData(0, 0, gridW, gridH);

      const pixels: Pixels = [];
      for (let y = 0; y < gridH; y++) {
        const row: (string | null)[] = [];
        for (let x = 0; x < gridW; x++) {
          const i = (y * gridW + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          // Treat pixels with low alpha as transparent
          if (a < 32) {
            row.push(null);
          } else {
            row.push(
              '#' +
              r.toString(16).padStart(2, '0') +
              g.toString(16).padStart(2, '0') +
              b.toString(16).padStart(2, '0'),
            );
          }
        }
        pixels.push(row);
      }
      resolve(pixels);
    };
    img.onerror = () => reject(new Error('Failed to decode image'));
    img.src = `data:image/png;base64,${base64}`;
  });
}

export function GeneratePanel() {
  const { gridW, gridH, pushUndo, setPixels } = useCanvasStore();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeWarning = gridW > 64 || gridH > 64;

  async function handleGenerate() {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error: fnError } = await supabase.functions.invoke('generate-pixel-art', {
        body: { prompt: trimmed, gridW, gridH },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (fnError || !data?.imageBase64) {
        throw new Error(fnError?.message ?? data?.error ?? 'No image data returned');
      }

      const pixels = await base64PngToPixels(data.imageBase64, gridW, gridH);
      pushUndo();
      setPixels(pixels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-[#8888aa] text-xs font-bold uppercase tracking-widest mb-3">
        AI Generate
      </p>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate();
        }}
        placeholder="a red mushroom with white spots…"
        rows={3}
        disabled={loading}
        className="w-full bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] text-sm rounded-lg px-3 py-2 resize-none outline-none placeholder-[#555577] focus:border-[#533483] transition-colors disabled:opacity-50"
      />

      {sizeWarning && (
        <p className="text-[#8888aa] text-[11px] mt-2 leading-relaxed">
          Best results on 64×64 or smaller. Larger canvases may be less detailed.
        </p>
      )}

      {error && (
        <p className="text-[#e94560] text-[11px] mt-2 leading-relaxed">{error}</p>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className="w-full mt-2.5 py-2 bg-[#533483] text-white text-sm font-semibold rounded-lg hover:opacity-80 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating…
          </>
        ) : (
          'Generate'
        )}
      </button>

      <p className="text-[#555577] text-[11px] mt-2 leading-relaxed">
        Overwrites canvas · Ctrl+Z to undo<br />Ctrl+Enter to generate
      </p>
    </div>
  );
}
