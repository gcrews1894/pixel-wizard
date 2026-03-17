import { Link } from 'react-router-dom';

export function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-[#16213e]/80 backdrop-blur-sm border-b border-[#2a2a4a] sticky top-0 z-50">
      <Link to="/" className="text-[#e94560] font-bold text-xl tracking-wide select-none hover:opacity-80 transition-opacity">
        ✦ Pixel Wizard
      </Link>
      <div className="flex items-center gap-3">
        <Link
          to="/app"
          className="px-4 py-2 text-sm text-[#8888aa] hover:text-[#eaeaea] transition-colors"
        >
          Dashboard
        </Link>
        <Link
          to="/app"
          className="px-4 py-2 bg-[#e94560] text-white rounded-lg text-sm font-semibold hover:opacity-80 active:scale-95 transition-all"
        >
          Start for free
        </Link>
      </div>
    </nav>
  );
}
