import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types/project';
import { useProjectStore } from '../store/projectStore';

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)  return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

interface Props {
  project: Project;
}

export function ProjectCard({ project }: Props) {
  const navigate = useNavigate();
  const { updateProject, deleteProject } = useProjectStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(project.name);

  function handleRenameSubmit() {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== project.name) {
      updateProject(project.id, { name: trimmed });
    } else {
      setNameInput(project.name);
    }
    setIsRenaming(false);
  }

  function handleDelete() {
    if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      deleteProject(project.id);
    }
  }

  return (
    <div className="group bg-[#16213e] border border-[#2a2a4a] rounded-xl overflow-hidden hover:border-[#533483] transition-all hover:shadow-lg hover:shadow-black/30">
      {/* Thumbnail */}
      <button
        onClick={() => navigate(`/editor/${project.id}`)}
        className="w-full aspect-square bg-[#1a1a2e] flex items-center justify-center overflow-hidden"
        style={{ imageRendering: 'pixelated' }}
      >
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <span className="text-[#555577] text-4xl select-none">✦</span>
        )}
      </button>

      {/* Info */}
      <div className="px-3 py-2.5">
        {isRenaming ? (
          <input
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') { setNameInput(project.name); setIsRenaming(false); }
            }}
            className="w-full bg-[#1a1a2e] border border-[#e94560] text-[#eaeaea] rounded px-2 py-1 text-sm outline-none"
          />
        ) : (
          <p
            className="text-[#eaeaea] text-sm font-medium truncate cursor-pointer hover:text-[#e94560] transition-colors"
            onDoubleClick={() => setIsRenaming(true)}
            title="Double-click to rename"
          >
            {project.name}
          </p>
        )}
        <p className="text-[#555577] text-xs mt-0.5">
          {project.gridW}×{project.gridH} · {timeAgo(project.updatedAt)}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={() => navigate(`/editor/${project.id}`)}
            className="flex-1 py-1.5 bg-[#533483] text-white rounded-md text-xs font-semibold hover:opacity-80 active:scale-95 transition-all"
          >
            Open
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 bg-[#1a1a2e] border border-[#2a2a4a] text-[#8888aa] rounded-md text-xs hover:border-[#e94560] hover:text-[#e94560] active:scale-95 transition-all"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
