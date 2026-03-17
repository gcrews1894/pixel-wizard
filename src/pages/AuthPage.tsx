import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  // Redirect already-authenticated users
  useEffect(() => {
    if (!loading && user) navigate('/app', { replace: true });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);

    if (tab === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message);
      else setInfo('Check your email to confirm your account, then sign in.');
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
      else navigate('/app', { replace: true });
    }

    setBusy(false);
  }

  async function handleGoogle() {
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (err) setError(err.message);
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center px-4">
      <Link to="/" className="text-[#e94560] font-bold text-2xl tracking-wide mb-10 hover:opacity-80 transition-opacity">
        ✦ Pixel Wizard
      </Link>

      <div className="w-full max-w-sm bg-[#16213e] border border-[#2a2a4a] rounded-2xl p-8">
        {/* Tab toggle */}
        <div className="flex rounded-lg overflow-hidden border border-[#2a2a4a] mb-6">
          {(['signin', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setInfo(''); }}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                tab === t
                  ? 'bg-[#e94560] text-white'
                  : 'bg-transparent text-[#8888aa] hover:text-[#eaeaea]'
              }`}
            >
              {t === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#8888aa] text-xs uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#e94560] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[#8888aa] text-xs uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#e94560] transition-colors"
            />
          </div>

          {error && <p className="text-[#e94560] text-sm">{error}</p>}
          {info  && <p className="text-[#2ea043] text-sm">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 py-2.5 bg-[#e94560] text-white rounded-lg text-sm font-semibold hover:opacity-80 active:scale-95 transition-all disabled:opacity-50"
          >
            {busy ? '…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#2a2a4a]" />
          <span className="text-[#555577] text-xs">or</span>
          <div className="flex-1 h-px bg-[#2a2a4a]" />
        </div>

        <button
          onClick={handleGoogle}
          className="w-full py-2.5 bg-[#1a1a2e] border border-[#2a2a4a] text-[#eaeaea] rounded-lg text-sm font-semibold hover:border-[#8888aa] hover:bg-[#0f1a2e] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
            <path d="M47.532 24.552c0-1.636-.145-3.2-.415-4.695H24v9.008h13.192c-.57 3.07-2.293 5.672-4.882 7.416v6.168h7.9c4.62-4.255 7.322-10.521 7.322-17.897z" fill="#4285F4"/>
            <path d="M24 48c6.48 0 11.912-2.148 15.882-5.82l-7.9-6.168c-2.147 1.44-4.893 2.292-7.982 2.292-6.14 0-11.34-4.148-13.195-9.722H2.64v6.366C6.59 42.82 14.728 48 24 48z" fill="#34A853"/>
            <path d="M10.805 28.582A14.935 14.935 0 0 1 10 24c0-1.596.272-3.142.805-4.582v-6.366H2.64A24.005 24.005 0 0 0 0 24c0 3.876.924 7.542 2.64 10.948l8.165-6.366z" fill="#FBBC05"/>
            <path d="M24 9.688c3.46 0 6.562 1.19 9.004 3.52l6.748-6.748C35.91 2.69 30.478 0 24 0 14.728 0 6.59 5.18 2.64 13.052l8.165 6.366C12.66 13.836 17.86 9.688 24 9.688z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
