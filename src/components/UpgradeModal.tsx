import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  onClose: () => void;
}

export function UpgradeModal({ onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleUpgrade() {
    setBusy(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session');
      if (fnError) {
        setError(fnError.message ?? 'Something went wrong. Please try again.');
        setBusy(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError(data?.error ?? 'Something went wrong. Please try again.');
        setBusy(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-[#16213e] border border-[#2a2a4a] rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">✦</div>
          <h2 className="text-xl font-bold text-[#eaeaea] mb-2">Upgrade to Pro</h2>
          <p className="text-[#8888aa] text-sm">
            You've reached the free tier project limit. Upgrade to Pro for unlimited projects and cloud sync.
          </p>
        </div>

        <ul className="flex flex-col gap-2 mb-6">
          {[
            'Unlimited projects',
            'Cloud sync across devices',
            'Priority support',
          ].map(feature => (
            <li key={feature} className="flex items-center gap-2 text-sm text-[#eaeaea]">
              <span className="text-[#e94560]">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        {error && <p className="text-[#e94560] text-sm mb-4">{error}</p>}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpgrade}
            disabled={busy}
            className="w-full py-3 bg-[#e94560] text-white rounded-lg text-sm font-semibold hover:opacity-80 active:scale-95 transition-all disabled:opacity-50"
          >
            {busy ? 'Redirecting to checkout…' : 'Upgrade to Pro'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-[#8888aa] text-sm hover:text-[#eaeaea] transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
