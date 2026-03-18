import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { useAuth } from '../context/AuthContext';

// Small pixel art sprite that animates on load
function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const S = 8; // cell size px
    const W = 16, H = 16;
    canvas.width  = W * S;
    canvas.height = H * S;

    // A simple pixel art heart + star pattern
    const art: [number, number, string][] = [
      // heart
      [3,2,'#e94560'],[4,2,'#e94560'],[7,2,'#e94560'],[8,2,'#e94560'],
      [2,3,'#e94560'],[3,3,'#e94560'],[4,3,'#e94560'],[5,3,'#e94560'],[6,3,'#e94560'],[7,3,'#e94560'],[8,3,'#e94560'],[9,3,'#e94560'],
      [2,4,'#e94560'],[3,4,'#ff6b87'],[4,4,'#ff6b87'],[5,4,'#e94560'],[6,4,'#e94560'],[7,4,'#ff6b87'],[8,4,'#ff6b87'],[9,4,'#e94560'],
      [2,5,'#e94560'],[3,5,'#e94560'],[4,5,'#e94560'],[5,5,'#e94560'],[6,5,'#e94560'],[7,5,'#e94560'],[8,5,'#e94560'],[9,5,'#e94560'],
      [3,6,'#e94560'],[4,6,'#e94560'],[5,6,'#e94560'],[6,6,'#e94560'],[7,6,'#e94560'],[8,6,'#e94560'],
      [4,7,'#e94560'],[5,7,'#e94560'],[6,7,'#e94560'],[7,7,'#e94560'],
      [5,8,'#e94560'],[6,8,'#e94560'],
      // star accent
      [11,10,'#ffcc00'],[12,9,'#ffcc00'],[13,10,'#ffcc00'],[12,11,'#ffcc00'],
      [12,10,'#fff8b0'],
      // dots
      [1,11,'#533483'],[2,13,'#533483'],[14,5,'#533483'],[13,13,'#533483'],
      [0,6,'#0099cc'],[14,12,'#0099cc'],
    ];

    let i = 0;
    // Draw checkerboard background
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#2a2a46' : '#222240';
        ctx.fillRect(x * S, y * S, S, S);
      }
    }

    const id = setInterval(() => {
      if (i >= art.length) { clearInterval(id); return; }
      const [x, y, color] = art[i++];
      ctx.fillStyle = color;
      ctx.fillRect(x * S, y * S, S, S);
    }, 30);

    return () => clearInterval(id);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ imageRendering: 'pixelated', width: 128, height: 128 }}
      className="rounded-lg shadow-2xl shadow-[#e94560]/20"
    />
  );
}

const FEATURES = [
  {
    icon: '🎨',
    title: 'Professional tools',
    desc: 'Draw, erase, flood fill, eyedropper, line, rectangle, and ellipse tools — everything you need for crisp pixel art.',
  },
  {
    icon: '🖌️',
    title: 'Smart color picker',
    desc: 'Switch between a curated 32-color palette and a full color wheel with RGB sliders and hex input.',
  },
  {
    icon: '⬇️',
    title: 'Export anywhere',
    desc: 'Download as PNG, JPEG, or WebP at up to 32× scale. Transparent backgrounds, optional grid overlay.',
  },
];

const STEPS = [
  { n: '01', title: 'Create a project', desc: 'Pick a name and canvas size — 8×8 up to 256×256.' },
  { n: '02', title: 'Draw your art', desc: 'Use the full tool suite. Zoom in and pan around large canvases.' },
  { n: '03', title: 'Export & share', desc: 'Download at any scale in your preferred format.' },
];

