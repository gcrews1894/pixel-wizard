import { Header } from './components/Header';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { ColorPicker } from './components/ColorPicker';
import { DownloadPanel } from './components/DownloadPanel';
import { usePersistence } from './hooks/usePersistence';

export default function App() {
  usePersistence();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#1a1a2e] text-[#eaeaea]">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 bg-[#16213e] border-r border-[#2a2a4a] flex flex-col gap-5 p-3.5 overflow-y-auto">
          <Toolbar />
          <div className="h-px bg-[#2a2a4a]" />
          <ColorPicker />
        </aside>

        {/* Canvas area */}
        <main
          className="flex-1 flex items-center justify-center overflow-auto p-5"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, rgba(83,52,131,.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(233,69,96,.1) 0%, transparent 50%),
              #1a1a2e
            `,
          }}
        >
          <Canvas />
        </main>
      </div>

      <DownloadPanel />
    </div>
  );
}
