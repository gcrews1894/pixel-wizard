import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { ProjectCard } from '../components/ProjectCard';
import { NewProjectModal } from '../components/NewProjectModal';
import { UpgradeModal } from '../components/UpgradeModal';
import { useProjectStore } from '../store/projectStore';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type SortKey = 'updated' | 'created' | 'name';

export function DashboardPage() {
  const { user, profile } = useAuth();
  const { projects, syncFromCloud, projectLimit } = useProjectStore();
  const [showModal, setShowModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const [portalLoading, setPortalLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync projects from Supabase when user is authenticated
  useEffect(() => {
    if (user && profile) {
      syncFromCloud(user.id, profile.subscription_status);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.subscription_status]);

  // Clear ?upgraded=1 after successful Stripe checkout
  useEffect(() => {
    if (searchParams.get('upgraded') === '1') {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Auto-open upgrade modal when redirected with ?upgrade=1
  useEffect(() => {
    if (searchParams.get('upgrade') === '1') {
      setShowUpgrade(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const sorted = [...projects].sort((a, b) => {
    if (sortKey === 'name')    return a.name.localeCompare(b.name);
    if (sortKey === 'created') return b.createdAt - a.createdAt;
    return b.updatedAt - a.updatedAt;
  });
  const limit = projectLimit();
  const atLimit = sorted.length >= limit;
  const isPro = profile?.subscription_status === 'pro';

  function handleNewProject() {
    if (atLimit) setShowUpgrade(true);
    else setShowModal(true);
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error || !data?.url) throw error ?? new Error('No portal URL');
      window.location.href = data.url;
    } catch {
      alert('Could not open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#eaeaea]">
      <Nav />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#eaeaea]">My Projects</h1>
            {!isPro && limit < Infinity && (
              <p className="text-[#8888aa] text-sm mt-1">
                {sorted.length} / {limit} projects
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Sort control */}
            {sorted.length > 1 && (
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                className="bg-[#16213e] border border-[#2a2a4a] text-[#8888aa] text-sm rounded-lg px-3 py-2 outline-none hover:border-[#533483] transition-colors cursor-pointer"
              >
                <option value="updated">Last modified</option>
                <option value="created">Date created</option>
                <option value="name">Name</option>
              </select>
            )}
            {isPro ? (
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="px-4 py-2.5 border border-[#2a2a4a] text-[#8888aa] rounded-lg text-sm font-semibold hover:border-[#533483] hover:text-[#a78bfa] transition-all disabled:opacity-50"
              >
                {portalLoading ? 'Loading…' : 'Manage Billing'}
              </button>
            ) : (
              <button
                onClick={() => setShowUpgrade(true)}
                className="px-4 py-2.5 border border-[#533483] text-[#a78bfa] rounded-lg text-sm font-semibold hover:bg-[#533483]/20 transition-all"
              >
                Upgrade to Pro
              </button>
            )}
            <button
              onClick={handleNewProject}
              className="px-5 py-2.5 bg-[#e94560] text-white rounded-lg text-sm font-semibold hover:opacity-80 active:scale-95 transition-all"
            >
              + New Project
            </button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-7xl mb-6 select-none">✦</div>
            <h2 className="text-xl font-semibold text-[#eaeaea] mb-2">No projects yet</h2>
            <p className="text-[#8888aa] text-sm mb-8 max-w-sm">
              Create your first pixel art project and start drawing.
            </p>
            <button
              onClick={handleNewProject}
              className="px-6 py-3 bg-[#e94560] text-white rounded-lg text-sm font-semibold hover:opacity-80 active:scale-95 transition-all"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {/* New project card */}
            <button
              onClick={handleNewProject}
              className="aspect-square bg-[#16213e] border-2 border-dashed border-[#2a2a4a] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#e94560] hover:bg-[#1a1a2e] active:scale-95 transition-all group"
            >
              <span className="text-3xl text-[#555577] group-hover:text-[#e94560] transition-colors">+</span>
              <span className="text-[#555577] text-xs group-hover:text-[#8888aa] transition-colors">New Project</span>
            </button>

            {sorted.map(p => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>

      {showModal   && <NewProjectModal onClose={() => setShowModal(false)} />}
      {showUpgrade && <UpgradeModal   onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