export function LandingPage() {
  const { user, profile } = useAuth();
  const isLoggedInFree = !!user && profile?.subscription_status !== 'pro';
  const getProHref = isLoggedInFree ? '/app?upgrade=1' : '/login?upgrade=1';

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#eaeaea]">
      <Nav />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#e94560] bg-[#e94560]/10 border border-[#e94560]/30 rounded-full px-3 py-1 mb-6">
            Free to start · Cloud sync with Pro
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#eaeaea] leading-tight mb-4">
            Pixel art for<br />
            <span className="text-[#e94560]">everyone</span>
          </h1>
          <p className="text-[#8888aa] text-lg mb-8 leading-relaxed max-w-md">
            A fast, polished pixel art editor that runs in your browser.
            No installs, no sign-up — just open and create.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/login?mode=signup"
              className="px-6 py-3 bg-[#e94560] text-white rounded-lg font-semibold hover:opacity-80 active:scale-95 transition-all"
            >
              Start creating
            </Link>
            <a
              href="#features"
              className="px-6 py-3 bg-[#16213e] border border-[#2a2a4a] text-[#eaeaea] rounded-lg font-semibold hover:border-[#533483] active:scale-95 transition-all"
            >
              See features ↓
            </a>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center justify-center">
          <HeroCanvas />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[#16213e] border-y border-[#2a2a4a]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-center text-[#eaeaea] mb-2">Everything you need</h2>
          <p className="text-[#8888aa] text-center mb-12">No bloat. Just a focused, powerful pixel art tool.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 hover:border-[#533483] transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-[#eaeaea] mb-2">{f.title}</h3>
                <p className="text-[#8888aa] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-center text-[#eaeaea] mb-2">How it works</h2>
        <p className="text-[#8888aa] text-center mb-12">Up and drawing in seconds.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map(s => (
            <div key={s.n} className="text-center">
              <div className="text-4xl font-bold text-[#e94560]/30 mb-3">{s.n}</div>
              <h3 className="font-semibold text-[#eaeaea] mb-2">{s.title}</h3>
              <p className="text-[#8888aa] text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-[#16213e] border-y border-[#2a2a4a]">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-center text-[#eaeaea] mb-2">Simple pricing</h2>
          <p className="text-[#8888aa] text-center mb-12">Start free. Upgrade when you need more.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
              <h3 className="font-bold text-[#eaeaea] text-lg mb-1">Free</h3>
              <p className="text-[#e94560] text-3xl font-bold mb-4">$0</p>
              <ul className="text-[#8888aa] text-sm space-y-2 mb-6">
                {['Up to 10 projects', 'All drawing tools', 'PNG / JPEG / WebP export', 'Up to 32× scale export', 'Cloud auto-save'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-[#2ea043]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link to="/login?mode=signup" className="block text-center py-2.5 bg-[#533483] text-white rounded-lg text-sm font-semibold hover:opacity-80 transition-all">
                Get started free
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-[#1a1a2e] border border-[#533483] rounded-xl p-6 relative overflow-hidden">
              <h3 className="font-bold text-[#eaeaea] text-lg mb-1">Pro</h3>
              <p className="text-[#e94560] text-3xl font-bold mb-4">$9/mo</p>
              <ul className="text-[#8888aa] text-sm space-y-2 mb-6">
                {['Unlimited projects', 'Cloud sync across devices', 'Everything in Free', 'Priority support'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-[#533483]">✦</span> {f}
                  </li>
                ))}
              </ul>
              <Link to={getProHref} className="block text-center py-2.5 bg-[#e94560] text-white rounded-lg text-sm font-semibold hover:opacity-80 transition-all">
                Get Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-[#eaeaea] mb-4">Ready to make something?</h2>
        <p className="text-[#8888aa] mb-8">Sign up free. Your work syncs to the cloud automatically.</p>
        <Link
          to="/login?mode=signup"
          className="inline-block px-8 py-4 bg-[#e94560] text-white rounded-xl font-semibold text-lg hover:opacity-80 active:scale-95 transition-all"
        >
          Start for free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2a4a] px-6 py-8 text-center text-[#555577] text-sm">
        <span className="text-[#e94560] font-bold">✦ Pixel Wizard</span>
        <span className="mx-3">·</span>
        © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
