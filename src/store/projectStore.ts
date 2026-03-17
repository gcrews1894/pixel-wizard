import { create } from 'zustand';
import type { Project } from '../types/project';
import type { Pixels } from '../lib/canvas';
import * as api from '../lib/projectApi';

// ── Guest (localStorage) helpers ─────────────────────────────────────────────

const STORAGE_KEY = 'pixel-wizard-projects';
export const GUEST_LIMIT = 3;
export const FREE_LIMIT  = 10;

function makeEmptyPixels(w: number, h: number): Pixels {
  return Array.from({ length: h }, () => Array(w).fill(null));
}

function loadLocal(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(projects: Project[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // storage full — ignore
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface ProjectStore {
  projects: Project[];
  /** null = guest (localStorage mode) */
  userId: string | null;
  /** 'free' | 'pro' — only relevant when userId is set */
  subscriptionStatus: 'free' | 'pro';

  /** Call on sign-in: loads projects from Supabase and switches to cloud mode */
  syncFromCloud: (userId: string, subscriptionStatus: 'free' | 'pro') => Promise<void>;
  /** Call on sign-out: reverts to localStorage mode */
  resetToGuest: () => void;

  projectLimit: () => number;

  createProject: (name: string, w: number, h: number) => Promise<Project>;
  updateProject: (id: string, partial: Partial<Pick<Project, 'name' | 'pixels' | 'thumbnail'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: loadLocal(),
  userId: null,
  subscriptionStatus: 'free',

  syncFromCloud: async (userId, subscriptionStatus) => {
    const projects = await api.listProjects(userId);
    set({ projects, userId, subscriptionStatus });
  },

  resetToGuest: () => {
    set({ projects: loadLocal(), userId: null, subscriptionStatus: 'free' });
  },

  projectLimit: () => {
    const { userId, subscriptionStatus } = get();
    if (!userId) return GUEST_LIMIT;
    if (subscriptionStatus === 'pro') return Infinity;
    return FREE_LIMIT;
  },

  createProject: async (name, w, h) => {
    const { userId, projects } = get();
    if (userId) {
      const project = await api.createProject(userId, name, w, h);
      set({ projects: [project, ...projects] });
      return project;
    }
    // Guest path
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
    const updated = [project, ...projects];
    saveLocal(updated);
    set({ projects: updated });
    return project;
  },

  updateProject: async (id, partial) => {
    const { userId, projects } = get();
    if (userId) {
      await api.updateProject(id, partial);
    }
    const updated = projects.map(p =>
      p.id === id ? { ...p, ...partial, updatedAt: Date.now() } : p,
    );
    if (!userId) saveLocal(updated);
    set({ projects: updated });
  },

  deleteProject: async (id) => {
    const { userId, projects } = get();
    if (userId) {
      await api.deleteProject(id);
    }
    const updated = projects.filter(p => p.id !== id);
    if (!userId) saveLocal(updated);
    set({ projects: updated });
  },

  getProject: (id) => get().projects.find(p => p.id === id),
}));
