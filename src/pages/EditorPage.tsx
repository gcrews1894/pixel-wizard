import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Canvas } from '../components/Canvas';
import { Toolbar } from '../components/Toolbar';
import { ColorPicker } from '../components/ColorPicker';
import { DownloadPanel } from '../components/DownloadPanel';
import { usePersistence } from '../hooks/usePersistence';
import { useViewport } from '../hooks/useViewport';
import { useProjectStore } from '../store/projectStore';
import { useCanvasStore } from '../store/canvasStore';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject } = useProjectStore();
  const { clearCanvas } = useCanvasStore();

  // Redirect if project doesn't exist
  useEffect(() => {
    if (id && !getProject(id)) {
      navigate('/app', { replace: true });
    }
  }, [id, getProject, navigate]);

  // Clear canvas state when leaving so dashboard thumbnails aren't stale
  useEffect(() => {
    return () => { clearCanvas(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  usePersistence(id ?? '');
  const viewportControls = useViewport();
  const { viewport, fitToWindow, zoomStep } = viewportControls;
  const zoomPct = Math.round(viewport.zoom * 100);

  if (!id) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#1a1a2e] text-[#eaeaea]">
      <Header projectId={id} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 bg-[#16213e] border-r border-[#2a2a4a] flex flex-col gap-6 p-4 overflow-y-auto">
          <Toolbar />
          <div className="h-px bg-[#2a2a4a]" />
          <ColorPicker />
        </aside>

        {/* Canvas area */}
        <main
          className="relative flex-1 overflow-hidden"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, rgba(83,52,131,.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(233,69,96,.1) 0%, transparent 50%),
              #1a1a2e
            `,
          }}
        >
          <Canvas viewportControls={viewportControls} />

          {/* Zoom controls overlay */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-[#16213e]/90 backdrop-blur-sm border border-[#2a2a4a] rounded-lg px-2 py-1.5 select-none">
            <button onClick={() => zoomStep(-1)} title="Zoom out (−)"
              className="w-7 h-7 flex items-center justify-center rounded text-[#8888aa] hover:text-[#eaeaea] hover:bg-[#2a2a4a] transition-all text-lg leading-none">
              −
            </button>
            <button onClick={fitToWindow} title="Fit to window (0)"
              className="min-w-[4rem] text-center text-sm font-mono text-[#eaeaea] hover:text-[#e94560] transition-colors px-1">
              {zoomPct}%
            </button>
            <button onClick={() => zoomStep(1)} title="Zoom in (+)"
              className="w-7 h-7 flex items-center justify-center rounded text-[#8888aa] hover:text-[#eaeaea] hover:bg-[#2a2a4a] transition-all text-lg leading-none">
              +
            </button>
            <div className="w-px h-4 bg-[#2a2a4a] mx-0.5" />
            <button onClick={fitToWindow} title="Fit to window (0)"
              className="w-7 h-7 flex items-center justify-center rounded text-[#8888aa] hover:text-[#eaeaea] hover:bg-[#2a2a4a] transition-all text-xs">
              ⊡
            </button>
          </div>
        </main>
      </div>

      <DownloadPanel />
    </div>
  );
}
