import { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { supabase } from '../lib/supabase';
import type { Pixels } from '../lib/canvas';

export function GeneratePanel() {
  const { gridW, gridH, pushUndo, setPixels } = useCanvasStore();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeWarning = gridW > 32 || gridH > 32;

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

      if (fnError || !data?.pixels) {
        throw new Error(fnError?.message ?? 'No pixel data returned');
      }

      pushUndo();
      setPixels(data.pixels as Pixels);
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
          Best results on 32×32 or smaller. Larger canvases may be less accurate.
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
