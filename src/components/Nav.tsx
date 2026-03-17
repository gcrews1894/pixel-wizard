import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProjectStore } from '../store/projectStore';

export function Nav() {
  const { user, signOut } = useAuth();
  const resetToGuest = useProjectStore(s => s.resetToGuest);
  const navigate = useNavigate();

  async function handleSignOut() {
    resetToGuest();
    await signOut();
    navigate('/');
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-[#16213e]/80 backdrop-blur-sm border-b border-[#2a2a4a] sticky top-0 z-50">
      <Link to="/" className="text-[#e94560] font-bold text-xl tracking-wide select-none hover:opacity-80 transition-opacity">
        ✦ Pixel Wizard
      </Link>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link
              to="/app"
              className="px-4 py-2 text-sm text-[#8888aa] hover:text-[#eaeaea] transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-[#555577] text-xs hidden sm:block max-w-[160px] truncate">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-[#8888aa] hover:text-[#eaeaea] transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-4 py-2 text-sm text-[#8888aa] hover:text-[#eaeaea] transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/login?mode=signup"
              className="px-4 py-2 bg-[#e94560] text-white rounded-lg text-sm font-semibold hover:opacity-80 active:scale-95 transition-all"
            >
              Start for free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
