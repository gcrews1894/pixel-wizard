import { create } from 'zustand';
import type { Project } from '../types/project';
import type { Pixels } from '../lib/canvas';

const STORAGE_KEY = 'pixel-wizard-projects';

function makeEmptyPixels(w: number, h: number): Pixels {
  return Array.from({ length: h }, () => Array(w).fill(null));
}

function load(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(projects: Project[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // storage full — ignore
  }
}

interface ProjectStore {
  projects: Project[];
  createProject: (name: string, w: number, h: number) => Project;
  updateProject: (id: string, partial: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: load(),

  createProject: (name, w, h) => {
    const project: Project = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Untitled',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      gridW: w,
      gridH: h,
      pixels: makeEmptyPixels(w, h),
      thumbnail: '',
    };
    const projects = [project, ...get().projects];
    save(projects);
    set({ projects });
    return project;
  },

  updateProject: (id, partial) => {
    const projects = get().projects.map(p =>
      p.id === id ? { ...p, ...partial, updatedAt: Date.now() } : p,
    );
    save(projects);
    set({ projects });
  },

  deleteProject: (id) => {
    const projects = get().projects.filter(p => p.id !== id);
    save(projects);
    set({ projects });
  },

  getProject: (id) => get().projects.find(p => p.id === id),
}));
