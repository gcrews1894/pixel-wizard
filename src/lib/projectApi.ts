import { supabase } from './supabase';
import type { Project } from '../types/project';
import type { Pixels } from './canvas';

function makeEmptyPixels(w: number, h: number): Pixels {
  return Array.from({ length: h }, () => Array(w).fill(null));
}

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
    gridW: row.grid_w as number,
    gridH: row.grid_h as number,
    pixels: (row.pixels as Pixels) ?? makeEmptyPixels(row.grid_w as number, row.grid_h as number),
    thumbnail: (row.thumbnail as string) ?? '',
  };
}

export async function listProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToProject);
}

export async function createProject(
  userId: string,
  name: string,
  w: number,
  h: number,
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: name.trim() || 'Untitled',
      grid_w: w,
      grid_h: h,
      pixels: makeEmptyPixels(w, h),
      thumbnail: '',
    })
    .select()
    .single();
  if (error) throw error;
  return rowToProject(data);
}

export async function duplicateProject(userId: string, source: Project): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: `${source.name} (copy)`,
      grid_w: source.gridW,
      grid_h: source.gridH,
      pixels: source.pixels,
      thumbnail: source.thumbnail,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToProject(data);
}

export async function updateProject(
  id: string,
  partial: Partial<Pick<Project, 'name' | 'pixels' | 'thumbnail'>>,
): Promise<void> {
  const dbPartial: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (partial.name !== undefined) dbPartial.name = partial.name;
  if (partial.pixels !== undefined) dbPartial.pixels = partial.pixels;
  if (partial.thumbnail !== undefined) dbPartial.thumbnail = partial.thumbnail;

  const { error } = await supabase.from('projects').update(dbPartial).eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}
